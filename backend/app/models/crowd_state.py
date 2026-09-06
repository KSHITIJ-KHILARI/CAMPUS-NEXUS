"""CrowdState model — aggregated real-time crowd snapshot.

One row per location or room, updated as new :class:`CrowdReport`
records arrive.  Used by the navigation agent to avoid crowded paths.
"""

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CrowdState(Base):
    """Aggregated crowd state for a location / room."""

    __tablename__ = "crowd_states"

    id: Mapped[int] = mapped_column(primary_key=True)
    location_id: Mapped[int | None] = mapped_column(
        ForeignKey("campus_locations.id"), unique=True, nullable=True, index=True
    )
    room_id: Mapped[int | None] = mapped_column(
        ForeignKey("rooms.id"), unique=True, nullable=True, index=True
    )
    current_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    occupancy_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    trend: Mapped[str | None] = mapped_column(String(32), nullable=True)
    density_level: Mapped[str | None] = mapped_column(String(32), nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_updated: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    last_report_id: Mapped[int | None] = mapped_column(
        ForeignKey("crowd_reports.id"), nullable=True
    )
    is_alert: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    alert_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Relationships ---
    location: Mapped["CampusLocation | None"] = relationship(
        "CampusLocation",
        back_populates="crowd_state",
        lazy="selectin",
    )
    room: Mapped["Room | None"] = relationship(
        "Room",
        lazy="selectin",
    )
    last_report: Mapped["CrowdReport | None"] = relationship(
        "CrowdReport",
        lazy="selectin",
    )
