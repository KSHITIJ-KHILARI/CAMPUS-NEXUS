"""Events API v1 routes for Campus NEXUS."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
import uuid

from app.api.deps import get_current_db, get_current_active_user, require_admin
from app.models.event import Event as EventModel, EventStatus
from app.models.campus_location import CampusLocation
from app.models.event_registration import EventRegistration, RegistrationStatus
from app.models.user import User
from app.services.notification_service import (
    notify_student_event_registration,
    notify_students_new_event,
)

router = APIRouter()


class EventOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    location: str
    start_time: datetime
    end_time: datetime
    organizer: Optional[str] = None
    capacity: int
    registrations: int
    status: str

    class Config:
        from_attributes = True


class EventCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    location: str = "Gargi Plaza"
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    organizer: Optional[str] = "Student Activity Center"
    capacity: int = 150


class EventUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    capacity: Optional[int] = None
    status: Optional[str] = None


async def _resolve_location(db: AsyncSession, location_name: str) -> int:
    """Resolve a location name to a campus_locations.id, creating if needed."""
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
        location_type="plaza",
        latitude=0.0,
        longitude=0.0,
        is_accessible=True,
    )
    db.add(loc)
    await db.flush()
    return int(loc.id)


def _to_out(e: EventModel, location_name: str | None = None) -> EventOut:
    return EventOut(
        id=str(e.id),
        title=e.title,
        description=e.description,
        location=location_name or "Campus",
        start_time=e.start_time or datetime.utcnow(),
        end_time=e.end_time or datetime.utcnow(),
        organizer=e.organizer,
        capacity=e.max_participants or 100,
        registrations=e.registrations or 0,
        status=e.status or "upcoming",
    )


@router.get("", response_model=List[EventOut], tags=["events"])
@router.get("/", response_model=List[EventOut], tags=["events"])
async def list_events(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """List campus events."""
    query = (
        select(EventModel, CampusLocation.name)
        .outerjoin(CampusLocation, EventModel.location_id == CampusLocation.id)
    )
    if status:
        query = query.where(EventModel.status == status)
    result = await db.execute(query)
    rows = result.all()

    out: list[EventOut] = []
    for event, loc_name in rows:
        out.append(_to_out(event, loc_name or "Campus"))
    return out


@router.get("/{event_id}", response_model=EventOut, tags=["events"])
async def get_event(
    event_id: str,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get event details."""
    query = (
        select(EventModel, CampusLocation.name)
        .outerjoin(CampusLocation, EventModel.location_id == CampusLocation.id)
        .where(EventModel.id == event_id)
    )
    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Event not found")
    event, loc_name = row
    return _to_out(event, loc_name or "Campus")


@router.post("", response_model=EventOut, tags=["events"])
@router.post("/", response_model=EventOut, tags=["events"])
async def create_event(
    payload: EventCreateRequest,
    db: AsyncSession = Depends(get_current_db),
    _: User = Depends(require_admin),
):
    """Create a new event in PostgreSQL (admin only)."""
    loc_id = await _resolve_location(db, payload.location)
    now = datetime.utcnow()
    ev = EventModel(
        id=f"evt_{uuid.uuid4().hex[:8]}",
        title=payload.title,
        description=payload.description,
        event_type="other",
        location_id=loc_id,
        start_time=payload.start_time or now,
        end_time=payload.end_time or now,
        organizer=payload.organizer,
        max_participants=payload.capacity,
        registrations=0,
        status=EventStatus.UPCOMING.value,
    )
    db.add(ev)
    await db.commit()
    await db.refresh(ev)
    result = await db.execute(
        select(EventModel).options(selectinload(EventModel.location)).where(EventModel.id == ev.id)
    )
    ev2 = result.scalars().first()
    loc_name = ev2.location.name if ev2 and ev2.location else payload.location
    try:
        await notify_students_new_event(
            db,
            event_title=ev.title,
            event_id=str(ev.id),
            location=loc_name,
            starts_at=ev.start_time.isoformat() if ev.start_time else None,
        )
        await db.commit()
    except Exception:
        pass
    return _to_out(ev2, loc_name)


