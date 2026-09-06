"""Equipment model for Campus NEXUS."""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

from app.core.database import Base


class EquipmentStatus(str, enum.Enum):
    """Status of equipment."""
    WORKING = "working"
    MALFUNCTIONING = "malfunctioning"
    UNAVAILABLE = "unavailable"
    MAINTENANCE = "maintenance"


class Equipment(Base):
    """Equipment entity in rooms/labs."""

    __tablename__ = "equipment"

    id = Column(String, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(100))  # projector, computer, microscope, etc.
    room_id = Column(Integer, ForeignKey("rooms.id"))
    lab_id = Column(Integer, ForeignKey("laboratories.id"))
    status = Column(String(50))
    serial_number = Column(String(100))
    purchase_date = Column(DateTime)
    last_maintenance = Column(DateTime)
    next_maintenance = Column(DateTime)
    notes = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    room = relationship("Room", back_populates="equipment")
    laboratory = relationship("Laboratory", back_populates="equipment")
