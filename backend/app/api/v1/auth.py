"""Authentication API v1 routes."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import uuid
import logging
import time
from jose import jwt

from app.api.deps import get_current_db, get_current_active_user
from app.core.security import create_access_token, create_refresh_token, verify_password
from app.core.redis_client import cache_set
from app.models import User
from app.schemas import Token, UserInDB

logger = logging.getLogger(__name__)

router = APIRouter()


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


@router.post("/login", response_model=Token, tags=["auth"])
async def login(
    request: Request,
    db: AsyncSession = Depends(get_current_db),
):
    """Login with email and password (JSON or Form). Returns JWT token and User object."""
    email = None
    password = None

    try:
        # First attempt JSON body parsing
        data = await request.json()
        if isinstance(data, dict):
            email = data.get("email") or data.get("username")
            password = data.get("password")
    except Exception:
        pass

    if not email or not password:
        try:
            # Fallback to form data parsing
            form = await request.form()
            email = form.get("username") or form.get("email")
            password = form.get("password")
        except Exception:
            pass

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email/username and password are required",
        )

    clean_email = str(email).strip()
    result = await db.execute(select(User).where(User.email.ilike(clean_email)))
    user = result.scalar_one_or_none()

    if not user or not verify_password(str(password), user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )

    role_val = str(getattr(user.role, "value", user.role))
    access_token = create_access_token(subject=str(user.id), data={"role": role_val})
    refresh_tok = create_refresh_token(subject=str(user.id), data={"role": role_val})

    user_data = UserInDB.model_validate(user)

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_data,
        refresh_token=refresh_tok,
    )



@router.get("/me", response_model=UserInDB, tags=["auth"])
@router.get("/verify", response_model=UserInDB, tags=["auth"])
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
):
    """Get current user information (verify session)."""
    return UserInDB.model_validate(current_user)


@router.get("/health", tags=["auth"])
async def auth_health_check(
    current_user: User = Depends(get_current_active_user),
):
    """Safe authentication diagnostic endpoint (Requirement 28)."""
    return {
        "authenticated": True,
        "user_id": str(current_user.id),
        "email": current_user.email,
        "role": str(current_user.role),
        "token_status": "valid",
    }


@router.post("/refresh", response_model=Token, tags=["auth"])
async def refresh_token(
    payload: dict,
    db: AsyncSession = Depends(get_current_db),
):
    """Refresh access token using refresh token."""
    from app.core.security import decode_token

    refresh_token_value = payload.get("refresh_token")
    token_payload = decode_token(refresh_token_value) if refresh_token_value else None
    if not token_payload or token_payload.get("token_type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = token_payload.get("sub")
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    access_token = create_access_token(subject=str(user.id), data={"role": str(user.role)})
    new_refresh_token = create_refresh_token(subject=str(user.id), data={"role": str(user.role)})

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserInDB.model_validate(user),
        refresh_token=new_refresh_token,
    )


@router.post("/logout", tags=["auth"])
async def logout(request: Request):
    """Logout current user."""
    authorization = request.headers.get("authorization", "")
    if authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
        if token:
            try:
                token_payload = jwt.get_unverified_claims(token)
                expires_at = int(token_payload.get("exp", 0))
                ttl = max(expires_at - int(time.time()), 1)
                await cache_set(f"revoked_token:{token}", "1", expire=ttl)
            except Exception:
                pass
    return {"message": "Successfully logged out"}
