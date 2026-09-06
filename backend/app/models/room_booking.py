"""Room booking model for Campus NEXUS."""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

from app.core.database import Base, GUID


class BookingStatus(str, enum.Enum):
    """Status of a room booking."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class RoomBooking(Base):
    """Room booking entity."""

    __tablename__ = "room_bookings"

    id = Column(String, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("class_sessions.id"))
    booked_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    purpose = Column(String(255))
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(50))
    notes = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    room = relationship("Room", back_populates="bookings")
    session = relationship("ClassSession")
