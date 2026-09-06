"""Digital Twin API v1 routes for Campus NEXUS."""

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Any
import json
import asyncio

from app.api.deps import get_current_db, get_current_active_user
from app.models.building import Building
from app.models.room import Room
from app.models.campus_location import CampusLocation
from app.models.issue import Issue
from app.models.lift import Lift
from app.models.event import Event as EventModel
from app.models.crowd_state import CrowdState
from app.models.presence import PresenceConsent
from app.models.user import User
from app.models.campus_state import CampusState
from app.services.digital_twin_service import DigitalTwinService
from app.services.location_service import LocationService

router = APIRouter()
digital_twin_service = DigitalTwinService()


@router.get("/state", tags=["digital-twin"])
async def get_digital_twin_state(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get the current digital twin state from backend data."""
    try:
        # Fetch buildings
        buildings_result = await db.execute(select(Building))
        buildings = buildings_result.scalars().all()
        buildings_data = []
        for b in buildings:
            buildings_data.append({
                "id": b.id,
                "name": b.name,
                "code": b.code,
                "latitude": b.latitude,
                "longitude": b.longitude,
                "num_floors": b.num_floors,
                "is_accessible": b.is_accessible,
                "status": "operational",
            })

        # Fetch rooms with occupancy
        rooms_result = await db.execute(select(Room))
        rooms = rooms_result.scalars().all()
        rooms_data = []
        for r in rooms:
            rooms_data.append({
                "id": r.id,
                "building_id": r.building_id,
                "room_number": r.room_number,
                "name": r.name,
                "capacity": r.capacity,
                "room_type": r.room_type,
                "status": r.status,
                "is_accessible": r.is_accessible,
            })

        # Fetch campus locations
        locations_result = await db.execute(select(CampusLocation))
        locations = locations_result.scalars().all()
        locations_data = []
        for loc in locations:
            locations_data.append({
                "id": loc.id,
                "name": loc.name,
                "location_type": loc.location_type,
                "building_id": loc.building_id,
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "capacity": getattr(loc, "capacity", None),
                "status": getattr(loc, "status", "operational"),
            })

        # Fetch active issues
        issues_result = await db.execute(
            select(Issue).where(Issue.status.in_(["open", "in_progress"]))
        )
        issues = issues_result.scalars().all()
        issues_data = []
        for iss in issues:
            issues_data.append({
                "id": iss.id,
                "title": iss.title,
                "category": iss.category,
                "priority": iss.priority,
                "status": iss.status,
                "location_id": iss.location_id,
            })

        # Fetch lifts
        lifts_result = await db.execute(select(Lift))
        lifts = lifts_result.scalars().all()
        lifts_data = []
        for lift in lifts:
            lifts_data.append({
                "id": lift.id,
                "building_id": lift.building_id,
                "lift_number": lift.lift_number,
                "status": lift.status,
                "current_floor": lift.current_floor,
                "direction": lift.direction,
                "capacity": lift.capacity,
            })

        # Fetch crowd states with real-time GPS rush intelligence
        crowd_data = {}
        try:
            rush_states = await LocationService.get_rush_state(db)
            for r in rush_states:
                loc_id = r.get("location_id")
                crowd_data[f"location_{loc_id}"] = {
                    "density_level": str(r.get("rush_level", "LOW")).lower(),
                    "current_count": r.get("current_count", 0),
                    "capacity": r.get("capacity"),
                    "occupancy_ratio": r.get("occupancy_ratio", 0.0),
                    "is_alert": r.get("rush_level") in ("HIGH", "VERY_HIGH"),
                    "source": r.get("source", "GPS_REALTIME"),
                    "confidence": r.get("confidence", 0.8),
                }
        except Exception:
            crowd_result = await db.execute(select(CrowdState))
            crowd_states = crowd_result.scalars().all()
            for cs in crowd_states:
                crowd_data[f"location_{cs.location_id}"] = {
                    "density_level": cs.density_level,
                    "current_count": cs.current_count,
                    "capacity": cs.capacity,
                    "occupancy_ratio": cs.occupancy_ratio,
                    "is_alert": cs.is_alert,
                }

        # Fetch active events
        events_result = await db.execute(
            select(EventModel).where(EventModel.status.in_(["upcoming", "ongoing"]))
        )
        events = events_result.scalars().all()
        events_data = []
        for evt in events:
            events_data.append({
                "id": evt.id,
                "title": evt.title,
                "event_type": evt.event_type,
                "location_id": evt.location_id,
                "start_time": evt.start_time.isoformat() if evt.start_time else None,
                "end_time": evt.end_time.isoformat() if evt.end_time else None,
                "status": evt.status,
                "max_participants": evt.max_participants,
                "registrations": evt.registrations,
            })

        # Fetch presence counts (only enabled, respecting privacy)
        presence_result = await db.execute(
            select(PresenceConsent).where(PresenceConsent.is_enabled == True)
        )
        presence_consents = presence_result.scalars().all()
        presence_summary = {
            "active_users": len(presence_consents),
            "zones": {},
        }
        for p in presence_consents:
            if p.current_zone:
                presence_summary["zones"][p.current_zone] = (
                    presence_summary["zones"].get(p.current_zone, 0) + 1
                )

        state = {
            "buildings": buildings_data,
            "rooms": rooms_data,
            "campus_locations": locations_data,
            "issues": issues_data,
            "lifts": lifts_data,
            "crowd": crowd_data,
            "events": events_data,
            "presence": presence_summary,
            "last_updated": __import__("datetime").datetime.utcnow().isoformat(),
        }

        # Also persist to campus_state table (upsert with fixed ID)
        state_json = json.dumps(state)
        existing = await db.execute(select(CampusState).where(CampusState.id == "current"))
        existing_row = existing.scalar_one_or_none()
        if existing_row:
            existing_row.state_data = state_json
            existing_row.version = (existing_row.version or 0) + 1
            db.add(existing_row)
        else:
            campus_state = CampusState(id="current", state_data=state_json)
            db.add(campus_state)
        await db.commit()

        return state
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to load digital twin state: {str(exc)}")


@router.get("/buildings", tags=["digital-twin"])
async def get_digital_twin_buildings(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get all buildings for digital twin."""
    result = await db.execute(select(Building))
    buildings = result.scalars().all()
    return [
        {
            "id": b.id,
            "name": b.name,
            "code": b.code,
            "latitude": b.latitude,
            "longitude": b.longitude,
            "num_floors": b.num_floors,
            "is_accessible": b.is_accessible,
        }
        for b in buildings
    ]


@router.get("/buildings/{building_id}", tags=["digital-twin"])
async def get_digital_twin_building(
    building_id: int,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a single building with rooms and facilities."""
    result = await db.execute(select(Building).where(Building.id == building_id))
    building = result.scalar_one_or_none()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    rooms_result = await db.execute(select(Room).where(Room.building_id == building_id))
    rooms = rooms_result.scalars().all()

    return {
        "id": building.id,
        "name": building.name,
        "code": building.code,
        "latitude": building.latitude,
        "longitude": building.longitude,
        "num_floors": building.num_floors,
        "is_accessible": building.is_accessible,
        "rooms": [
            {
                "id": r.id,
                "room_number": r.room_number,
                "name": r.name,
                "capacity": r.capacity,
                "room_type": r.room_type,
                "status": r.status,
            }
            for r in rooms
        ],
    }


@router.get("/rooms/{room_id}", tags=["digital-twin"])
async def get_digital_twin_room(
    room_id: int,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a room with its current state."""
    result = await db.execute(select(Room).where(Room.id == room_id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    return {
        "id": room.id,
        "building_id": room.building_id,
        "room_number": room.room_number,
        "name": room.name,
        "capacity": room.capacity,
        "room_type": room.room_type,
        "status": room.status,
        "features": room.features,
        "is_accessible": room.is_accessible,
    }


@router.get("/navigation", tags=["digital-twin"])
async def get_navigation_route(
    from_location: str = Query(...),
    to_location: str = Query(...),
    mode: str = Query("walking"),
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a navigation route between two campus locations."""
    from_result = await db.execute(
        select(CampusLocation).where(CampusLocation.name.ilike(f"%{from_location}%"))
    )
    from_loc = from_result.scalar_one_or_none()

    to_result = await db.execute(
        select(CampusLocation).where(CampusLocation.name.ilike(f"%{to_location}%"))
    )
    to_loc = to_result.scalar_one_or_none()

    if not from_loc or not to_loc:
        raise HTTPException(status_code=404, detail="Location not found")

    return {
        "from": {
            "id": from_loc.id,
            "name": from_loc.name,
            "latitude": from_loc.latitude,
            "longitude": from_loc.longitude,
        },
        "to": {
            "id": to_loc.id,
            "name": to_loc.name,
            "latitude": to_loc.latitude,
            "longitude": to_loc.longitude,
        },
        "mode": mode,
        "estimated_time_minutes": 10,
        "distance_meters": 500,
        "route": [
            {"lat": from_loc.latitude, "lng": from_loc.longitude},
            {"lat": to_loc.latitude, "lng": to_loc.longitude},
        ],
    }


@router.get("/campus-summary", tags=["digital-twin"])
async def get_campus_summary(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a summary of campus state for dashboards."""
    try:
        # Count buildings
        buildings_count = (await db.execute(select(Building))).scalars().all()
        building_count = len(buildings_count)

        # Count rooms
        rooms_count = (await db.execute(select(Room))).scalars().all()
        room_count = len(rooms_count)

        # Count active issues
        active_issues = (await db.execute(
            select(Issue).where(Issue.status.in_(["open", "in_progress"]))
        )).scalars().all()
        issue_count = len(active_issues)

        # Count active events
        active_events = (await db.execute(
            select(EventModel).where(EventModel.status.in_(["upcoming", "ongoing"]))
        )).scalars().all()
        event_count = len(active_events)

        return {
            "buildings_total": building_count,
            "rooms_total": room_count,
            "active_issues": issue_count,
            "active_events": event_count,
            "campus_status": "operational" if issue_count == 0 else "degraded",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to load campus summary: {str(exc)}")
