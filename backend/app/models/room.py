"""Room model — a generic room within a building floor.

``room_type`` discriminates between classrooms, laboratories and
other room kinds.  Specialized subclasses (Classroom, Laboratory)
provide type-specific attributes via one-to-one relationships.
"""

import enum

from sqlalchemy import (
    Boolean,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RoomType(str, enum.Enum):
    """Enumeration of room types."""

    CLASSROOM = "classroom"
    LABORATORY = "laboratory"
    OFFICE = "office"
    AUDITORIUM = "auditorium"
    LIBRARY = "library"
    CAFETERIA = "cafeteria"
    MEETING = "meeting_room"
    OTHER = "other"


class Room(Base):
    """Generic room entity."""

    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(primary_key=True)
    building_id: Mapped[int] = mapped_column(
        ForeignKey("buildings.id"), nullable=False, index=True
    )
    floor_id: Mapped[int | None] = mapped_column(
        ForeignKey("floors.id"), nullable=True, index=True
    )
    room_number: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    room_type: Mapped[RoomType] = mapped_column(
        String(50), default=RoomType.OTHER, nullable=False, index=True
    )
    area_sqft: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_accessible: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    features: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # --- Relationships ---
    building: Mapped["Building"] = relationship(
        "Building",
        back_populates="rooms",
        lazy="select",
    )
    floor: Mapped["Floor | None"] = relationship(
        "Floor",
        back_populates="rooms",
        lazy="select",
    )
    classroom: Mapped["Classroom | None"] = relationship(
        "Classroom",
        back_populates="room",
        uselist=False,
        lazy="select",
    )
    laboratory: Mapped["Laboratory | None"] = relationship(
        "Laboratory",
        back_populates="room",
        uselist=False,
        lazy="select",
    )
    equipment: Mapped[list["Equipment"]] = relationship(
        "Equipment",
        back_populates="room",
        lazy="select",
    )
    bookings: Mapped[list["RoomBooking"]] = relationship(
        "RoomBooking",
        back_populates="room",
        lazy="select",
    )
    class_sessions: Mapped[list["ClassSession"]] = relationship(
        "ClassSession",
        back_populates="room",
        lazy="select",
    )
    crowd_reports: Mapped[list["CrowdReport"]] = relationship(
        "CrowdReport",
        back_populates="room",
        lazy="select",
    )
