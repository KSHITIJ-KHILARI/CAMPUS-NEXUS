"""Issues API v1 routes for Campus NEXUS."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
import uuid

from app.api.deps import get_current_db, get_current_active_user, require_admin
from app.models.issue import Issue as IssueModel
from app.models.campus_location import CampusLocation
from app.models.user import User
from app.services.notification_service import (
    notify_admins_new_issue,
)
from app.models.notification import Notification as NotificationModel

router = APIRouter()


class IssueOut(BaseModel):
    id: str
    title: str
    category: str
    location: str
    location_type: Optional[str] = None
    description: Optional[str] = None
    priority: str
    status: str
    report_count: int
    assigned_to: Optional[str] = None
    reporter_id: Optional[str] = None
    reporter_name: Optional[str] = None
    reporter_role: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CreateIssueRequest(BaseModel):
    title: str
    category: str = "projector"
    location: str = "CSB 301"
    description: Optional[str] = None
    priority: str = "medium"


class UpdateIssueRequest(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    description: Optional[str] = None


class AssignIssueRequest(BaseModel):
    assigneeId: Optional[str] = "EMP_MAINT_01"


async def _resolve_location_id(db: AsyncSession, location_name: str) -> int:
    """Resolve location name to a campus_locations.id; create if missing."""
    if not location_name:
        location_name = "Main Campus"
    res = await db.execute(
        select(CampusLocation).where(CampusLocation.name == location_name)
    )
    loc = res.scalars().first()
    if loc:
        return int(loc.id)
    loc = CampusLocation(
        name=location_name,
        location_type="building",
        latitude=0.0,
        longitude=0.0,
        is_accessible=True,
    )
    db.add(loc)
    await db.flush()
    return int(loc.id)


def _to_out(i: IssueModel, location_name: str | None = None) -> IssueOut:
    reporter_name = None
    reporter_role = None
    reporter_id = None
    if getattr(i, "reporter", None):
        reporter_id = str(i.reporter.id)
        reporter_name = i.reporter.full_name
        reporter_role = str(i.reporter.role) if i.reporter.role else None
    return IssueOut(
        id=str(i.id),
        title=i.title,
        category=i.category,
        location=location_name or "Campus",
        location_type=i.location.location_type if i.location else None,
        description=i.description,
        priority=i.priority,
        status=i.status,
        report_count=i.report_count or 1,
        assigned_to=str(i.assigned_to) if i.assigned_to else None,
        reporter_id=reporter_id,
        reporter_name=reporter_name,
        reporter_role=reporter_role,
        created_at=i.created_at or datetime.utcnow(),
        updated_at=i.updated_at,
        resolved_at=i.resolved_at,
    )


async def _create_notification(
    db: AsyncSession,
    recipient_id: uuid.UUID,
    event: str,
    reason: str,
    priority: str = "info",
    data: Optional[dict] = None,
) -> None:
    """Persist a notification row for a user."""
    try:
        notif = NotificationModel(
            id=f"notif_{uuid.uuid4().hex[:12]}",
            recipient_id=recipient_id,
            event=event,
            reason=reason,
            priority=priority,
            read=False,
            data=str(data) if data else None,
            timestamp=datetime.utcnow(),
        )
        db.add(notif)
        await db.flush()
    except Exception:
        # Never let a notification failure block the primary flow
        pass


@router.get("", response_model=List[IssueOut], tags=["issues"])
@router.get("/", response_model=List[IssueOut], tags=["issues"])
async def list_issues(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all campus infrastructure issues."""
    stmt = (
        select(IssueModel)
        .options(
            selectinload(IssueModel.location),
            selectinload(IssueModel.reporter),
            selectinload(IssueModel.assigned_to_user),
        )
    )
    if status:
        stmt = stmt.where(IssueModel.status == status)
    if priority:
        stmt = stmt.where(IssueModel.priority == priority)

    result = await db.execute(stmt)
    issues = result.scalars().all()

    out: list[IssueOut] = []
    for i in issues:
        loc_name = i.location.name if i.location else "Campus"
        out.append(_to_out(i, loc_name))
    return out


