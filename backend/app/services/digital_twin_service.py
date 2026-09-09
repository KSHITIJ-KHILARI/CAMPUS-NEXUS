"""Digital Twin service for Campus NEXUS — Firestore-backed."""

from datetime import datetime, timezone
from typing import Any

from firebase_admin import firestore as firestore_module
from app.core.firebase import db
from app.services.location_service import LocationService


class DigitalTwinService:
    """Service for managing the Digital Twin state (Firestore)."""

    async def get_campus_state(self) -> dict[str, Any]:
        """Get the current campus state from Firestore."""
        if db is None:
            return {"error": "Firestore not initialized"}

        try:
            # Fetch buildings
            buildings_ref = db.collection("buildings").stream()
            buildings_data = []
            for doc in buildings_ref:
                b = doc.to_dict()
                buildings_data.append({
                    "id": doc.id,
                    "name": b.get("name", ""),
                    "code": b.get("code", ""),
                    "latitude": b.get("latitude"),
                    "longitude": b.get("longitude"),
                    "num_floors": b.get("num_floors"),
                    "is_accessible": b.get("is_accessible", True),
                    "status": b.get("status", "operational"),
                })

            # Fetch rooms
            rooms_ref = db.collection("rooms").stream()
            rooms_data = []
            for doc in rooms_ref:
                r = doc.to_dict()
                rooms_data.append({
                    "id": doc.id,
                    "building_id": r.get("building_id"),
                    "room_number": r.get("room_number", ""),
                    "name": r.get("name", ""),
                    "capacity": r.get("capacity"),
                    "room_type": r.get("room_type", ""),
                    "status": r.get("status", "available"),
                    "is_accessible": r.get("is_accessible", True),
                })

            # Fetch campus locations
            locations_ref = db.collection("campus_locations").stream()
            locations_data = []
            for doc in locations_ref:
                loc = doc.to_dict()
                locations_data.append({
                    "id": doc.id,
                    "name": loc.get("name", ""),
                    "location_type": loc.get("location_type", ""),
                    "building_id": loc.get("building_id"),
                    "latitude": loc.get("latitude"),
                    "longitude": loc.get("longitude"),
                    "capacity": loc.get("capacity"),
                    "status": loc.get("status", "operational"),
                })

            # Fetch active issues
            issues_ref = db.collection("issues").where("status", "in", ["open", "in_progress"]).stream()
            issues_data = []
            for doc in issues_ref:
                iss = doc.to_dict()
                issues_data.append({
                    "id": doc.id,
                    "title": iss.get("title", ""),
                    "category": iss.get("category", ""),
                    "priority": iss.get("priority", "medium"),
                    "status": iss.get("status", "open"),
                    "location_id": iss.get("location_id"),
                })

            # Fetch lifts
            lifts_ref = db.collection("lifts").stream()
            lifts_data = []
            for doc in lifts_ref:
                lift = doc.to_dict()
                lifts_data.append({
                    "id": doc.id,
                    "building_id": lift.get("building_id"),
                    "lift_number": lift.get("lift_number", ""),
                    "status": lift.get("status", "operational"),
                    "current_floor": lift.get("current_floor"),
                    "direction": lift.get("direction"),
                    "capacity": lift.get("capacity"),
                })

            # Fetch crowd states with real-time GPS rush intelligence
            crowd_data = {}
            try:
                rush_states = await LocationService.get_rush_state()
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
                # Fallback: read crowd_states collection
                crowd_ref = db.collection("crowd_states").stream()
                for doc in crowd_ref:
                    cs = doc.to_dict()
                    crowd_data[f"location_{cs.get('location_id', doc.id)}"] = {
                        "density_level": cs.get("density_level", "low"),
                        "current_count": cs.get("current_count", 0),
                        "capacity": cs.get("capacity"),
                        "occupancy_ratio": cs.get("occupancy_ratio", 0.0),
                        "is_alert": cs.get("is_alert", False),
                    }

            # Fetch active events
            events_ref = db.collection("events").where("status", "in", ["upcoming", "ongoing"]).stream()
            events_data = []
            for doc in events_ref:
                evt = doc.to_dict()
                events_data.append({
                    "id": doc.id,
                    "title": evt.get("title", ""),
                    "event_type": evt.get("event_type", ""),
                    "location_id": evt.get("location_id"),
                    "start_time": evt.get("start_time"),
                    "end_time": evt.get("end_time"),
                    "status": evt.get("status", "upcoming"),
                    "max_participants": evt.get("max_participants"),
                    "registrations": evt.get("registrations", 0),
                })

            # Fetch presence counts
            presence_ref = db.collection("presence_consent").where("is_enabled", "==", True).stream()
            active_count = 0
            zones: dict[str, int] = {}
            for doc in presence_ref:
                p = doc.to_dict()
                active_count += 1
                zone = p.get("current_zone")
                if zone:
                    zones[zone] = zones.get(zone, 0) + 1

            presence_summary = {
                "active_users": active_count,
                "zones": zones,
            }

            return {
                "buildings": buildings_data,
                "rooms": rooms_data,
                "campus_locations": locations_data,
                "issues": issues_data,
                "lifts": lifts_data,
                "crowd": crowd_data,
                "events": events_data,
                "presence": presence_summary,
                "last_updated": datetime.now(timezone.utc).isoformat(),
            }
        except Exception as exc:
            raise RuntimeError(f"Failed to load digital twin state: {str(exc)}") from exc

    async def update_building_status(self, building_id: str, status: str) -> None:
        """Update building operational status in Firestore."""
        if db is None:
            return
        db.collection("buildings").document(building_id).update({"status": status})

    async def update_lift_status(self, lift_id: str, status: str) -> None:
        """Update lift status in Firestore."""
        if db is None:
            return
        db.collection("lifts").document(lift_id).update({"status": status})

    async def broadcast_state_update(self, entity_type: str, entity_id: str, data: dict[str, Any]) -> None:
        """Broadcast state update via Firestore document write."""
        if db is None:
            return
        doc_ref = db.collection("state_updates").document(f"{entity_type}_{entity_id}")
        doc_ref.set({"data": data, "timestamp": firestore_module.SERVER_TIMESTAMP})
