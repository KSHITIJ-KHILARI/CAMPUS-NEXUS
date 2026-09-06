"""CampusLocation model — a named point of interest on campus.

Represents entrances, landmarks, amenities, transit stops, etc.
Used for navigation, crowd reporting and issue tracking.
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


class LocationType(str, enum.Enum):
    """Enumeration of campus location types."""

    BUILDING = "building"
    ENTRANCE = "entrance"
    LANDMARK = "landmark"
    TRANSIT_STOP = "transit_stop"
    FOOD_COURT = "food_court"
    PARKING = "parking"
    HEALTH_CENTER = "health_center"
    LIBRARY = "library"
    ATHLETICS = "athletics"
    OTHER = "other"


class CampusLocation(Base):
    """Named campus location / point of interest entity."""

    __tablename__ = "campus_locations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    location_type: Mapped[LocationType] = mapped_column(
        String(50), default=LocationType.OTHER, nullable=False, index=True
    )
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    building_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("buildings.id"), nullable=True
    )
    room_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("rooms.id"), nullable=True
    )
    is_accessible: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True)
    geofence_radius_meters: Mapped[float | None] = mapped_column(
        Float, default=80.0, nullable=True,
        comment="Radius (meters) for location matching geofence"
    )
    capacity: Mapped[int | None] = mapped_column(
        Integer, nullable=True,
        comment="Maximum capacity for crowd density calculation"
    )
    operational_status: Mapped[str | None] = mapped_column(
        String(30), default="operational", nullable=True,
        comment="Current operational status: operational, maintenance, closed"
    )

    # --- Relationships ---
    crowd_reports: Mapped[list["CrowdReport"]] = relationship(
        "CrowdReport",
        back_populates="location",
        lazy="selectin",
    )
    issues: Mapped[list["Issue"]] = relationship(
        "Issue",
        back_populates="location",
        lazy="selectin",
    )
    buzz_posts: Mapped[list["BuzzPost"]] = relationship(
        "BuzzPost",
        back_populates="location",
        lazy="selectin",
    )
    crowd_state: Mapped["CrowdState | None"] = relationship(
        "CrowdState",
        back_populates="location",
        lazy="selectin",
        uselist=False,
    )
    events: Mapped[list["Event"]] = relationship(
        "Event",
        back_populates="location",
        lazy="selectin",
    )
