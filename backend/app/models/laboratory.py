"""Laboratory model — laboratory-specific attributes linked to a Room.

Stores lab type, safety level, equipment list and supervision
requirements.
"""

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SafetyLevel(str, Enum):
    """Enumeration of laboratory safety levels."""

    BASIC = "basic"
    GENERAL = "general"
    HIGH = "high"
    BIOHAZARD = "biohazard"
    CHEMICAL = "chemical"


class LabType(str, Enum):
    """Enumeration of laboratory types."""

    COMPUTER = "computer"
    PHYSICS = "physics"
    CHEMISTRY = "chemistry"
    BIOLOGY = "biology"
    ENGINEERING = "engineering"
    LANGUAGE = "language"
    MULTIPURPOSE = "multipurpose"


class Laboratory(Base):
    """Laboratory-specific entity linked one-to-one with a ``Room``."""

    __tablename__ = "laboratories"

    id: Mapped[int] = mapped_column(primary_key=True)
    room_id: Mapped[int] = mapped_column(
        ForeignKey("rooms.id"), unique=True, nullable=False, index=True
    )
    lab_type: Mapped[LabType] = mapped_column(
        String(50), default=LabType.COMPUTER, nullable=False
    )
    safety_level: Mapped[SafetyLevel] = mapped_column(
        String(50), default=SafetyLevel.GENERAL, nullable=False
    )
    requires_supervisor: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    max_occupancy: Mapped[int] = mapped_column(Integer, nullable=True)
    equipment_list: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # --- Relationships ---
    room: Mapped["Room"] = relationship(
        "Room",
        back_populates="laboratory",
        lazy="selectin",
    )
    equipment: Mapped[list["Equipment"]] = relationship(
        "Equipment",
        back_populates="laboratory",
        lazy="selectin",
    )
