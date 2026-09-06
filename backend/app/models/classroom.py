"""Classroom model — classroom-specific attributes linked to a Room.

Extends the generic ``Room`` with classroom-specific features such
as projector availability, seating type and AC status.
"""

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SeatingType(str, Enum):
    """Enumeration of seating arrangements."""

    THEATER = "theater"
    CLASSROOM = "classroom"
    U_SHAPED = "u_shaped"
    HOLLOW = "hollow"


class Classroom(Base):
    """Classroom-specific entity linked one-to-one with a ``Room``."""

    __tablename__ = "classrooms"

    id: Mapped[int] = mapped_column(primary_key=True)
    room_id: Mapped[int] = mapped_column(
        ForeignKey("rooms.id"), unique=True, nullable=False, index=True
    )
    has_projector: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    has_ac: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    has_whiteboard: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    seating_type: Mapped[SeatingType] = mapped_column(
        String(50), default=SeatingType.CLASSROOM, nullable=False
    )
    seating_capacity: Mapped[int] = mapped_column(Integer, nullable=True)

    # --- Relationships ---
    room: Mapped["Room"] = relationship(
        "Room",
        back_populates="classroom",
        lazy="selectin",
    )
