"""Student model — student-specific profile linked to a ``User``.

Tracks enrolment details, academic year, current semester and
program affiliation.
"""

import enum
import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship, remote, foreign

from app.core.database import Base


class StudentStatus(str, enum.Enum):
    """Enumeration of student enrollment statuses."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    GRADUATED = "graduated"
    SUSPENDED = "suspended"
    ON_LEAVE = "on_leave"


class Student(Base):
    """Student profile entity."""

    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), unique=True, nullable=False, index=True
    )
    student_id_number: Mapped[str] = mapped_column(
        String(32), unique=True, nullable=False, index=True
    )
    enrollment_date: Mapped[str] = mapped_column(String(50), nullable=False)
    graduation_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    program_id: Mapped[int | None] = mapped_column(
        ForeignKey("programs.id"), nullable=True
    )
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id"), nullable=True
    )
    academic_year: Mapped[str] = mapped_column(String(32), nullable=False)
    current_semester: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[StudentStatus] = mapped_column(
        String(50), default=StudentStatus.ACTIVE, nullable=False, index=True
    )
    cgpa: Mapped[float | None] = mapped_column(String(8), nullable=True)
    total_credits: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_hostelite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    bio: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    portfolio_json: Mapped[str | None] = mapped_column(String, nullable=True)

    # --- Relationships ---
    user: Mapped["User"] = relationship(
        "User",
        back_populates="student_profile",
        foreign_keys="Student.user_id",
        lazy="select",
    )
    program: Mapped["Program | None"] = relationship(
        "Program",
        back_populates="students",
        lazy="select",
    )
    department: Mapped["Department | None"] = relationship(
        "Department",
        back_populates="students",
        lazy="select",
    )
    enrollments: Mapped[list["Enrollment"]] = relationship(
        "Enrollment",
        back_populates="student",
        lazy="select",
    )
    schedule_entries: Mapped[list["StudentSchedule"]] = relationship(
        "StudentSchedule",
        primaryjoin="and_(Student.id==foreign(StudentSchedule.student_id))",
        viewonly=True,
        lazy="select",
    )
    

