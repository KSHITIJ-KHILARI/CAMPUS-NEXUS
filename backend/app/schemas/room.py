from pydantic import ConfigDict
"""Pydantic schemas for Room model."""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class RoomBase(BaseModel):
    """Base room schema."""
    room_number: str
    name: Optional[str] = None
    type: str = "classroom"
    capacity: int = 30
    equipment: Optional[str] = None
    accessibility: bool = True


class RoomCreate(RoomBase):
    """Schema for creating a room."""
    building_id: str
    floor_id: str


class RoomUpdate(BaseModel):
    """Schema for updating a room."""
    name: Optional[str] = None
    status: Optional[str] = None
    equipment: Optional[str] = None
    current_class: Optional[str] = None
    next_available: Optional[datetime] = None


class RoomInDB(RoomBase):
    """Schema for room from database."""
    id: str
    building_id: str
    floor_id: str
    status: str
    current_class: Optional[str] = None
    next_available: Optional[datetime] = None
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)


class Room(RoomInDB):
    """Schema for room response."""
    pass


class RoomAvailability(BaseModel):
    """Schema for room availability response."""
    room_id: str
    room_number: str
    building: str
    available: bool
    next_available: Optional[datetime] = None
    current_class: Optional[str] = None
