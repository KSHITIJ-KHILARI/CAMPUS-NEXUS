"""Timetable model for Campus NEXUS."""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

from app.core.database import Base, GUID


class TimetableStatus(str, enum.Enum):
    """Status of a timetable."""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class DayOfWeek(str, enum.Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class Timetable(Base):
    """Timetable entity."""

    __tablename__ = "timetables"

    id = Column(String, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=False)
    semester = Column(Integer, nullable=False)
    academic_year = Column(String(20), nullable=False)
    status = Column(String(50))
    effective_from = Column(DateTime)
    effective_until = Column(DateTime)
    created_by = Column(GUID(), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sessions = relationship("ClassSession", back_populates="timetable", cascade="all, delete-orphan")


class TimetableEntry(Base):
    """Timetable entry connecting course, room, faculty, and time slot."""

    __tablename__ = "timetable_entries"

    id = Column(String, primary_key=True, index=True)
    course_code = Column(String(32), nullable=False, index=True)
    course_name = Column(String(255), nullable=False)
    faculty_name = Column(String(255), nullable=False)
    faculty_email = Column(String(255), nullable=True)
    building_code = Column(String(32), nullable=False)
    room_number = Column(String(32), nullable=False)
    day_of_week = Column(String(20), nullable=False, index=True)
    start_time = Column(String(10), nullable=False)  # HH:MM format
    end_time = Column(String(10), nullable=False)    # HH:MM format
    session_type = Column(String(32), default="lecture")  # lecture, lab, tutorial
    created_by = Column(GUID(), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
