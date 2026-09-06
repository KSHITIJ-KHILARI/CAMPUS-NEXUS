"""Pydantic schemas for Emergency Reports and Dispatch workflows."""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict


class EmergencyCreate(BaseModel):
    """Schema for reporting a campus emergency / SOS."""
    emergency_type: str  # MEDICAL, FIRE, SECURITY, FACILITY_HAZARD, OTHER
    severity: str = "HIGH"  # LOW, MEDIUM, HIGH, CRITICAL
    location_name: str
    building_id: Optional[int] = None
    coordinates: Optional[str] = None
    description: str
    reporter_name: Optional[str] = None
    reporter_phone: Optional[str] = None


class EmergencyStatusUpdate(BaseModel):
    """Schema for dispatcher status updates and responder assignment."""
    status: str  # REPORTED, ACKNOWLEDGED, RESPONDER_ASSIGNED, IN_PROGRESS, RESOLVED
    assigned_responder: Optional[str] = None
    admin_notes: Optional[str] = None


class EmergencyResponse(BaseModel):
    """Schema for emergency incident responses."""
    id: Any
    reporter_id: Optional[Any] = None
    reporter_name: Optional[str] = None
    reporter_phone: Optional[str] = None
    reporter_role: Optional[str] = None
    emergency_type: str
    severity: str
    location_name: str
    building_id: Optional[int] = None
    coordinates: Optional[str] = None
    description: str
    status: str
    assigned_responder: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
