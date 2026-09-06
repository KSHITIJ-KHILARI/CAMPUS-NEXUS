"""UserLocationState model — real-time GPS location state per user.

Stores the user's real device-provided geolocation coordinates
(obtained via the browser Geolocation API) along with accuracy,
timestamp, and tracking status.  Location tracking is OPT-IN:
``tracking_enabled`` defaults to ``False`` and the user must
explicitly enable consent before any coordinates are collected.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Float,
    Integer,
    String,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.core.database import Base, GUID


class UserLocationState(Base):
    """Real-time GPS location state for a single user."""

    __tablename__ = "user_location_states"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=True)
    tracking_enabled = Column(Boolean, default=False, nullable=False)
    location_status = Column(
        String(30),
        default="OFF",
        nullable=False,
    )
    last_updated = Column(DateTime(timezone=True), nullable=True)

    # Geofence-matched campus location (set by LocationService on each GPS update)
    location_id = Column(Integer, ForeignKey("campus_locations.id"), nullable=True, index=True)
    location_name = Column(String(255), nullable=True)

    user = relationship("User", foreign_keys=[user_id], lazy="selectin")
    matched_campus_location = relationship("CampusLocation", foreign_keys=[location_id], lazy="selectin")
