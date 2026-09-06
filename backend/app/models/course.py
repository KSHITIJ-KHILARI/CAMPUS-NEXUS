"""Course model — abstract academic course.

A course is offered by a department and optionally belongs to one or
more programs.  Sections (offerings) are created per semester.
"""

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


course_programs = Table(
    "course_programs",
    Base.metadata,
    Column("course_id", ForeignKey("courses.id"), primary_key=True),
    Column("program_id", ForeignKey("programs.id"), primary_key=True),
)


class Course(Base):
    """Course entity."""

    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    credits: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id"), nullable=False, index=True
    )
    program_id: Mapped[int | None] = mapped_column(
        ForeignKey("programs.id"), nullable=True, index=True
    )
    is_elective: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    prerequisites_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Relationships ---
    department: Mapped["Department"] = relationship(
        "Department",
        back_populates="courses",
        lazy="selectin",
    )
    sections: Mapped[list["CourseSection"]] = relationship(
        "CourseSection",
        back_populates="course",
        lazy="selectin",
    )
    programs: Mapped[list["Program"]] = relationship(
        "Program",
        secondary="course_programs",
        back_populates="courses",
        lazy="selectin",
    )
