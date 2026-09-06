"""Student schedule model for Campus NEXUS."""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base, GUID


class StudentSchedule(Base):
    """Computed student schedule entity."""

    __tablename__ = "student_schedules"

    id = Column(String, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    class_session_id = Column(Integer, ForeignKey("class_sessions.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    course_code = Column(String(50))
    course_name = Column(String(255))
    faculty_name = Column(String(255))
    room_number = Column(String(50))
    building_name = Column(String(255))
    session_type = Column(String(50))
    color = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    class_session = relationship("ClassSession", back_populates="student_schedules")
