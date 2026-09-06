"""CourseSection model — a specific offering of a course.

Each section is taught by a faculty member in a particular semester
and has associated class sessions.
"""

from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CourseSection(Base):
    """Course section / offering entity."""

    __tablename__ = "course_sections"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id"), nullable=False, index=True
    )
    section_number: Mapped[str] = mapped_column(String(16), nullable=False)
    semester: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    academic_year: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    faculty_id: Mapped[int | None] = mapped_column(
        ForeignKey("faculties.id"), nullable=True, index=True
    )
    faculty_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    max_capacity: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    enrolled_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(512), nullable=True)

    __table_args__ = (
        UniqueConstraint("course_id", "section_number", "semester", "academic_year",
                         name="uq_course_section_semester"),
    )

    # --- Relationships ---
    course: Mapped["Course"] = relationship(
        "Course",
        back_populates="sections",
        lazy="selectin",
    )
    faculty: Mapped["Faculty | None"] = relationship(
        "Faculty",
        back_populates="course_sections",
        lazy="selectin",
        primaryjoin="CourseSection.faculty_id==Faculty.id",
    )
    class_sessions: Mapped[list["ClassSession"]] = relationship(
        "ClassSession",
        back_populates="course_section",
        lazy="selectin",
    )
    enrollments: Mapped[list["Enrollment"]] = relationship(
        "Enrollment",
        back_populates="course_section",
        lazy="selectin",
    )
