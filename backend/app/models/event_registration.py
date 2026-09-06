"""EventRegistration model — a user's registration for an event.
"""

import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RegistrationStatus(str, enum.Enum):
    """Enumeration of event registration statuses."""

    REGISTERED = "registered"
    ATTENDED = "attended"
    CANCELLED = "cancelled"
    WAITLISTED = "waitlisted"


class EventRegistration(Base):
    """Event registration entity."""

    __tablename__ = "event_registrations"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[str] = mapped_column(
        ForeignKey("events.id"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    status: Mapped[RegistrationStatus] = mapped_column(
        String(50),
        default=RegistrationStatus.REGISTERED,
        nullable=False,
        index=True,
    )
    registered_at: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    attended_at: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    ticket_code: Mapped[str | None] = mapped_column(String(128), unique=True, nullable=True)

    # --- Relationships ---
    event: Mapped["Event"] = relationship(
        "Event",
        back_populates="registrations_list",
        lazy="selectin",
    )
    user: Mapped["User"] = relationship(
        "User",
        lazy="selectin",
    )

