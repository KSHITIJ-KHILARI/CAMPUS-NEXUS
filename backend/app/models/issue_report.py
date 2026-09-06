"""IssueReport model — a status update or comment on an issue.

Each time an issue is updated (status change, comment added, etc.),
a new :class:`IssueReport` row is created for auditability.
"""

import enum

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
import uuid


class ReportType(str, enum.Enum):
    """Type of issue report / status update."""

    COMMENT = "comment"
    STATUS_UPDATE = "status_update"
    ASSIGNMENT = "assignment"
    ESCALATION = "escalation"
    RESOLUTION = "resolution"


class IssueReport(Base):
    """Status update / comment on an issue entity."""

    __tablename__ = "issue_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    issue_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("issues.id"), nullable=False, index=True
    )
    reported_by_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    report_type: Mapped[ReportType] = mapped_column(
        String(50), default=ReportType.COMMENT, nullable=False
    )
    status_change_to: Mapped[str | None] = mapped_column(String(32), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # --- Relationships ---
    issue: Mapped["Issue"] = relationship(
        "Issue",
        back_populates="reports",
        lazy="selectin",
    )
    reported_by: Mapped["User"] = relationship(
        "User",
        lazy="selectin",
    )

