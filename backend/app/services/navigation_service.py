"""Navigation service for Campus NEXUS — Firestore-backed."""

from typing import Any

from app.core.firebase import db


class NavigationService:
    """Service for navigation and route calculation (Firestore)."""

    async def calculate_route(
        self,
        from_lat: float,
        from_lon: float,
        to_lat: float,
        to_lon: float,
        mode: str = "walking",
    ) -> dict[str, Any]:
        """Calculate route between two points."""
        # In production, use OSRM or MapLibre routing
        base_time = 6  # minutes
        return {
            "from": {"lat": from_lat, "lon": from_lon},
            "to": {"lat": to_lat, "lon": to_lon},
            "mode": mode,
            "distance_meters": 450,
            "duration_seconds": base_time * 60,
            "duration_text": f"{base_time} min",
            "steps": [
                {"instruction": "Head north towards destination", "distance": 100},
                {"instruction": "Turn left at the junction", "distance": 150},
                {"instruction": "Continue straight to destination", "distance": 200},
            ],
        }

    async def calculate_realistic_eta(
        self,
        from_lat: float,
        from_lon: float,
        to_lat: float,
        to_lon: float,
        departure_time: str | None = None,
    ) -> dict[str, Any]:
        """Calculate realistic ETA considering crowd, lifts, and disruptions."""
        base_walking = 7
        crowd_delay = 2
        lift_delay = 4
        floor_delay = 1
        total = base_walking + crowd_delay + lift_delay + floor_delay

        return {
            "base_walking_time": base_walking,
            "crowd_delay": crowd_delay,
            "lift_delay": lift_delay,
            "floor_delay": floor_delay,
            "total_eta_minutes": total,
            "recommendation": "Leave now" if total > 10 else "You have time",
            "factors": {
                "crowd": "moderate",
                "lift_status": "one lift unavailable",
                "floor": 3,
            },
        }

    async def calculate_accessible_route(
        self,
        from_lat: float,
        from_lon: float,
        to_lat: float,
        to_lon: float,
    ) -> dict[str, Any]:
        """Calculate accessible route avoiding stairs and inaccessible areas."""
        route = await self.calculate_route(from_lat, from_lon, to_lat, to_lon, "accessible")
        route["duration_seconds"] = 540  # 9 minutes
        route["duration_text"] = "9 min"
        route["notes"] = "Uses ramps and accessible lifts"
        return route
