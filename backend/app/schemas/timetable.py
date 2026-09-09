from pydantic import ConfigDict
"""Pydantic schemas for Timetable and ClassSession models."""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ClassSessionBase(BaseModel):
    """Base class session schema."""
    course_id: str
    course_section_id: str
    faculty_id: str
    room_id: str
    start_time: datetime
    end_time: datetime
    session_type: str = "lecture"  # lecture, lab, tutorial


class ClassSessionCreate(ClassSessionBase):
    """Schema for creating a class session."""
    pass


class ClassSessionUpdate(BaseModel):
    """Schema for updating a class session."""
    room_id: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None


class ClassSessionInDB(ClassSessionBase):
    """Schema for class session from database."""
    id: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClassSession(ClassSessionInDB):
    """Schema for class session response."""
    course_name: Optional[str] = None
    faculty_name: Optional[str] = None
    room_number: Optional[str] = None
    building_name: Optional[str] = None


class TimetableBase(BaseModel):
    """Base timetable schema."""
    name: str
    program_id: str
    semester: int
    academic_year: str
    is_active: bool = True


class TimetableCreate(TimetableBase):
    """Schema for creating a timetable."""
    pass


class TimetableInDB(TimetableBase):
    """Schema for timetable from database."""
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Timetable(TimetableInDB):
    """Schema for timetable response."""
    pass


class ScheduleEntry(BaseModel):
    """Single entry in a schedule."""
    day: str
    start_time: str
    end_time: str
    course_code: str
    course_name: str
    faculty_name: str
    room_number: str
    building_name: str
    type: str
    color: str


class StudentSchedule(BaseModel):
    """Student's complete schedule."""
    student_id: str
    student_name: str
    entries: List[ScheduleEntry]
    next_class: Optional[ScheduleEntry] = None
