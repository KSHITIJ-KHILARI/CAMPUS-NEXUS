"""Dependency injection for FastAPI endpoints.

Provides reusable dependencies for authentication, authorization,
and current user retrieval using Firebase.
"""

from typing import Annotated
import logging
from enum import Enum

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

from app.core.config import settings
from app.core.firebase import auth_client, db

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# Models
# --------------------------------------------------------------------------- #

class UserRole(str, Enum):
    """Enumerated user roles for RBAC."""
    STUDENT = "student"
    FACULTY = "faculty"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

class User(BaseModel):
    """The central user entity for Campus Nexus."""
    id: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool = True

# --------------------------------------------------------------------------- #
# Authentication
# --------------------------------------------------------------------------- #

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
) -> User:
    """Get the current authenticated user from Firebase Auth token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token or token == "undefined" or token == "null":
        logger.warning("[AUTH_FAILURE] Reason: NO_TOKEN — Bearer authorization header missing or undefined.")
        raise credentials_exception

    try:
        payload = auth_client.verify_id_token(token)
        user_id = payload.get("uid")
    except Exception as e:
        logger.warning(f"[AUTH_FAILURE] Firebase Auth decode failed: {e}")
        raise credentials_exception

    if user_id is None:
        logger.warning("[AUTH_FAILURE] Reason: INVALID_TOKEN — Firebase uid missing.")
        raise credentials_exception

    # Fetch user from Firestore
    try:
        doc_ref = db.collection("users").document(user_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            logger.warning("[AUTH_FAILURE] Reason: USER_NOT_FOUND — User ID %s does not exist in Firestore.", user_id)
            raise credentials_exception
            
        data = doc.to_dict()
        return User(
            id=user_id,
            email=data.get("email", payload.get("email", "")),
            full_name=data.get("full_name", payload.get("name", "Student")),
            role=UserRole(data.get("role", "student")),
            is_active=data.get("isActive", True)
        )
    except Exception as e:
        logger.error(f"[AUTH_FAILURE] Firestore error: {e}")
        raise credentials_exception


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Get the current active user."""
    if not current_user.is_active:
        logger.warning("[AUTH_FAILURE] Reason: INACTIVE_USER — User %s is disabled.", current_user.email)
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


# --------------------------------------------------------------------------- #
# Authorization
# --------------------------------------------------------------------------- #

class RoleRequired:
    """Dependency class for role-based access control."""

    def __init__(self, *allowed_roles: str):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: Annotated[User, Depends(get_current_active_user)]) -> User:
        user_role_str = str(getattr(current_user.role, "value", current_user.role)).lower()
        if user_role_str.startswith("userrole."):
            user_role_str = user_role_str.split(".", 1)[1]
        
        allowed_normalized = [str(getattr(r, "value", r)).lower() for r in self.allowed_roles]
        if user_role_str not in allowed_normalized:
            logger.warning(
                "[AUTH_FAILURE] Reason: ROLE_NOT_ALLOWED — User %s with role '%s' attempted to access route requiring %s",
                current_user.email, user_role_str, self.allowed_roles
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for your role",
            )
        return current_user


# Convenience dependencies
require_student = RoleRequired("student")
require_faculty = RoleRequired("faculty")
require_admin = RoleRequired("admin", "super_admin")
require_student_or_faculty = RoleRequired("student", "faculty")
require_any_role = RoleRequired("student", "faculty", "admin", "super_admin")
