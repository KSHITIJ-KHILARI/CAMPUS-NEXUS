"""IssueCluster model — groups of similar issues.

Issues that are spatially and semantically close are clustered
together for efficient resolution and pattern analysis.
"""

from sqlalchemy import ForeignKey, Float, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class IssueCluster(Base):
    """Cluster of similar issues entity."""

    __tablename__ = "issue_clusters"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    issue_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    centroid_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    centroid_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    building_id: Mapped[int | None] = mapped_column(
        ForeignKey("buildings.id"), nullable=True, index=True
    )
    room_id: Mapped[int | None] = mapped_column(
        ForeignKey("rooms.id"), nullable=True, index=True
    )
    issue_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    representative_tags: Mapped[list | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    resolved_at: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at_cluster: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # --- Relationships ---
    issues: Mapped[list["Issue"]] = relationship(
        "Issue",
        back_populates="cluster",
        lazy="selectin",
    )
