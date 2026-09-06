"""Pydantic schemas for Event model."""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Any


class EventBase(BaseModel):
    title: str
    description: str
    event_type: str
    location_id: int | str
    start_time: datetime
    end_time: datetime
    organizer: str
    max_participants: Optional[int] = None
    registration_required: bool = False
    image_url: Optional[str] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    max_participants: Optional[int] = None
    status: Optional[str] = None


class EventInDB(EventBase):
    id: str
    registrations: int = 0
    crowd_estimate: str = "low"
    status: str = "upcoming"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class Event(EventInDB):
    pass


class EventRegistrationBase(BaseModel):
    event_id: str
    user_id: Any


class EventRegistrationCreate(EventRegistrationBase):
    pass


class EventRegistration(EventRegistrationBase):
    id: str
    registered_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
