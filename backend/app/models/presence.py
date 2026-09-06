"""Presence and Location Consent Model for Campus NEXUS.

Enforces strict opt-in consent: Location tracking is OFF by default.
Students can enable or customize privacy modes (PRIVATE, APPROXIMATE, PRECISE_NAVIGATION).
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base, GUID


class PresenceConsent(Base):
    """Presence Consent and Live Campus Presence state for students/users."""

    __tablename__ = "presence_consent"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), unique=True, nullable=False)
    is_enabled = Column(Boolean, default=False, nullable=False)  # Strict OFF by default
    privacy_mode = Column(String(50), default="APPROXIMATE", nullable=False)  # PRIVATE, APPROXIMATE, PRECISE_NAVIGATION
    current_building_id = Column(Integer, nullable=True)
    current_floor_id = Column(Integer, nullable=True)
    current_room_id = Column(String(50), nullable=True)
    current_zone = Column(String(255), nullable=True)  # e.g. "Library 2nd Floor", "Engineering Quad"
    last_seen_at = Column(DateTime(timezone=True), nullable=True)
    share_with_friends = Column(Boolean, default=False, nullable=False)
    share_with_faculty = Column(Boolean, default=False, nullable=False)

    # Relationship
    user = relationship("User", foreign_keys=[user_id], lazy="selectin")
