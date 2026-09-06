"""LiftStatus model — point-in-time status snapshot of a lift.

Each row records the operational state of a lift at a given moment,
enabling historical analysis and real-time crowd routing decisions.
"""

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class LiftStatus(Base):
    """Point-in-time status snapshot of a lift."""

    __tablename__ = "lift_status_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    lift_id: Mapped[str] = mapped_column(
        ForeignKey("lifts.id"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )
    current_floor: Mapped[int | None] = mapped_column(Integer, nullable=True)
    direction: Mapped[str] = mapped_column(
        String(50), default="idle", nullable=False
    )
    is_operational: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    is_door_open: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # --- Relationships ---
    lift: Mapped["Lift"] = relationship(
        "Lift",
        back_populates="statuses",
        lazy="selectin",
    )
