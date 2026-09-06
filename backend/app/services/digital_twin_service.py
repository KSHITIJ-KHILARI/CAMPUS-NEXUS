"""Digital Twin service for Campus NEXUS."""

from datetime import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import (
    Building,
    Room,
    CampusLocation,
    Issue,
    Lift,
    Facility,
    CampusState,
)
from app.models.crowd_state import CrowdState
from app.models.event import Event as EventModel
from app.models.presence import PresenceConsent
from app.services.location_service import LocationService


class DigitalTwinService:
    """Service for managing the Digital Twin state."""

    async def get_campus_state(self, db: AsyncSession) -> dict[str, Any]:
        """Get the current campus state from the database."""
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

            return {
                "buildings": buildings_data,
                "rooms": rooms_data,
                "campus_locations": locations_data,
                "issues": issues_data,
                "lifts": lifts_data,
                "crowd": crowd_data,
                "events": events_data,
                "presence": presence_summary,
                "last_updated": datetime.utcnow().isoformat(),
            }
        except Exception as exc:
            raise RuntimeError(f"Failed to load digital twin state: {str(exc)}") from exc

    async def _get_buildings_state(self) -> dict[str, Any]:
        """Get buildings state (deprecated, use get_campus_state)."""
        return {}

    async def _get_rooms_state(self) -> dict[str, Any]:
        """Get rooms state (deprecated, use get_campus_state)."""
        return {}

    async def _get_crowd_state(self) -> dict[str, Any]:
        """Get crowd state (deprecated, use get_campus_state)."""
        return {}

    async def _get_issues_state(self) -> dict[str, Any]:
        """Get issues state (deprecated, use get_campus_state)."""
        return []

    async def _get_lifts_state(self) -> dict[str, Any]:
        """Get lift states (deprecated, use get_campus_state)."""
        return {}

    async def _get_events_state(self) -> dict[str, Any]:
        """Get events state (deprecated, use get_campus_state)."""
        return []

    async def update_building_status(self, building_id: str, status: str) -> None:
        """Update building operational status."""
        pass

    async def update_lift_status(self, lift_id: str, status: str) -> None:
        """Update lift status."""
        pass

    async def broadcast_state_update(self, entity_type: str, entity_id: str, data: dict[str, Any]) -> None:
        """Broadcast state update to connected clients."""
        from app.core.redis_client import redis_client
        import json
        await redis_client.publish(
            f"campus_state:{entity_type}",
            json.dumps({"entity_id": entity_id, "data": data}),
        )
