"""Helpers for creating notifications across the Campus NEXUS backend.

Other endpoints (events, issues, library, faculty) import these helpers to
fire-and-forget notify relevant users.
"""

from __future__ import annotations

import uuid
from typing import Iterable, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Admin, Notification, Student, User


def _new_notification_id() -> str:
    return f"notif_{uuid.uuid4().hex[:12]}"


async def create_notification(
    db: AsyncSession,
    *,
    recipient_id: uuid.UUID,
    event: str,
    reason: str,
    priority: str = "info",
    data: Optional[str] = None,
) -> Notification:
    """Create and persist a single notification for ``recipient_id``."""
    notif = Notification(
        id=_new_notification_id(),
        recipient_id=recipient_id,
        event=event,
        reason=reason,
        priority=priority,
        read=False,
        data=data,
    )
    db.add(notif)
    return notif


async def bulk_create_notifications(
    db: AsyncSession,
    *,
    recipient_ids: Iterable[uuid.UUID],
    event: str,
    reason: str,
    priority: str = "info",
    data: Optional[str] = None,
) -> list[Notification]:
    """Create the same notification for many recipients in one pass."""
    notifs = [
        Notification(
            id=_new_notification_id(),
            recipient_id=rid,
            event=event,
            reason=reason,
            priority=priority,
            read=False,
            data=data,
        )
        for rid in recipient_ids
    ]
    if notifs:
        db.add_all(notifs)
    return notifs


async def get_all_student_user_ids(db: AsyncSession) -> list[uuid.UUID]:
    """Return user IDs for every active student in the system."""
    res = await db.execute(
        select(User.id).join(Student, Student.user_id == User.id).where(User.is_active == True)
    )
    return [row[0] for row in res.all()]


async def get_all_faculty_user_ids(db: AsyncSession) -> list[uuid.UUID]:
    """Return user IDs for every active faculty member in the system."""
    from app.models.faculty import Faculty
    res = await db.execute(
        select(User.id).join(Faculty, Faculty.user_id == User.id).where(User.is_active == True)
    )
    return [row[0] for row in res.all()]


async def get_all_admin_user_ids(db: AsyncSession) -> list[uuid.UUID]:
    """Return user IDs for every active admin (including super_admins)."""
    res = await db.execute(
        select(User.id).join(Admin, Admin.user_id == User.id).where(User.is_active == True)
    )
    return [row[0] for row in res.all()]


# --------------------------------------------------------------------------- #
# Domain-specific helpers — call from other API endpoints
# --------------------------------------------------------------------------- #


async def notify_students_new_event(
    db: AsyncSession,
    *,
    event_title: str,
    event_id: str,
    location: str,
    starts_at: Optional[str] = None,
) -> None:
    """Notify active students and faculty about a newly created event."""
    student_ids = await get_all_student_user_ids(db)
    faculty_ids = await get_all_faculty_user_ids(db)
    all_ids = list(set(student_ids + faculty_ids))
    when = f" on {starts_at}" if starts_at else ""
    reason = (
        f"New campus event: '{event_title}' at {location}{when}. "
        f"Check details on the events page."
    )
    await bulk_create_notifications(
        db,
        recipient_ids=all_ids,
        event="event_created",
        reason=reason,
        priority="medium",
        data=f'{{"event_id":"{event_id}"}}',
    )


async def notify_student_event_registration(
    db: AsyncSession,
    *,
    student_user_id: uuid.UUID,
    event_title: str,
    event_id: str,
) -> None:
    """Confirm to a student that they have registered for an event."""
    await create_notification(
        db,
        recipient_id=student_user_id,
        event="event_registration_confirmed",
        reason=f"You're registered for '{event_title}'. We'll remind you before it starts.",
        priority="medium",
        data=f'{{"event_id":"{event_id}"}}',
    )


async def notify_admins_new_issue(
    db: AsyncSession,
    *,
    issue_id: str,
    title: str,
    category: str,
    priority: str,
    location: str,
) -> None:
    """Notify every active admin about a newly reported issue."""
    admin_ids = await get_all_admin_user_ids(db)
    p = priority or "medium"
    notif_priority = "high" if p in ("high", "critical") else "medium"
    reason = (
        f"New {category} issue reported at {location}: '{title}'. "
        f"Priority: {p}."
    )
    await bulk_create_notifications(
        db,
        recipient_ids=admin_ids,
        event="issue_reported",
        reason=reason,
        priority=notif_priority,
        data=f'{{"issue_id":"{issue_id}"}}',
    )


async def notify_student_issue_status_change(
    db: AsyncSession,
    *,
    reporter_user_id: uuid.UUID,
    issue_id: str,
    title: str,
    new_status: str,
) -> None:
    """Notify the issue reporter when status changes."""
    await create_notification(
        db,
        recipient_id=reporter_user_id,
        event="issue_status_updated",
        reason=f"Your reported issue is now '{new_status}': '{title}'.",
        priority="medium",
        data=f'{{"issue_id":"{issue_id}","status":"{new_status}"}}',
    )


async def notify_student_book_reserved(
    db: AsyncSession,
    *,
    student_user_id: uuid.UUID,
    book_title: str,
    book_id: str,
    pickup_deadline: Optional[str] = None,
) -> None:
    """Confirm a successful book reservation to the student."""
    when = f" Pick up by {pickup_deadline}." if pickup_deadline else ""
    await create_notification(
        db,
        recipient_id=student_user_id,
        event="book_reserved",
        reason=f"Reservation confirmed for '{book_title}'.{when}",
        priority="medium",
        data=f'{{"book_id":"{book_id}"}}',
    )


async def notify_student_reservation_status_change(
    db: AsyncSession,
    *,
    student_user_id: uuid.UUID,
    book_id: str,
    reservation_id: str,
    new_status: str,
) -> None:
    """Notify the student when a reservation status is updated by admin."""
    await create_notification(
        db,
        recipient_id=student_user_id,
        event="reservation_status_updated",
        reason=f"Your library reservation (ID: {reservation_id}) status has been updated to '{new_status}'.",
        priority="medium",
        data=f'{{"reservation_id":"{reservation_id}","book_id":"{book_id}","status":"{new_status}"}}',
    )


async def notify_students_faculty_availability_changed(
    db: AsyncSession,
    *,
    faculty_user_id: uuid.UUID,
    faculty_name: str,
    is_available: bool,
) -> None:
    """Notify students currently tracking a faculty that availability changed.

    We don't currently track per-student faculty "subscriptions", so we
    broadcast to all active students. This is intentionally lightweight.
    """
    student_ids = await get_all_student_user_ids(db)
    state = "available" if is_available else "unavailable"
    reason = (
        f"Faculty availability update: {faculty_name} is now {state} for office hours."
    )
    await bulk_create_notifications(
        db,
        recipient_ids=student_ids,
        event="faculty_availability_changed",
        reason=reason,
        priority="low",
        data=f'{{"faculty_user_id":"{faculty_user_id}","is_available":{str(is_available).lower()}}}',
    )