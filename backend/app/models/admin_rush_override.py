"""AdminRushOverride model — manual override of campus rush state.

Allows authorized Admin users to override the GPS-derived rush
calculation for a specific campus location.  Each override has a
duration and automatically expires, returning the system to AUTO
(GPS-derived) mode.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Float,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.core.database import Base, GUID


class OverrideDuration(str):
    """Human-readable override duration strings."""


class AdminRushOverride(Base):
    """Manual override of rush state for a campus location."""

    __tablename__ = "admin_rush_overrides"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    location_id = Column(Integer, ForeignKey("campus_locations.id"), nullable=False, index=True)
    admin_user_id = Column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    people_count = Column(Integer, nullable=False, default=0)
    rush_level = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    reason = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=30, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    location = relationship("CampusLocation", lazy="selectin")
    admin = relationship("User", foreign_keys=[admin_user_id], lazy="selectin")
