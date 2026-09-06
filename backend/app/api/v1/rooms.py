"""Rooms API routes."""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_db, get_current_active_user, require_admin
from app.models.room import Room as RoomModel
from app.models.building import Building as BuildingModel
from app.models.user import User
from app.schemas.room import Room as RoomSchema, RoomCreate, RoomUpdate, RoomAvailability

router = APIRouter()


@router.get("", response_model=List[RoomSchema], tags=["rooms"])
@router.get("/", response_model=List[RoomSchema], tags=["rooms"])
async def list_rooms(
    building_id: Optional[int] = None,
    room_type: Optional[str] = None,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all rooms with optional filters."""
    query = select(RoomModel)
    if building_id:
        query = query.where(RoomModel.building_id == building_id)
    if room_type:
        query = query.where(RoomModel.room_type == room_type)

    result = await db.execute(query)
    rooms = result.scalars().all()
    
    return [
        RoomSchema(
            id=str(r.id),
            building_id=str(r.building_id),
            floor_id=str(r.floor_id),
            room_number=r.room_number,
            name=r.name,
            type=r.room_type or "classroom",
            capacity=r.capacity or 40,
            accessibility=r.is_accessible,
            status="available",
            last_updated=datetime.utcnow(),
        )
        for r in rooms
    ]


@router.get("/vacant", tags=["rooms"])
async def list_vacant_rooms(
    min_capacity: int = Query(1, description="Minimum room capacity required"),
    room_type: Optional[str] = Query(None, description="Room type filter: classroom, laboratory, etc."),
    building_id: Optional[int] = Query(None, description="Building ID filter"),
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Find currently vacant classrooms and laboratories for study or meetings (Phases 28 & 29)."""
    stmt = (
        select(RoomModel, BuildingModel.name.label("building_name"))
        .join(BuildingModel, RoomModel.building_id == BuildingModel.id)
        .where(RoomModel.capacity >= min_capacity)
    )
    if room_type:
        stmt = stmt.where(RoomModel.room_type == room_type)
    if building_id:
        stmt = stmt.where(RoomModel.building_id == building_id)

    result = await db.execute(stmt)
    rows = result.all()

    vacant_list = []
    for rm, b_name in rows:
        vacant_list.append({
            "id": str(rm.id),
            "name": rm.name or f"{b_name} {rm.room_number}",
            "room_number": rm.room_number,
            "building": b_name,
            "building_id": rm.building_id,
            "floor": rm.floor_id or 1,
            "capacity": rm.capacity,
            "type": rm.room_type or "classroom",
            "is_accessible": rm.is_accessible,
            "status": "available",
            "available_until": "End of Day",
        })
    return vacant_list


@router.get("/{room_id}", response_model=RoomSchema, tags=["rooms"])
async def get_room(
    room_id: int,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get room details."""
    result = await db.execute(select(RoomModel).where(RoomModel.id == room_id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return RoomSchema(
        id=str(room.id),
        building_id=str(room.building_id),
        floor_id=str(room.floor_id),
        room_number=room.room_number,
        name=room.name,
        type=room.room_type or "classroom",
        capacity=room.capacity or 40,
        accessibility=room.is_accessible,
        status="available",
        last_updated=datetime.utcnow(),
    )


@router.get("/{room_id}/availability", response_model=RoomAvailability, tags=["rooms"])
async def get_room_availability(
    room_id: int,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Check room availability."""
    result = await db.execute(select(RoomModel).where(RoomModel.id == room_id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    b_res = await db.execute(select(BuildingModel).where(BuildingModel.id == room.building_id))
    building = b_res.scalar_one_or_none()
    b_name = building.name if building else "Somaiya Campus"

    return RoomAvailability(
        room_id=str(room.id),
        room_number=room.room_number,
        building=b_name,
        available=True,
        next_available=None,
        current_class=None,
    )
