"""CrowdReport model — a real-time crowd density report.

Submitted by users or automated sensors for a specific location/room
at a given timestamp.  Used to compute real-time crowd state.
"""

import enum
import uuid

from sqlalchemy import (
    Boolean,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SourceType(str, enum.Enum):
    """Source of a crowd report."""

    USER = "user"
    SENSOR = "sensor"
    CAMERA = "camera"
    WIFI = "wifi"
    MANUAL = "manual"


class DensityLevel(str, enum.Enum):
    """Qualitative crowd density levels."""

    EMPTY = "empty"
    QUIET = "quiet"
    MODERATE = "moderate"
    BUSY = "busy"
    CROWDED = "crowded"
    VERY_CROWDED = "very_crowded"


class CrowdReport(Base):
    """Real-time crowd density report entity."""

    __tablename__ = "crowd_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    location_id: Mapped[int | None] = mapped_column(
        ForeignKey("campus_locations.id"), nullable=True, index=True
    )
    room_id: Mapped[int | None] = mapped_column(
        ForeignKey("rooms.id"), nullable=True, index=True
    )
    building_id: Mapped[int | None] = mapped_column(
        ForeignKey("buildings.id"), nullable=True, index=True
    )
    reported_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    count: Mapped[int] = mapped_column(Integer, nullable=False)
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    density_level: Mapped[DensityLevel] = mapped_column(
        String(50), nullable=False, index=True
    )
    confidence_score: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    source: Mapped[SourceType] = mapped_column(
        String(50), default=SourceType.USER, nullable=False
    )
    reported_at: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # --- Relationships ---
    location: Mapped["CampusLocation | None"] = relationship(
        "CampusLocation",
        back_populates="crowd_reports",
        lazy="selectin",
    )
    room: Mapped["Room | None"] = relationship(
        "Room",
        back_populates="crowd_reports",
        lazy="selectin",
    )
    building: Mapped["Building | None"] = relationship(
        "Building",
        lazy="selectin",
    )
    reported_by: Mapped["User | None"] = relationship(
        "User",
        lazy="selectin",
    )

