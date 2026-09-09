from pydantic import ConfigDict
"""Pydantic schemas for Crowd model."""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CrowdReportBase(BaseModel):
    """Base crowd report schema."""
    location_id: str
    level: str  # low, medium, high
    user_id: Optional[int] = None
    context: Optional[str] = None


class CrowdReportCreate(CrowdReportBase):
    """Schema for creating a crowd report."""
    pass


class CrowdReportInDB(CrowdReportBase):
    """Schema for crowd report from database."""
    id: str
    timestamp: datetime
    confidence: float
    report_count: int

    model_config = ConfigDict(from_attributes=True)


class CrowdReport(CrowdReportInDB):
    """Schema for crowd report response."""
    pass


class CrowdStateBase(BaseModel):
    """Base crowd state schema."""
    location_id: str
    level: str
    confidence: float
    report_count: int
    last_updated: datetime


class CrowdState(CrowdStateBase):
    """Schema for crowd state response."""
    id: str
    
    model_config = ConfigDict(from_attributes=True)
