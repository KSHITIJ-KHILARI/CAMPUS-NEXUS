"""Resource model for Campus NEXUS."""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

from app.core.database import Base


class ResourceType(str, enum.Enum):
    """Type of resource."""
    PROJECTOR = "projector"
    COMPUTER = "computer"
    SOFTWARE = "software"
    LAB_EQUIPMENT = "lab_equipment"
    FURNITURE = "furniture"
    OTHER = "other"


class Resource(Base):
    """General resource entity."""

    __tablename__ = "resources"

    id = Column(String, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50))
    room_id = Column(Integer, ForeignKey("rooms.id"))
    lab_id = Column(Integer, ForeignKey("laboratories.id"))
    quantity = Column(Integer, default=1)
    available = Column(Integer, default=1)
    status = Column(String(50), default="available")
    notes = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
