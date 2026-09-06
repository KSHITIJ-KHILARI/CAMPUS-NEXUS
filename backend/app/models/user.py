"""User model — the base entity for all roles in the system.

Defines the core ``User`` table with email, password hash, role and
profile information.  ``Student``, ``Faculty`` and ``Admin`` are thin
specialisations that share the same table via single-table-inheritance
or simple foreign-key relationships depending on the domain need.
"""

import enum
import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    """Enumerated user roles for RBAC."""

    STUDENT = "student"
    FACULTY = "faculty"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"



class User(Base):
    """The central user entity for Campus Nexus.

    Every person — student, faculty or staff — is represented by a
    ``User`` row.  Role-specific profiles live in dedicated tables
    linked by a one-to-one or one-to-many relationship.
    """

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    profile_image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id"), nullable=True
    )
    faculty_id: Mapped[int | None] = mapped_column(
        ForeignKey("faculties.id"), nullable=True
    )
    student_id: Mapped[int | None] = mapped_column(
        ForeignKey("students.id"), nullable=True
    )
    last_login_at: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # --- Relationships ---
    student_profile: Mapped["Student | None"] = relationship(
        "Student",
        back_populates="user",
        foreign_keys="Student.user_id",
        lazy="select",
    )
    faculty_profile: Mapped["Faculty | None"] = relationship(
        "Faculty",
        back_populates="user",
        foreign_keys="Faculty.user_id",
        lazy="select",
    )
    admin_profile: Mapped["Admin | None"] = relationship(
        "Admin",
        back_populates="user",
        foreign_keys="Admin.user_id",
        lazy="select",
    )
    department: Mapped["Department | None"] = relationship(
        "Department",
        back_populates="users",
        lazy="select",
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification",
        back_populates="user",
        lazy="select",
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog",
        back_populates="user",
        lazy="select",
    )

    __table_args__ = (
        {"sqlite_autoincrement": False},
    )
