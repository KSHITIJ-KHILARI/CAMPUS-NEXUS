"""LostFoundMatch model — match between a lost item and a found item.

Represents a suggested or confirmed match between items reported as
lost and items reported as found, with a confidence score.
"""

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class LostFoundMatch(Base):
    """Match between a lost item and a found item entity."""

    __tablename__ = "lost_found_matches"

    id: Mapped[int] = mapped_column(primary_key=True)
    lost_item_id: Mapped[int] = mapped_column(
        ForeignKey("lost_items.id"), nullable=False, index=True
    )
    found_item_id: Mapped[int] = mapped_column(
        ForeignKey("found_items.id"), nullable=False, index=True
    )
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    is_confirmed: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    match_reason: Mapped[str | None] = mapped_column(String(512), nullable=True)
    matched_at: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    confirmed_at: Mapped[str | None] = mapped_column(String(50), nullable=True)
    claimed_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )

    # --- Relationships ---
    lost_item: Mapped["LostItem"] = relationship(
        "LostItem",
        foreign_keys="LostFoundMatch.lost_item_id",
        back_populates="matches",
        lazy="selectin",
    )
    found_item: Mapped["FoundItem"] = relationship(
        "FoundItem",
        foreign_keys="LostFoundMatch.found_item_id",
        back_populates="lost_item_matches",
        lazy="selectin",
    )
