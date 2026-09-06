"""Facility model for Campus NEXUS."""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

from app.core.database import Base


class FacilityType(str, enum.Enum):
    """Type of campus facility."""
    CANTEEN = "canteen"
    FOOD_STALL = "food_stall"
    LIBRARY = "library"
    COMPUTER_LAB = "computer_lab"
    SPORTS = "sports"
    MEDICAL = "medical"
    PARKING = "parking"
    WASHROOM = "washroom"
    WATER_COOLER = "water_cooler"
    OTHER = "other"


class Facility(Base):
    """Campus facility entity."""

    __tablename__ = "facilities"

    id = Column(String, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50))
    building_id = Column(Integer, ForeignKey("buildings.id"))
    location_id = Column(Integer, ForeignKey("campus_locations.id"))
    status = Column(String(50), default="open")
    opening_hours = Column(String(255))
    contact = Column(String(100))
    capacity = Column(Integer)
    current_occupancy = Column(Integer, default=0)
    crowd_level = Column(String(50), default="low")
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    metadata_json = Column(String(500))

    # Relationships
    building = relationship("Building")
    location = relationship("CampusLocation")
