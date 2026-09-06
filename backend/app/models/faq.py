"""FAQ and Knowledge base models for Campus NEXUS."""

from sqlalchemy import Column, String, DateTime, Text
from datetime import datetime
import uuid

from app.core.database import Base


class FAQEntry(Base):
    """University FAQ Entry."""

    __tablename__ = "faq_entries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    question = Column(String(500), nullable=False, index=True)
    answer = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)  # academics, admissions, campus, library, examinations, it, clubs, facilities
    department = Column(String(100), default="General")
    source = Column(String(255), default="University Official Portal")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class KnowledgeDocument(Base):
    """University official policy document."""

    __tablename__ = "knowledge_documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, index=True)
    content = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    source = Column(String(255), default="Registrar Office")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
