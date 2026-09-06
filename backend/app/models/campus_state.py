"""Campus state model for Campus NEXUS Digital Twin."""

from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class CampusState(Base):
    """Current state snapshot of the entire campus."""

    __tablename__ = "campus_state"

    id = Column(String, primary_key=True, index=True)
    version = Column(Integer, default=1)
    state_data = Column(String)  # JSON string
    buildings = Column(String)  # JSON string
    rooms = Column(String)  # JSON string
    crowd = Column(String)  # JSON string
    issues = Column(String)  # JSON string
    lifts = Column(String)  # JSON string
    events = Column(String)  # JSON string
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
