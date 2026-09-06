"""Faculty model — faculty-specific profile linked to a ``User``.

Stores employee number, designation, department and availability
information.
"""

import enum
import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FacultyStatus(str, enum.Enum):
    """Enumeration of faculty employment statuses."""

    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    RETIRED = "retired"


class FacultyDesignation(str, enum.Enum):
    """Common faculty designations."""

    ASSISTANT_PROFESSOR = "Assistant Professor"
    ASSOCIATE_PROFESSOR = "Associate Professor"
    PROFESSOR = "Professor"
    LECTURER = "Lecturer"
    HEAD_OF_DEPARTMENT = "Head of Department"
    DIRECTOR = "Director"


class Faculty(Base):
    """Faculty profile entity."""

    __tablename__ = "faculties"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), unique=True, nullable=False, index=True
    )
    employee_id_number: Mapped[str] = mapped_column(
        String(32), unique=True, nullable=False, index=True
    )
    designation: Mapped[FacultyDesignation] = mapped_column(
        String(50), nullable=False
    )
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id"), nullable=True
    )
    join_date: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[FacultyStatus] = mapped_column(
        String(50), default=FacultyStatus.ACTIVE, nullable=False, index=True
    )
    is_hod: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    office_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    qualification: Mapped[str | None] = mapped_column(String(255), nullable=True)
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    office_hours_summary: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # --- Relationships ---
    user: Mapped["User"] = relationship(
        "User",
        back_populates="faculty_profile",
        foreign_keys="Faculty.user_id",
        lazy="select",
    )
    department: Mapped["Department | None"] = relationship(
        "Department",
        back_populates="faculties",
        lazy="select",
        foreign_keys="Faculty.department_id",
    )
    course_sections: Mapped[list["CourseSection"]] = relationship(
        "CourseSection",
        back_populates="faculty",
        lazy="select",
        primaryjoin="Faculty.id==CourseSection.faculty_id",
    )

