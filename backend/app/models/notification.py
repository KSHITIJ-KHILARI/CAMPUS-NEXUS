"""Notification model for Campus NEXUS."""

import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Notification(Base):
    """Notification entity."""

    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    recipient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    event: Mapped[str] = mapped_column(String(255), nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    priority: Mapped[str] = mapped_column(String(50), default="info")
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    data: Mapped[str | None] = mapped_column(String, nullable=True)
    expiration: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")
