"""Pydantic schemas for Notification model."""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Any


class NotificationBase(BaseModel):
    recipient_id: Any
    event: str
    reason: str
    priority: str
    data: Optional[Any] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationInDB(NotificationBase):
    id: str
    read: bool = False
    timestamp: Optional[datetime] = None
    expiration: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class Notification(NotificationInDB):
    pass


class NotificationPreferenceBase(BaseModel):
    user_id: Any
    channel: str = "in_app"
    event_type: str
    enabled: bool = True


class NotificationPreference(NotificationPreferenceBase):
    id: str

    model_config = ConfigDict(from_attributes=True)
