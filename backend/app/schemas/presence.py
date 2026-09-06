"""Pydantic schemas for Presence Consent and Campus Location Tracking."""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict


class PresenceConsentUpdate(BaseModel):
    """Schema for updating opt-in presence consent and privacy settings."""
    is_enabled: bool
    privacy_mode: Optional[str] = "APPROXIMATE"  # PRIVATE, APPROXIMATE, PRECISE_NAVIGATION
    share_with_friends: Optional[bool] = False
    share_with_faculty: Optional[bool] = False


class PresenceLocationUpdate(BaseModel):
    """Schema for reporting current location when consent is enabled."""
    building_id: Optional[int] = None
    floor_id: Optional[int] = None
    room_id: Optional[str] = None
    zone: Optional[str] = None


class PresenceConsentResponse(BaseModel):
    """Schema for returning presence status."""
    id: Any
    user_id: Any
    is_enabled: bool
    privacy_mode: str
    current_building_id: Optional[int] = None
    current_floor_id: Optional[int] = None
    current_room_id: Optional[str] = None
    current_zone: Optional[str] = None
    last_seen_at: Optional[datetime] = None
    share_with_friends: bool
    share_with_faculty: bool
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
