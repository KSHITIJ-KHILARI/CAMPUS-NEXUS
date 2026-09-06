"""Program model — academic programme (e.g. B.Tech CSE, MBA).

A program belongs to a department and defines a curriculum of
courses.  Students are affiliated with a single program.
"""

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Program(Base):
    """Academic programme entity."""

    __tablename__ = "programs"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id"), nullable=False, index=True
    )
    duration_years: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    total_credits_required: Mapped[int] = mapped_column(Integer, default=120, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    degree_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    start_semester: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # --- Relationships ---
    department: Mapped["Department"] = relationship(
        "Department",
        back_populates="programs",
        lazy="selectin",
    )
    students: Mapped[list["Student"]] = relationship(
        "Student",
        back_populates="program",
        lazy="selectin",
    )
    courses: Mapped[list["Course"]] = relationship(
        "Course",
        back_populates="programs",
        secondary="course_programs",
        lazy="selectin",
    )
