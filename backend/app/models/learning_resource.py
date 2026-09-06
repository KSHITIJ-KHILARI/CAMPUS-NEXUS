"""Learning Resource models for Campus NEXUS."""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base, GUID


class LearningResource(Base):
    """Academic learning resource entity."""

    __tablename__ = "learning_resources"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    type = Column(String(50), nullable=False)  # book, chapter, video, notes, practice_set, tutorial
    course_id = Column(String, nullable=True)
    module_name = Column(String(100), nullable=True, index=True)
    topic = Column(String(100), nullable=True, index=True)
    difficulty = Column(String(50), default="intermediate")  # beginner, intermediate, advanced
    duration_minutes = Column(Integer, default=30)
    url = Column(String(500), nullable=True)
    author_faculty_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    is_verified = Column(Boolean, default=True)
    rating = Column(Float, default=4.5)
    rating_count = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ResourceBookmark(Base):
    """Student resource bookmark."""

    __tablename__ = "resource_bookmarks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    resource_id = Column(String, ForeignKey("learning_resources.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
