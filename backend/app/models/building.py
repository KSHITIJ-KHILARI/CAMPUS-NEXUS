"""Building model — a physical campus building.

Stores identification, address and geospatial reference for each
building on campus.
"""

from sqlalchemy import Boolean, String, Text, Float, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Building(Base):
    """Campus building entity."""

    __tablename__ = "buildings"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    num_floors: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_accessible: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # --- Relationships ---
    floors: Mapped[list["Floor"]] = relationship(
        "Floor",
        back_populates="building",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    rooms: Mapped[list["Room"]] = relationship(
        "Room",
        back_populates="building",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    facilities: Mapped[list["Facility"]] = relationship(
        "Facility",
        back_populates="building",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    lifts: Mapped[list["Lift"]] = relationship(
        "Lift",
        back_populates="building",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    departments: Mapped[list["Department"]] = relationship(
        "Department",
        back_populates="building",
        lazy="selectin",
    )
