"""Issue model for Campus NEXUS."""

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

from app.core.database import Base, GUID


class IssueCategory(str, enum.Enum):
    """Category of campus issue."""
    AC = "ac"
    PROJECTOR = "projector"
    WIFI = "wifi"
    LIFT = "lift"
    WASHROOM = "washroom"
    BENCH = "bench"
    WATER_COOLER = "water_cooler"
    EQUIPMENT = "equipment"
    CLASSROOM = "classroom"
    ELECTRICAL = "electrical"
    OTHER = "other"


class IssuePriority(str, enum.Enum):
    """Priority level of an issue."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IssueStatus(str, enum.Enum):
    """Status of an issue."""
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class Issue(Base):
    """Canonical issue entity."""

    __tablename__ = "issues"

    id = Column(String, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(50))
    location_id = Column(Integer, ForeignKey("campus_locations.id"), nullable=False)
    description = Column(String(1000))
    priority = Column(String(50))
    status = Column(String(50))
    report_count = Column(Integer, default=1)
    confidence = Column(Float, default=1.0)
    cluster_id = Column(Integer, ForeignKey("issue_clusters.id"))
    assigned_to = Column(GUID(), ForeignKey("users.id"))
    reporter_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    location = relationship("CampusLocation")
    reports = relationship("IssueReport", back_populates="issue", cascade="all, delete-orphan")
    cluster = relationship("IssueCluster", back_populates="issues")
    reporter = relationship("User", foreign_keys=[reporter_id])
    assigned_to_user = relationship("User", foreign_keys=[assigned_to])
