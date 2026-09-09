"""Helpers for creating notifications across the Campus NEXUS backend — Firestore-backed.

Other endpoints (events, issues, library, faculty) import these helpers to
fire-and-forget notify relevant users.
"""

from __future__ import annotations

import uuid
from typing import Iterable, Optional

from app.core.firebase import db


def _new_notification_id() -> str:
    return f"notif_{uuid.uuid4().hex[:12]}"


async def create_notification(
    *,
    recipient_id: str,
    event: str,
    reason: str,
    priority: str = "info",
    data: Optional[str] = None,
) -> dict:
    """Create and persist a single notification for ``recipient_id`` in Firestore."""
    if db is None:
        return {}
    notif_id = _new_notification_id()
    notif_data = {
        "id": notif_id,
        "recipient_id": str(recipient_id),
        "event": event,
        "reason": reason,
        "priority": priority,
        "read": False,
        "data": data,
    }
    db.collection("notifications").document(notif_id).set(notif_data)
    return notif_data


async def bulk_create_notifications(
    *,
    recipient_ids: Iterable[str],
    event: str,
    reason: str,
    priority: str = "info",
    data: Optional[str] = None,
) -> list[dict]:
    """Create the same notification for many recipients in one pass."""
    if db is None:
        return []
    batch = db.batch()
    notifs = []
    for rid in recipient_ids:
        notif_id = _new_notification_id()
        notif_data = {
            "id": notif_id,
            "recipient_id": str(rid),
            "event": event,
            "reason": reason,
            "priority": priority,
            "read": False,
            "data": data,
        }
        doc_ref = db.collection("notifications").document(notif_id)
        batch.set(doc_ref, notif_data)
        notifs.append(notif_data)
    if notifs:
        batch.commit()
    return notifs


async def get_all_student_user_ids() -> list[str]:
    """Return user IDs for every active student in the system."""
    if db is None:
        return []
    users_ref = db.collection("users").where("role", "==", "student").where("isActive", "==", True).stream()
    return [doc.id for doc in users_ref]


async def get_all_faculty_user_ids() -> list[str]:
    """Return user IDs for every active faculty member in the system."""
    if db is None:
        return []
    users_ref = db.collection("users").where("role", "==", "faculty").where("isActive", "==", True).stream()
    return [doc.id for doc in users_ref]


async def get_all_admin_user_ids() -> list[str]:
    """Return user IDs for every active admin (including super_admins)."""
    if db is None:
        return []
    ids = []
    for role in ("admin", "super_admin"):
        users_ref = db.collection("users").where("role", "==", role).where("isActive", "==", True).stream()
        ids.extend(doc.id for doc in users_ref)
    return ids


# --------------------------------------------------------------------------- #
# Domain-specific helpers — call from other API endpoints
# --------------------------------------------------------------------------- #


async def notify_students_new_event(
    *,
    event_title: str,
    event_id: str,
    location: str,
    starts_at: Optional[str] = None,
) -> None:
    """Notify active students and faculty about a newly created event."""
    student_ids = await get_all_student_user_ids()
    faculty_ids = await get_all_faculty_user_ids()
    all_ids = list(set(student_ids + faculty_ids))
    when = f" on {starts_at}" if starts_at else ""
    reason = (
        f"New campus event: '{event_title}' at {location}{when}. "
        f"Check details on the events page."
    )
    await bulk_create_notifications(
        recipient_ids=all_ids,
        event="event_created",
        reason=reason,
        priority="medium",
        data=f'{{"event_id":"{event_id}"}}',
    )


async def notify_student_event_registration(
    *,
    student_user_id: str,
    event_title: str,
    event_id: str,
) -> None:
    """Confirm to a student that they have registered for an event."""
    await create_notification(
        recipient_id=student_user_id,
        event="event_registration_confirmed",
        reason=f"You're registered for '{event_title}'. We'll remind you before it starts.",
        priority="medium",
        data=f'{{"event_id":"{event_id}"}}',
    )


async def notify_admins_new_issue(
    *,
    issue_id: str,
    title: str,
    category: str,
    priority: str,
    location: str,
) -> None:
    """Notify every active admin about a newly reported issue."""
    admin_ids = await get_all_admin_user_ids()
    p = priority or "medium"
    notif_priority = "high" if p in ("high", "critical") else "medium"
    reason = (
        f"New {category} issue reported at {location}: '{title}'. "
        f"Priority: {p}."
    )
    await bulk_create_notifications(
        recipient_ids=admin_ids,
        event="issue_reported",
        reason=reason,
        priority=notif_priority,
        data=f'{{"issue_id":"{issue_id}"}}',
    )


async def notify_student_issue_status_change(
    *,
    reporter_user_id: str,
    issue_id: str,
    title: str,
    new_status: str,
) -> None:
    """Notify the issue reporter when status changes."""
    await create_notification(
        recipient_id=reporter_user_id,
        event="issue_status_updated",
        reason=f"Your reported issue is now '{new_status}': '{title}'.",
        priority="medium",
        data=f'{{"issue_id":"{issue_id}","status":"{new_status}"}}',
    )


async def notify_student_book_reserved(
    *,
    student_user_id: str,
    book_title: str,
    book_id: str,
    pickup_deadline: Optional[str] = None,
) -> None:
    """Confirm a successful book reservation to the student."""
    when = f" Pick up by {pickup_deadline}." if pickup_deadline else ""
    await create_notification(
        recipient_id=student_user_id,
        event="book_reserved",
        reason=f"Reservation confirmed for '{book_title}'.{when}",
        priority="medium",
        data=f'{{"book_id":"{book_id}"}}',
    )


async def notify_student_reservation_status_change(
    *,
    student_user_id: str,
    book_id: str,
    reservation_id: str,
    new_status: str,
) -> None:
    """Notify the student when a reservation status is updated by admin."""
    await create_notification(
        recipient_id=student_user_id,
        event="reservation_status_updated",
        reason=f"Your library reservation (ID: {reservation_id}) status has been updated to '{new_status}'.",
        priority="medium",
        data=f'{{"reservation_id":"{reservation_id}","book_id":"{book_id}","status":"{new_status}"}}',
    )


async def notify_students_faculty_availability_changed(
    *,
    faculty_user_id: str,
    faculty_name: str,
    is_available: bool,
) -> None:
    """Notify students that faculty availability changed."""
    student_ids = await get_all_student_user_ids()
    state = "available" if is_available else "unavailable"
    reason = (
        f"Faculty availability update: {faculty_name} is now {state} for office hours."
    )
    await bulk_create_notifications(
        recipient_ids=student_ids,
        event="faculty_availability_changed",
        reason=reason,
        priority="low",
        data=f'{{"faculty_user_id":"{faculty_user_id}","is_available":{str(is_available).lower()}}}',
    )