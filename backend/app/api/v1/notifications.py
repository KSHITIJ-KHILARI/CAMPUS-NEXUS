"""Notifications API routes."""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_active_user, get_current_db
from app.models.notification import Notification as NotificationModel
from app.models.user import User
from app.schemas.notification import Notification as NotificationSchema

router = APIRouter()


class NotificationCreateRequest(BaseModel):
    recipient_id: Optional[str] = None
    event: str
    reason: str
    priority: str = "info"
    data: Optional[dict] = None

    model_config = ConfigDict(extra="ignore")


class UnreadCountResponse(BaseModel):
    unread: int
    count: int


def _serialize(n: NotificationModel) -> NotificationSchema:
    return NotificationSchema.model_validate(n)


@router.get("", response_model=List[NotificationSchema], tags=["notifications"])
@router.get("/", response_model=List[NotificationSchema], tags=["notifications"])
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get notifications for the current user (newest first)."""
    query = (
        select(NotificationModel)
        .where(NotificationModel.recipient_id == current_user.id)
        .order_by(NotificationModel.timestamp.desc())
        .limit(limit)
    )
    if unread_only:
        query = query.where(NotificationModel.read == False)
    result = await db.execute(query)
    notifications = result.scalars().all()
    return [_serialize(n) for n in notifications]


@router.get("/unread", response_model=UnreadCountResponse, tags=["notifications"])
async def get_unread_count(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return the number of unread notifications for the current user."""
    result = await db.execute(
        select(NotificationModel).where(
            NotificationModel.recipient_id == current_user.id,
            NotificationModel.read == False,
        )
    )
    rows = result.scalars().all()
    count = len(rows)
    return UnreadCountResponse(unread=count, count=count)


@router.post("", response_model=NotificationSchema, tags=["notifications"])
@router.post("/", response_model=NotificationSchema, tags=["notifications"])
async def create_notification(
    payload: NotificationCreateRequest,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a single notification for ``recipient_id`` (or the current user).

    Intended to be called by other backend services. Authenticated users
    can target themselves; admins can target any user.
    """
    import uuid as _uuid

    target_id_str = payload.recipient_id or str(current_user.id)
    try:
        target_id = _uuid.UUID(target_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid recipient_id")

    user_role = str(getattr(current_user.role, "value", current_user.role))
    if target_id != current_user.id and user_role not in ("admin", "super_admin"):
        raise HTTPException(
            status_code=403,
            detail="Only admins can create notifications for other users",
        )

    import json
    data_str = json.dumps(payload.data) if payload.data is not None else None
    notif = NotificationModel(
        id=f"notif_{_uuid.uuid4().hex[:12]}",
        recipient_id=target_id,
        event=payload.event,
        reason=payload.reason,
        priority=payload.priority or "info",
        read=False,
        data=data_str,
        timestamp=datetime.utcnow(),
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return _serialize(notif)


@router.post("/read-all", tags=["notifications"])
async def mark_all_read(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Mark every unread notification for the current user as read."""
    result = await db.execute(
        update(NotificationModel)
        .where(
            NotificationModel.recipient_id == current_user.id,
            NotificationModel.read == False,
        )
        .values(read=True)
    )
    await db.commit()
    return {"message": "All notifications marked as read", "updated": result.rowcount or 0}


@router.post("/{notification_id}/read", tags=["notifications"])
async def mark_notification_read(
    notification_id: str,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Mark a single notification as read."""
    result = await db.execute(
        select(NotificationModel).where(
            NotificationModel.id == notification_id,
            NotificationModel.recipient_id == current_user.id,
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.read = True
    await db.commit()
    return {"message": "Marked as read", "id": notification_id}


@router.delete("/{notification_id}", tags=["notifications"])
async def delete_notification(
    notification_id: str,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a single notification for the current user."""
    result = await db.execute(
        select(NotificationModel).where(
            NotificationModel.id == notification_id,
            NotificationModel.recipient_id == current_user.id,
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    await db.delete(notification)
    await db.commit()
    return {"message": "Notification deleted", "id": notification_id}