"""Admin model — administrative staff profile linked to a ``User``.

Stores employee number, department, designation and permissions.
"""

import enum
import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AdminRole(str, enum.Enum):
    """Enumeration of administrative sub-roles."""

    DEPARTMENT_ADMIN = "department_admin"
    FACULTY_ADMIN = "faculty_admin"
    SYSTEM_ADMIN = "system_admin"
    SUPER_ADMIN = "super_admin"


class Admin(Base):
    """Admin profile entity."""

    __tablename__ = "admins"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), unique=True, nullable=False, index=True
    )
    employee_id_number: Mapped[str] = mapped_column(
        String(32), unique=True, nullable=False, index=True
    )
    admin_role: Mapped[AdminRole] = mapped_column(
        String(50), nullable=False, index=True
    )
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id"), nullable=True
    )
    join_date: Mapped[str] = mapped_column(String(50), nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    permissions: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # --- Relationships ---
    user: Mapped["User"] = relationship(
        "User",
        back_populates="admin_profile",
        foreign_keys="Admin.user_id",
        lazy="selectin",
    )
    department: Mapped["Department | None"] = relationship(
        "Department",
        back_populates="admins",
        lazy="selectin",
    )

