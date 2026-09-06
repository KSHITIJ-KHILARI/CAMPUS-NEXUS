"""Pydantic schemas for Lost & Found models."""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class LostItemBase(BaseModel):
    """Base lost item schema."""
    category: str
    description: str
    location: str
    lost_time: datetime
    user_id: int
    image_url: Optional[str] = None


class LostItemCreate(LostItemBase):
    """Schema for creating a lost item."""
    pass


class LostItemInDB(LostItemBase):
    """Schema for lost item from database."""
    id: str
    status: str = "active"  # active, found, closed
    created_at: datetime

    class Config:
        from_attributes = True


class LostItem(LostItemInDB):
    """Schema for lost item response."""
    pass


class FoundItemBase(BaseModel):
    """Base found item schema."""
    category: str
    description: str
    location: str
    found_time: datetime
    found_by: int
    image_url: Optional[str] = None


class FoundItemCreate(FoundItemBase):
    """Schema for creating a found item."""
    pass


class FoundItemInDB(FoundItemBase):
    """Schema for found item from database."""
    id: str
    status: str = "available"  # available, claimed, returned
    created_at: datetime

    class Config:
        from_attributes = True


class FoundItem(FoundItemInDB):
    """Schema for found item response."""
    pass


class LostFoundMatch(BaseModel):
    """Schema for lost-found match."""
    lost_item_id: str
    found_item_id: str
    confidence: float
    matched_at: datetime
    status: str  # pending, confirmed, rejected

    class Config:
        from_attributes = True
