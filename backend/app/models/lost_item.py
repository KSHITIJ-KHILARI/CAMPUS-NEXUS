"""LostItem model — an item reported as lost by a user.

Each lost item has a description, category, last known location and
a status indicating whether it has been found/matched.
"""

import enum
import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ItemCategory(str, enum.Enum):
    """Category of a lost or found item."""

    ELECTRONICS = "electronics"
    DOCUMENTS = "documents"
    CLOTHING = "clothing"
    ACCESSORIES = "accessories"
    BOOKS = "books"
    FOOD = "food"
    OTHER = "other"


class ItemStatus(str, enum.Enum):
    """Status of a lost item."""

    LOST = "lost"
    FOUND = "found"
    CLAIMED = "claimed"
    ARCHIVED = "archived"


class LostItem(Base):
    """Lost item report entity."""

    __tablename__ = "lost_items"

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
    reported_by_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    reported_at: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    last_seen_at: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[ItemStatus] = mapped_column(
        String(50), default=ItemStatus.LOST, nullable=False, index=True
    )
    is_anonymous: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    contact_info: Mapped[str | None] = mapped_column(String(512), nullable=True)
    reward_offered: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    reward_amount: Mapped[float | None] = mapped_column(Integer, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    match_confidence: Mapped[float | None] = mapped_column(
        Integer, nullable=True
    )
    matched_found_item_id: Mapped[int | None] = mapped_column(
        ForeignKey("found_items.id"), nullable=True
    )

    # --- Relationships ---
    location: Mapped["CampusLocation | None"] = relationship(
        "CampusLocation",
        lazy="select",
    )
    room: Mapped["Room | None"] = relationship(
        "Room",
        lazy="select",
    )
    reported_by: Mapped["User"] = relationship(
        "User",
        foreign_keys="LostItem.reported_by_user_id",
        lazy="select",
    )
    matched_found_item: Mapped["FoundItem | None"] = relationship(
        "FoundItem",
        foreign_keys="LostItem.matched_found_item_id",
        lazy="select",
    )
    matches: Mapped[list["LostFoundMatch"]] = relationship(
        "LostFoundMatch",
        foreign_keys="LostFoundMatch.lost_item_id",
        back_populates="lost_item",
        lazy="select",
    )
