"""ClassSession model — a scheduled class meeting instance.

Links a course section to a room, faculty and a specific time slot.
Part of a :class:`Timetable`.
"""

import enum

from sqlalchemy import (
    Boolean,
    Enum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DayOfWeek(str, enum.Enum):
    """Days of the week for recurring schedules."""

    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class SessionType(str, enum.Enum):
    """Type of class session."""

    LECTURE = "lecture"
    TUTORIAL = "tutorial"
    PRACTICAL = "practical"
    LAB = "lab"
    EXAM = "exam"
    MAKEUP = "makeup"


class ClassSession(Base):
    """Scheduled class session entity."""

    __tablename__ = "class_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_section_id: Mapped[int] = mapped_column(
        ForeignKey("course_sections.id"), nullable=False, index=True
    )
    room_id: Mapped[int | None] = mapped_column(
        ForeignKey("rooms.id"), nullable=True, index=True
    )
    timetable_id: Mapped[str | None] = mapped_column(
        ForeignKey("timetables.id"), nullable=True, index=True
    )
    faculty_id: Mapped[int | None] = mapped_column(
        ForeignKey("faculties.id"), nullable=True, index=True
    )
    day_of_week: Mapped[DayOfWeek | None] = mapped_column(
        String(50), nullable=True
    )
    start_time: Mapped[str] = mapped_column(String(16), nullable=False)
    end_time: Mapped[str] = mapped_column(String(16), nullable=False)
    start_datetime: Mapped[str | None] = mapped_column(String(50), nullable=True)
    end_datetime: Mapped[str | None] = mapped_column(String(50), nullable=True)
    session_type: Mapped[SessionType] = mapped_column(
        String(50), default=SessionType.LECTURE, nullable=False
    )
    recurrence_pattern: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_cancelled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    is_mandatory: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    # --- Relationships ---
    course_section: Mapped["CourseSection"] = relationship(
        "CourseSection",
        back_populates="class_sessions",
        lazy="selectin",
    )
    room: Mapped["Room | None"] = relationship(
        "Room",
        back_populates="class_sessions",
        lazy="selectin",
    )
    timetable: Mapped["Timetable | None"] = relationship(
        "Timetable",
        back_populates="sessions",
        lazy="selectin",
    )
    faculty: Mapped["Faculty | None"] = relationship(
        "Faculty",
        lazy="selectin",
    )
    student_schedules: Mapped[list["StudentSchedule"]] = relationship(
        "StudentSchedule",
        back_populates="class_session",
        lazy="selectin",
    )
