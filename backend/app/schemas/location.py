"""Location API schema definitions for Campus NEXUS."""

from datetime import datetime
from typing import Optional, Any, List
from pydantic import BaseModel, ConfigDict, Field


class LocationUpdate(BaseModel):
    """Real GPS coordinates from the browser Geolocation API."""
    latitude: float = Field(..., description="Device latitude")
    longitude: float = Field(..., description="Device longitude")
    accuracy: Optional[float] = Field(None, description="Accuracy in metres")
    timestamp: Optional[str] = Field(None, description="ISO-8601 timestamp of the reading")


class LocationStatusResponse(BaseModel):
    """User's current location tracking state."""
    user_id: Any
    tracking_enabled: bool
    location_status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None
    timestamp: Optional[str] = None
    matched_location: Optional[dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class CampusLocationSchema(BaseModel):
    """Campus location with geofence metadata."""
    id: int
    name: str
    location_type: str
    latitude: float
    longitude: float
    geofence_radius_meters: Optional[float] = None
    capacity: Optional[int] = None
    operational_status: Optional[str] = None
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RushStateItem(BaseModel):
    """Rush state for a single campus location."""
    location_id: int
    location_name: str
    current_count: int
    capacity: Optional[int] = None
    rush_level: str
    confidence: float
    source: str
    override_reason: Optional[str] = None
    expires_at: Optional[str] = None
    last_updated: str


class OverrideCreate(BaseModel):
    """Schema for admin creating a rush override."""
    location_id: int
    people_count: int = Field(..., ge=0)
    rush_level: str = Field(..., description="LOW, MODERATE, HIGH, VERY_HIGH")
    reason: Optional[str] = None
    duration_minutes: int = Field(30, ge=1, le=1440)


class OverrideResponse(BaseModel):
    """Admin override response."""
    id: Any
    location_id: int
    people_count: int
    rush_level: str
    is_active: bool
    reason: Optional[str] = None
    duration_minutes: int
    expires_at: datetime
    created_at: Optional[datetime] = None
    source: str = "ADMIN_OVERRIDE"

    model_config = ConfigDict(from_attributes=True)
