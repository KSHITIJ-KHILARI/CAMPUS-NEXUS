"""Department model — academic or administrative department.

Each department belongs to a college/faculty and may have a head
(a faculty member).
"""

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Department(Base):
    """Academic / administrative department entity."""

    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    college: Mapped[str | None] = mapped_column(String(255), nullable=True)
    head_faculty_id: Mapped[int | None] = mapped_column(
        ForeignKey("faculties.id"), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    building_id: Mapped[int | None] = mapped_column(
        ForeignKey("buildings.id"), nullable=True
    )

    # --- Relationships ---
    programs: Mapped[list["Program"]] = relationship(
        "Program",
        back_populates="department",
        lazy="selectin",
    )
    courses: Mapped[list["Course"]] = relationship(
        "Course",
        back_populates="department",
        lazy="selectin",
    )
    faculties: Mapped[list["Faculty"]] = relationship(
        "Faculty",
        back_populates="department",
        lazy="selectin",
        foreign_keys="Faculty.department_id",
    )
    admins: Mapped[list["Admin"]] = relationship(
        "Admin",
        back_populates="department",
        lazy="selectin",
    )
    users: Mapped[list["User"]] = relationship(
        "User",
        back_populates="department",
        lazy="selectin",
        foreign_keys="User.department_id",
    )
    students: Mapped[list["Student"]] = relationship(
        "Student",
        back_populates="department",
        lazy="selectin",
        foreign_keys="Student.department_id",
    )
    head: Mapped["Faculty | None"] = relationship(
        "Faculty",
        foreign_keys="Department.head_faculty_id",
        lazy="selectin",
    )
    building: Mapped["Building | None"] = relationship(
        "Building",
        back_populates="departments",
        lazy="selectin",
    )


# To avoid circular import issues at runtime, these are only for type checking.
from typing import TYPE_CHECKING  # noqa: E402

if TYPE_CHECKING:
    from app.models.faculty import Faculty  # noqa: F401
    from app.models.building import Building  # noqa: F401
    from app.models.course import Course  # noqa: F401
