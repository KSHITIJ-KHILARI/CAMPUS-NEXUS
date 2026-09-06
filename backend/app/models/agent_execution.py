"""Agent execution model for Campus NEXUS."""

from sqlalchemy import UUID, Column, String, Integer, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class AgentExecution(Base):
    """Agent execution log."""

    __tablename__ = "agent_executions"

    id = Column(String, primary_key=True, index=True)
    agent_name = Column(String(100), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    query = Column(String(1000))
    tools_used = Column(String)
    result = Column(String)
    confidence = Column(Float)
    execution_time_ms = Column(Integer)
    status = Column(String(50), default="success")
    error = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
    tool_executions = relationship("ToolExecution", back_populates="agent_execution", cascade="all, delete-orphan")
