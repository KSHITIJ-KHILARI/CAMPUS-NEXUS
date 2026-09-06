"""BuzzPost model — short-form social posts from the campus community.

Similar to a micro-blog / Twitter-style post.  Users can post about
campus life, locations, events, etc.
"""

import enum
import uuid

from sqlalchemy import (
    Boolean,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BuzzPostStatus(str, enum.Enum):
    """Moderation / visibility status of a buzz post."""

    ACTIVE = "active"
    HIDDEN = "hidden"
    REMOVED = "removed"
    PENDING = "pending"


class BuzzPost(Base):
    """Campus buzz / micro-blog post entity."""

    __tablename__ = "buzz_posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    location_id: Mapped[int | None] = mapped_column(
        ForeignKey("campus_locations.id"), nullable=True, index=True
    )
    status: Mapped[BuzzPostStatus] = mapped_column(
        String(50),
        default=BuzzPostStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    likes_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    comments_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True)
    attachments: Mapped[list | None] = mapped_column(JSON, nullable=True)
    is_anonymous: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    visibility: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # --- Relationships ---
    user: Mapped["User"] = relationship(
        "User",
        lazy="selectin",
    )
    location: Mapped["CampusLocation | None"] = relationship(
        "CampusLocation",
        back_populates="buzz_posts",
        lazy="selectin",
    )

