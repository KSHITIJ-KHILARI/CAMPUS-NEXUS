"""Dependency injection for FastAPI endpoints.

Provides reusable dependencies for authentication, authorization,
database sessions, and current user retrieval.
"""

from typing import Annotated

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.database import async_session_factory, get_session
from app.core.redis_client import cache_get
from app.core.security import verify_token
from app.models import User, Student, Faculty, Admin

# --------------------------------------------------------------------------- #
# Database
# --------------------------------------------------------------------------- #

async def get_current_db() -> AsyncSession:
    """Dependency for getting a database session."""
    async with async_session_factory() as session:
        yield session


# --------------------------------------------------------------------------- #
# Authentication
# --------------------------------------------------------------------------- #

import logging

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_current_db)],
) -> User:
    """Get the current authenticated user from JWT token with detailed failure logging."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token or token == "undefined" or token == "null":
        logger.warning("[AUTH_FAILURE] Reason: NO_TOKEN — Bearer authorization header missing or undefined.")
        raise credentials_exception

    if await cache_get(f"revoked_token:{token}"):
        logger.warning("[AUTH_FAILURE] Reason: REVOKED_TOKEN — token was invalidated during logout.")
        raise credentials_exception

    payload = verify_token(token)
    if payload is None:
        logger.warning("[AUTH_FAILURE] Reason: INVALID_TOKEN or EXPIRED_TOKEN — JWT decode failed.")
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        logger.warning("[AUTH_FAILURE] Reason: INVALID_TOKEN — JWT subject claim missing.")
        raise credentials_exception

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        logger.warning("[AUTH_FAILURE] Reason: INVALID_TOKEN — Invalid UUID format in subject claim: %s", user_id)
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()

    if user is None:
        logger.warning("[AUTH_FAILURE] Reason: USER_NOT_FOUND — User ID %s does not exist in database.", user_id)
        raise credentials_exception

    return user


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
        user_role_str = str(current_user.role)
        if user_role_str not in self.allowed_roles:
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
