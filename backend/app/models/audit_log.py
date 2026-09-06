"""Audit log model for Campus NEXUS."""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base, GUID


class AuditLog(Base):
    """Audit log for admin actions."""

    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    action = Column(String(255), nullable=False)
    target_entity = Column(String(255))
    target_id = Column(String)
    changes = Column(String)  # JSON string
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
