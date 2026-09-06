"""FoundItem model — an item reported as found by a user.

References shared enums (ItemCategory) defined in
:mod:`app.models.lost_item` to avoid duplication.
"""

import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.lost_item import ItemCategory


class FoundItem(Base):
    """Found item report entity."""

    __tablename__ = "found_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[ItemCategory] = mapped_column(
        String(50), default=ItemCategory.OTHER, nullable=False, index=True
    )
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    color: Mapped[str | None] = mapped_column(String(64), nullable=True)
    brand: Mapped[str | None] = mapped_column(String(128), nullable=True)
    location_id: Mapped[int | None] = mapped_column(
        ForeignKey("campus_locations.id"), nullable=True, index=True
    )
    room_id: Mapped[int | None] = mapped_column(
        ForeignKey("rooms.id"), nullable=True, index=True
    )
    building_id: Mapped[int | None] = mapped_column(
        ForeignKey("buildings.id"), nullable=True, index=True
    )
    found_by_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    found_at: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(32), default="unclaimed", nullable=False, index=True
    )
    is_anonymous: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    contact_info: Mapped[str | None] = mapped_column(String(512), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    claimed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    claimed_at: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # --- Relationships ---
    location: Mapped["CampusLocation | None"] = relationship(
        "CampusLocation",
        lazy="selectin",
    )
    room: Mapped["Room | None"] = relationship(
        "Room",
        lazy="selectin",
    )
    found_by: Mapped["User"] = relationship(
        "User",
        foreign_keys="FoundItem.found_by_user_id",
        lazy="selectin",
    )
    claimed_by: Mapped["User | None"] = relationship(
        "User",
        foreign_keys="FoundItem.claimed_by_user_id",
        lazy="selectin",
    )
    lost_item_matches: Mapped[list["LostFoundMatch"]] = relationship(
        "LostFoundMatch",
        foreign_keys="LostFoundMatch.found_item_id",
        back_populates="found_item",
        lazy="selectin",
    )
