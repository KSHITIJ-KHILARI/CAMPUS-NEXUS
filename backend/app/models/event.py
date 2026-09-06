"""Event model for Campus NEXUS."""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

from app.core.database import Base


class EventType(str, enum.Enum):
    """Type of campus event."""
    HACKATHON = "hackathon"
    WORKSHOP = "workshop"
    CULTURAL = "cultural"
    SPORTS = "sports"
    CLUB = "club"
    COMMITTEE = "committee"
    SEMINAR = "seminar"
    OTHER = "other"


class EventStatus(str, enum.Enum):
    """Status of an event."""
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Event(Base):
    """Campus event entity."""

    __tablename__ = "events"

    id = Column(String, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String(1000))
    event_type = Column(String(50))
    location_id = Column(Integer, ForeignKey("campus_locations.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    organizer = Column(String(255))
    max_participants = Column(Integer)
    registrations = Column(Integer, default=0)
    crowd_estimate = Column(String(50), default="low")
    status = Column(String(50))
    image_url = Column(String(500))
    registration_required = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    location = relationship("CampusLocation")
    registrations_list = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")
