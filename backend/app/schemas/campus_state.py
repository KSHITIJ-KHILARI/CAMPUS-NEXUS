"""Pydantic schemas for CampusState model."""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any


class CampusStateBase(BaseModel):
    """Base campus state schema."""
    state_data: Dict[str, Any]
    buildings: Dict[str, Any]
    rooms: Dict[str, Any]
    crowd: Dict[str, Any]
    issues: Dict[str, Any]
    lifts: Dict[str, Any]
    events: Dict[str, Any]
    last_updated: datetime


class CampusStateCreate(CampusStateBase):
    """Schema for creating campus state."""
    pass


class CampusStateUpdate(BaseModel):
    """Schema for updating campus state."""
    state_data: Optional[Dict[str, Any]] = None
    buildings: Optional[Dict[str, Any]] = None
    rooms: Optional[Dict[str, Any]] = None
    crowd: Optional[Dict[str, Any]] = None
    issues: Optional[Dict[str, Any]] = None
    lifts: Optional[Dict[str, Any]] = None
    events: Optional[Dict[str, Any]] = None


class CampusStateInDB(CampusStateBase):
    """Schema for campus state from database."""
    id: str
    version: int = 1

    class Config:
        from_attributes = True


class CampusState(CampusStateInDB):
    """Schema for campus state response."""
    pass
