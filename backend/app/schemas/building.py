"""Pydantic schemas for Building model."""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List, Any


class BuildingBase(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    num_floors: Optional[int] = None
    description: Optional[str] = None
    is_accessible: bool = True


class BuildingCreate(BuildingBase):
    pass


class BuildingUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    num_floors: Optional[int] = None
    description: Optional[str] = None
    is_accessible: Optional[bool] = None


class BuildingInDB(BuildingBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class Building(BuildingInDB):
    pass


class BuildingWithFloors(Building):
    floors_list: List[dict] = []