@router.get("/{issue_id}", response_model=IssueOut, tags=["issues"])
async def get_issue(
    issue_id: str,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get single issue details."""
    result = await db.execute(
        select(IssueModel)
        .options(
            selectinload(IssueModel.location),
            selectinload(IssueModel.reporter),
            selectinload(IssueModel.assigned_to_user),
        )
        .where(IssueModel.id == issue_id)
    )
    i = result.scalars().first()
    if not i:
        raise HTTPException(status_code=404, detail="Issue not found")
    return _to_out(i, i.location.name if i.location else "Campus")


@router.post("", response_model=IssueOut, tags=["issues"])
@router.post("/", response_model=IssueOut, tags=["issues"])
@router.post("/report", response_model=IssueOut, tags=["issues"])
async def create_issue(
    payload: CreateIssueRequest,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create/report a new campus issue in PostgreSQL.

    The authenticated user (student/faculty) becomes the reporter.
    """
    loc_id = await _resolve_location_id(db, payload.location)
    issue_id = f"issue_{uuid.uuid4().hex[:8]}"
    issue = IssueModel(
        id=issue_id,
        title=payload.title,
        category=payload.category,
        location_id=loc_id,
        description=payload.description or f"Reported at {payload.location}",
        priority=payload.priority,
        status="open",
        report_count=1,
        confidence=1.0,
        reporter_id=current_user.id,
    )
    db.add(issue)
    await db.flush()

    # Notify all admin users of the new incident
    admin_res = await db.execute(
        select(User).where(User.role.in_(["admin", "super_admin"]))
    )
    admins = admin_res.scalars().all()
    for admin in admins:
        await _create_notification(
            db,
            recipient_id=admin.id,
            event="issue.reported",
            reason=f"New issue reported by {current_user.full_name}: '{payload.title}' at {payload.location}",
            priority="warning" if payload.priority in ("high", "critical") else "info",
            data={
                "issue_id": issue_id,
                "reporter_id": str(current_user.id),
                "priority": payload.priority,
                "category": payload.category,
            },
        )

    # Confirm back to the reporter
    await _create_notification(
        db,
        recipient_id=current_user.id,
        event="issue.reported.ack",
        reason=f"Your report '{payload.title}' has been submitted to Campus Operations.",
        priority="success",
        data={"issue_id": issue_id},
    )

    await db.commit()
    await db.refresh(issue)
    result = await db.execute(
        select(IssueModel)
        .options(
            selectinload(IssueModel.location),
            selectinload(IssueModel.reporter),
        )
        .where(IssueModel.id == issue_id)
    )
    i = result.scalars().first()
    return _to_out(i, i.location.name if i and i.location else payload.location)


@router.patch("/{issue_id}", response_model=IssueOut, tags=["issues"])
async def update_issue(
    issue_id: str,
    payload: UpdateIssueRequest,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(require_admin),
):
    """Update issue status or priority (admin only)."""
    result = await db.execute(
        select(IssueModel)
        .options(
            selectinload(IssueModel.location),
            selectinload(IssueModel.reporter),
        )
        .where(IssueModel.id == issue_id)
    )
    issue = result.scalars().first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    old_status = issue.status
    old_assigned = str(issue.assigned_to) if issue.assigned_to else None

    if payload.status is not None:
        issue.status = payload.status
        if payload.status == "resolved":
            issue.resolved_at = datetime.utcnow()
    if payload.priority is not None:
        issue.priority = payload.priority
    if payload.description is not None:
        issue.description = payload.description
    if payload.assigned_to is not None:
        try:
            issue.assigned_to = uuid.UUID(payload.assigned_to)
        except (ValueError, TypeError):
            pass

    new_status = issue.status
    new_assigned = str(issue.assigned_to) if issue.assigned_to else None

    # Notify the reporter of status / assignment changes
    if issue.reporter_id:
        events = []
        if payload.status is not None and payload.status != old_status:
            events.append(
                (
                    f"issue.status.{new_status}",
                    f"Your issue '{issue.title}' status changed to {new_status}.",
                    "success" if new_status == "resolved" else "info",
                )
            )
        if payload.assigned_to is not None and new_assigned != old_assigned:
            events.append(
                (
                    "issue.assigned",
                    f"Your issue '{issue.title}' has been assigned for resolution.",
                    "info",
                )
            )
        if payload.priority is not None:
            events.append(
                (
                    "issue.priority",
                    f"Your issue '{issue.title}' priority was set to {issue.priority}.",
                    "warning" if issue.priority in ("high", "critical") else "info",
                )
            )
        for ev, reason, prio in events:
            await _create_notification(
                db,
                recipient_id=issue.reporter_id,
                event=ev,
                reason=reason,
                priority=prio,
                data={"issue_id": issue.id, "status": new_status},
            )

    issue.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(issue)
    return _to_out(issue, issue.location.name if issue.location else "Campus")


@router.post("/{issue_id}/assign", tags=["issues"])
async def assign_issue(
    issue_id: str,
    payload: AssignIssueRequest,
    db: AsyncSession = Depends(get_current_db),
    _: User = Depends(require_admin),
):
    """Assign issue to maintenance staff (admin only)."""
    result = await db.execute(
        select(IssueModel)
        .options(selectinload(IssueModel.reporter))
        .where(IssueModel.id == issue_id)
    )
    issue = result.scalars().first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.status = "in_progress"
    try:
        if payload.assigneeId:
            issue.assigned_to = uuid.UUID(payload.assigneeId)
    except (ValueError, TypeError):
        pass
    issue.updated_at = datetime.utcnow()

    if issue.reporter_id:
        await _create_notification(
            db,
            recipient_id=issue.reporter_id,
            event="issue.assigned",
            reason=f"Your issue '{issue.title}' has been assigned to maintenance ({payload.assigneeId}).",
            priority="info",
            data={"issue_id": issue.id, "assignee": payload.assigneeId},
        )

    await db.commit()
    return {
        "message": f"Issue '{issue.title}' assigned to {payload.assigneeId}",
        "status": "in_progress",
    }
