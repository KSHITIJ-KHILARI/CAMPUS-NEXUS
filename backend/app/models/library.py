"""Library models for Campus NEXUS."""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base, GUID


class LibraryBook(Base):
    """Library book entity."""

    __tablename__ = "library_books"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=False, index=True)
    isbn = Column(String(50), nullable=True, index=True)
    edition = Column(String(50), nullable=True)
    publisher = Column(String(255), nullable=True)
    publication_year = Column(Integer, nullable=True)
    subject = Column(String(100), nullable=True, index=True)
    department = Column(String(100), nullable=True)
    shelf_location = Column(String(50), nullable=True)
    total_copies = Column(Integer, default=1)
    available_copies = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    copies = relationship("LibraryBookCopy", back_populates="book", cascade="all, delete-orphan")
    reservations = relationship("LibraryReservation", back_populates="book", cascade="all, delete-orphan")


class LibraryBookCopy(Base):
    """Individual copy of a library book."""

    __tablename__ = "library_copies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    book_id = Column(String, ForeignKey("library_books.id"), nullable=False)
    copy_number = Column(Integer, nullable=False)
    status = Column(String(50), default="available")  # available, borrowed, reserved, maintenance
    due_date = Column(DateTime, nullable=True)
    borrower_id = Column(GUID(), ForeignKey("users.id"), nullable=True)

    book = relationship("LibraryBook", back_populates="copies")


class LibraryReservation(Base):
    """Book reservation record."""

    __tablename__ = "library_reservations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    book_id = Column(String, ForeignKey("library_books.id"), nullable=False)
    student_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    reserved_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="pending")  # pending, ready_for_pickup, fulfilled, cancelled
    pickup_deadline = Column(DateTime, nullable=True)

    book = relationship("LibraryBook", back_populates="reservations")


class LibrarySeat(Base):
    """Library seat occupancy entity."""

    __tablename__ = "library_seats"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    zone = Column(String(50), nullable=False)  # silent, group_study, reading_hall, computer_area
    seat_number = Column(String(20), nullable=False)
    is_occupied = Column(Boolean, default=False)
    occupied_by_student_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