@router.put("/{event_id}", response_model=EventOut, tags=["events"])
async def update_event(
    event_id: str,
    payload: EventUpdateRequest,
    db: AsyncSession = Depends(get_current_db),
    _: User = Depends(require_admin),
):
    """Update event record in PostgreSQL (admin only)."""
    result = await db.execute(
        select(EventModel).options(selectinload(EventModel.location)).where(EventModel.id == event_id)
    )
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if payload.title is not None:
        event.title = payload.title
    if payload.description is not None:
        event.description = payload.description
    if payload.location is not None:
        event.location_id = await _resolve_location(db, payload.location)
    if payload.start_time is not None:
        event.start_time = payload.start_time
    if payload.end_time is not None:
        event.end_time = payload.end_time
    if payload.capacity is not None:
        event.max_participants = payload.capacity
    if payload.status is not None:
        event.status = payload.status

    await db.commit()
    await db.refresh(event)
    return _to_out(event, event.location.name if event.location else "Campus")


@router.delete("/{event_id}", tags=["events"])
async def delete_event(
    event_id: str,
    db: AsyncSession = Depends(get_current_db),
    _: User = Depends(require_admin),
):
    """Delete/Archive an event (admin only)."""
    result = await db.execute(select(EventModel).where(EventModel.id == event_id))
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    await db.delete(event)
    await db.commit()
    return {"message": f"Event '{event.title}' successfully deleted"}


@router.post("/{event_id}/register", tags=["events"])
async def register_for_event(
    event_id: str,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Register student for an event."""
    result = await db.execute(select(EventModel).where(EventModel.id == event_id))
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    existing = await db.execute(
        select(EventRegistration).where(
            EventRegistration.event_id == event.id,
            EventRegistration.user_id == current_user.id,
            EventRegistration.status != RegistrationStatus.CANCELLED.value,
        )
    )
    if existing.scalars().first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already registered for this event",
        )

    registration = EventRegistration(
        event_id=event.id,
        user_id=current_user.id,
        status=RegistrationStatus.REGISTERED.value,
        registered_at=datetime.utcnow().isoformat(),
    )
    db.add(registration)
    event.registrations = (event.registrations or 0) + 1
    try:
        await notify_student_event_registration(
            db,
            student_user_id=current_user.id,
            event_title=event.title,
            event_id=str(event.id),
        )
    except Exception:
        pass
    await db.commit()
    return {"message": "Registered successfully", "registrations": event.registrations}


@router.delete("/{event_id}/registration", tags=["events"])
async def cancel_event_registration(
    event_id: str,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Cancel student's event registration."""
    result = await db.execute(select(EventModel).where(EventModel.id == event_id))
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    reg_res = await db.execute(
        select(EventRegistration).where(
            EventRegistration.event_id == event.id,
            EventRegistration.user_id == current_user.id,
        )
    )
    registration = reg_res.scalars().first()
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    registration.status = RegistrationStatus.CANCELLED.value
    event.registrations = max((event.registrations or 0) - 1, 0)
    await db.commit()
    return {"message": "Registration cancelled successfully", "registrations": event.registrations}


@router.get("/{event_id}/registrations", tags=["events"])
async def get_event_registrations(
    event_id: str,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get registration status for current user for this event."""
    result = await db.execute(select(EventModel).where(EventModel.id == event_id))
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    reg_res = await db.execute(
        select(EventRegistration).where(
            EventRegistration.event_id == event.id,
            EventRegistration.user_id == current_user.id,
        )
    )
    registration = reg_res.scalars().first()
    is_registered = bool(registration and registration.status != RegistrationStatus.CANCELLED.value)
    return {
        "registered": is_registered,
        "registrations": event.registrations or 0,
        "capacity": event.max_participants or 100,
    }
