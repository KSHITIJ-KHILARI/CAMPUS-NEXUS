"""Pydantic schemas for User model."""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
import uuid


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: str
    role: str  # student, faculty, admin


class UserCreate(UserBase):
    """Schema for creating a user."""
    password: str


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class UserInDB(UserBase):
    """Schema for user from database."""
    id: uuid.UUID
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True



class User(UserInDB):
    """Schema for user response."""
    pass


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str
    user: User
    refresh_token: str | None = None


class TokenPayload(BaseModel):
    """Schema for JWT token payload."""
    sub: str
    exp: datetime
    iat: datetime
