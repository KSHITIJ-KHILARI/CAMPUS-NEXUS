"""Buildings API routes."""

from sqlalchemy.orm import selectinload
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_db, get_current_active_user, require_admin
from app.models.building import Building as BuildingModel
from app.models.user import User
from app.schemas.building import BuildingCreate, BuildingUpdate, BuildingWithFloors

router = APIRouter()


@router.get("", response_model=List[BuildingWithFloors], tags=["buildings"])
@router.get("/", response_model=List[BuildingWithFloors], tags=["buildings"])
async def list_buildings(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all buildings with their floors."""
    result = await db.execute(
        select(BuildingModel).options(selectinload(BuildingModel.floors))
    )
    buildings = result.scalars().all()

    response_list = []
    for b in buildings:
        b_dict = {
            "id": b.id,
            "name": b.name,
            "code": b.code,
            "address": b.address,
            "latitude": b.latitude,
            "longitude": b.longitude,
            "num_floors": b.num_floors,
            "description": b.description,
            "is_accessible": b.is_accessible,
            "floors_list": [{"id": f.id, "floor_number": f.floor_number, "name": f.name} for f in b.floors],
        }
        response_list.append(BuildingWithFloors(**b_dict))
    return response_list


@router.get("/{building_id}", response_model=BuildingWithFloors, tags=["buildings"])
async def get_building(
    building_id: int,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get building details."""
    result = await db.execute(
        select(BuildingModel)
        .where(BuildingModel.id == building_id)
        .options(selectinload(BuildingModel.floors))
    )
    building = result.scalar_one_or_none()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    return BuildingWithFloors(
        id=building.id,
        name=building.name,
        code=building.code,
        address=building.address,
        latitude=building.latitude,
        longitude=building.longitude,
        num_floors=building.num_floors,
        description=building.description,
        is_accessible=building.is_accessible,
        floors_list=[{"id": f.id, "floor_number": f.floor_number, "name": f.name} for f in building.floors],
    )


@router.post("", response_model=BuildingWithFloors, tags=["buildings"])
@router.post("/", response_model=BuildingWithFloors, tags=["buildings"])
async def create_building(
    building_in: BuildingCreate,
    db: AsyncSession = Depends(get_current_db),
    _: User = Depends(require_admin),
):
    """Create a new building."""
    building = BuildingModel(**building_in.model_dump())
    db.add(building)
    await db.commit()
    await db.refresh(building)
    return BuildingWithFloors(
        id=building.id,
        name=building.name,
        code=building.code,
        address=building.address,
        latitude=building.latitude,
        longitude=building.longitude,
        num_floors=building.num_floors,
        description=building.description,
        is_accessible=building.is_accessible,
        floors_list=[],
    )
