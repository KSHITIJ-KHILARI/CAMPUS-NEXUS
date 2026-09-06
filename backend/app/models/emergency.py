"""Emergency Incident Reporting and Dispatch Model for Campus NEXUS."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base, GUID


class EmergencyReport(Base):
    """Emergency Report entity tracking incidents and dispatcher response workflows."""

    __tablename__ = "emergency_reports"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    reporter_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    reporter_name = Column(String(255), nullable=True)
    reporter_phone = Column(String(32), nullable=True)
    reporter_role = Column(String(50), default="student")
    emergency_type = Column(String(50), nullable=False)  # MEDICAL, FIRE, SECURITY, FACILITY_HAZARD, OTHER
    severity = Column(String(50), nullable=False, default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    location_name = Column(String(255), nullable=False)
    building_id = Column(Integer, nullable=True)
    coordinates = Column(String(255), nullable=True)  # JSON or "lat,lng"
    description = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="REPORTED")  # REPORTED, ACKNOWLEDGED, RESPONDER_ASSIGNED, IN_PROGRESS, RESOLVED
    assigned_responder = Column(String(255), nullable=True)
    admin_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_id], lazy="selectin")
