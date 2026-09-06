"""Emergency Incident and Dispatch API v1 routes for Campus NEXUS."""

from datetime import datetime
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_db, get_current_user, get_current_active_user, require_admin, oauth2_scheme
from app.models.emergency import EmergencyReport
from app.models.user import User
from app.schemas.emergency import EmergencyCreate, EmergencyStatusUpdate, EmergencyResponse

router = APIRouter()


def _severity_sort_key(severity: str) -> int:
    ranks = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    return ranks.get(str(severity).upper(), 4)


@router.post("/report", response_model=EmergencyResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=EmergencyResponse, status_code=status.HTTP_201_CREATED)
async def report_emergency(
    payload: EmergencyCreate,
    db: AsyncSession = Depends(get_current_db),
    token: Optional[str] = Depends(oauth2_scheme),
):
    """Report an emergency SOS incident across campus.
    
    Can be called with authenticated credentials or as an immediate fast-action SOS.
    """
    reporter: Optional[User] = None
    if token and token not in ("undefined", "null"):
        try:
            reporter = await get_current_user(token=token, db=db)
        except Exception:
            reporter = None

    incident = EmergencyReport(
        id=uuid.uuid4(),
        reporter_id=reporter.id if reporter else None,
        reporter_name=payload.reporter_name or (reporter.full_name if reporter else "Anonymous/Guest"),
        reporter_phone=payload.reporter_phone or (reporter.phone if reporter else None),
        reporter_role=str(reporter.role) if reporter else "student",
        emergency_type=payload.emergency_type.upper(),
        severity=payload.severity.upper(),
        location_name=payload.location_name,
        building_id=payload.building_id,
        coordinates=payload.coordinates,
        description=payload.description,
        status="REPORTED",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(incident)
    await db.commit()
    await db.refresh(incident)

    return incident


@router.get("/active", response_model=List[EmergencyResponse])
async def list_active_emergencies(
    db: AsyncSession = Depends(get_current_db),
):
    """Retrieve all active (unresolved) emergencies sorted by severity and timestamp."""
    stmt = (
        select(EmergencyReport)
        .where(EmergencyReport.status != "RESOLVED")
        .order_by(EmergencyReport.created_at.desc())
    )
    result = await db.execute(stmt)
    reports = result.scalars().all()

    # Sort in memory by severity priority, then created_at
    sorted_reports = sorted(
        reports,
        key=lambda r: (_severity_sort_key(r.severity), -(r.created_at.timestamp() if r.created_at else 0)),
    )
    return sorted_reports


@router.get("/all", response_model=List[EmergencyResponse])
async def list_all_emergencies(
    db: AsyncSession = Depends(get_current_db),
    _: User = Depends(require_admin),
):
    """Retrieve full history of all emergency incidents (Admin Dispatch only)."""
    stmt = select(EmergencyReport).order_by(EmergencyReport.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{incident_id}", response_model=EmergencyResponse)
async def get_emergency_incident(
    incident_id: uuid.UUID,
    db: AsyncSession = Depends(get_current_db),
):
    """Get single incident tracking record."""
    stmt = select(EmergencyReport).where(EmergencyReport.id == incident_id)
    result = await db.execute(stmt)
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency incident not found")
    return incident


@router.patch("/{incident_id}/status", response_model=EmergencyResponse)
async def update_emergency_status(
    incident_id: uuid.UUID,
    payload: EmergencyStatusUpdate,
    db: AsyncSession = Depends(get_current_db),
    admin_user: User = Depends(require_admin),
):
    """Dispatch workflow update: REPORTED -> ACKNOWLEDGED -> RESPONDER_ASSIGNED -> IN_PROGRESS -> RESOLVED.
    
    Restricted to Campus Security Dispatch / Admin roles.
    """
    stmt = select(EmergencyReport).where(EmergencyReport.id == incident_id)
    result = await db.execute(stmt)
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency incident not found")

    new_status = payload.status.upper()
    valid_statuses = {"REPORTED", "ACKNOWLEDGED", "RESPONDER_ASSIGNED", "IN_PROGRESS", "RESOLVED"}
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{payload.status}'. Must be one of {valid_statuses}",
        )

    incident.status = new_status
    if payload.assigned_responder is not None:
        incident.assigned_responder = payload.assigned_responder
    if payload.admin_notes is not None:
        incident.admin_notes = payload.admin_notes

    incident.updated_at = datetime.utcnow()
    if new_status == "RESOLVED":
        incident.resolved_at = datetime.utcnow()

    await db.commit()
    await db.refresh(incident)
    return incident
