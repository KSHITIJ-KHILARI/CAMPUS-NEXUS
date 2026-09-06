"""Floor model — a single floor within a building.

Each floor belongs to a building and contains rooms.  Floor plans
can be stored as GeoJSON in the ``layout`` JSONB column for
navigation and crowd-density visualisation.
"""

from sqlalchemy import Boolean, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Floor(Base):
    """Floor entity."""

    __tablename__ = "floors"

    id: Mapped[int] = mapped_column(primary_key=True)
    building_id: Mapped[int] = mapped_column(
        ForeignKey("buildings.id"), nullable=False, index=True
    )
    floor_number: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    layout: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_accessible: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    area_sqft: Mapped[float | None] = mapped_column(Float, nullable=True)

    # --- Relationships ---
    building: Mapped["Building"] = relationship(
        "Building",
        back_populates="floors",
        lazy="selectin",
    )
    rooms: Mapped[list["Room"]] = relationship(
        "Room",
        back_populates="floor",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
