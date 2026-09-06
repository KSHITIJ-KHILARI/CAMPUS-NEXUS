"""Tool execution model for Campus NEXUS."""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class ToolExecution(Base):
    """Tool execution log."""

    __tablename__ = "tool_executions"

    id = Column(String, primary_key=True, index=True)
    agent_execution_id = Column(String, ForeignKey("agent_executions.id"), nullable=False)
    tool_name = Column(String(100), nullable=False)
    input_data = Column(String)
    output_data = Column(String)
    execution_time_ms = Column(Integer)
    status = Column(String(50), default="success")
    error = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    agent_execution = relationship("AgentExecution", back_populates="tool_executions")
