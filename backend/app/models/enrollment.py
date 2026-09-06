"""Enrollment model — links students to course sections.

Tracks a student's enrolment status, semester, grade and attendance.
"""

import enum

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EnrollmentStatus(str, enum.Enum):
    """Enumeration of enrollment statuses."""

    ENROLLED = "enrolled"
    WAITLISTED = "waitlisted"
    DROPPED = "dropped"
    COMPLETED = "completed"
    WITHDRAWN = "withdrawn"


class Enrollment(Base):
    """Student-to-course-section enrolment entity."""

    __tablename__ = "enrollments"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id"), nullable=False, index=True
    )
    course_section_id: Mapped[int] = mapped_column(
        ForeignKey("course_sections.id"), nullable=False, index=True
    )
    enrollment_date: Mapped[str] = mapped_column(String(50), nullable=False)
    semester: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    academic_year: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[EnrollmentStatus] = mapped_column(
        String(50),
        default=EnrollmentStatus.ENROLLED,
        nullable=False,
        index=True,
    )
    grade: Mapped[str | None] = mapped_column(String(8), nullable=True)
    attendance_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # --- Relationships ---
    student: Mapped["Student"] = relationship(
        "Student",
        back_populates="enrollments",
        lazy="selectin",
    )
    course_section: Mapped["CourseSection"] = relationship(
        "CourseSection",
        back_populates="enrollments",
        lazy="selectin",
    )
