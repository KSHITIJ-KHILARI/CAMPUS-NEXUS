"""Lift model for Campus NEXUS."""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

from app.core.database import Base


class LiftStatusEnum(str, enum.Enum):
    """Operational status of a lift."""
    WORKING = "working"
    UNAVAILABLE = "unavailable"
    HEAVY_RUSH = "heavy_rush"
    MAINTENANCE = "maintenance"


class Lift(Base):
    """Lift entity in a building."""

    __tablename__ = "lifts"

    id = Column(String, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=False)
    lift_number = Column(Integer, nullable=False)
    status = Column(String(50))
    current_floor = Column(Integer, default=1)
    capacity = Column(Integer, default=8)
    direction = Column(String(50), default="idle")
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    building = relationship("Building", back_populates="lifts")
    statuses = relationship("LiftStatus", back_populates="lift", cascade="all, delete-orphan")


class LiftStatusRecord(Base):
    """Historical lift status records."""

    __tablename__ = "lift_statuses"

    id = Column(String, primary_key=True, index=True)
    lift_id = Column(String, ForeignKey("lifts.id"), nullable=False)
    status = Column(String(50))
    crowd_level = Column(String(50), default="low")
    reported_by = Column(String, default="system")
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    lift = relationship("Lift")
