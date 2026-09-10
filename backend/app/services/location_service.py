"""Location service for Campus NEXUS — Firestore-backed GPS geofencing and rush calculation.

This service performs:
1. Geofence matching — given a GPS coordinate, determine the nearest
   campus location (or ``None`` if outside all geofences).
2. Rush calculation — aggregate active user GPS locations into per-location
   presence counts and rush levels.
3. Override resolution — combine GPS-derived rush with any active Admin
   override, returning the authoritative displayed state along with a
   transparent source label.
"""

import math
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from cachetools import TTLCache

from app.core.firebase import db


EARTH_RADIUS_M = 6_371_000
# Cache campus locations for 10 minutes to avoid repeated Firestore queries
_locations_cache = TTLCache(maxsize=1, ttl=600)

def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in metres between two coordinates."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_M * c


def _rush_level(count: int, capacity: Optional[int]) -> str:
    """Map a count/capacity ratio to a rush level label."""
    if capacity and capacity > 0:
        ratio = count / capacity
    else:
        ratio = min(count / 50.0, 1.0)
    if ratio < 0.3:
        return "LOW"
    if ratio < 0.6:
        return "MODERATE"
    if ratio < 0.85:
        return "HIGH"
    return "VERY_HIGH"


def _confidence(count: int, capacity: Optional[int]) -> float:
    """Compute a 0–1 confidence score for a rush estimate."""
    base = min(count / 20.0, 1.0) if count else 0.0
    return round(0.5 + base * 0.5, 2)


class LocationService:
    """Service for real-time GPS geofencing and rush intelligence (Firestore)."""

    STALE_THRESHOLD_MINUTES = 5

    @staticmethod
    async def _get_campus_locations() -> list[dict[str, Any]]:
        """Fetch and cache campus locations."""
        if db is None:
            return []
        
        if "all" in _locations_cache:
            return _locations_cache["all"]

        def fetch():
            return list(db.collection("campus_locations").stream())
        
        docs = await asyncio.to_thread(fetch)
        locations = []
        for doc in docs:
            loc = doc.to_dict()
            loc["_doc_id"] = doc.id
            locations.append(loc)
            
        _locations_cache["all"] = locations
        return locations

    @staticmethod
    async def match_location(lat: float, lng: float) -> Optional[dict[str, Any]]:
        """Return the nearest campus location if the coordinate falls inside its geofence."""
        locations = await LocationService._get_campus_locations()
        best: Optional[dict[str, Any]] = None
        best_dist = float("inf")
        for loc in locations:
            loc_lat = loc.get("latitude")
            loc_lng = loc.get("longitude")
            if loc_lat is None or loc_lng is None:
                continue
            radius = loc.get("geofence_radius_meters", 80.0)
            dist = _haversine(lat, lng, loc_lat, loc_lng)
            if dist <= radius and dist < best_dist:
                best_dist = dist
                best = {
                    "id": loc.get("_doc_id", ""),
                    "name": loc.get("name", ""),
                    "location_type": str(loc.get("location_type", "")),
                    "latitude": loc_lat,
                    "longitude": loc_lng,
                    "geofence_radius_meters": radius,
                    "distance_meters": round(dist, 1),
                    "capacity": loc.get("capacity"),
                    "operational_status": loc.get("operational_status", "operational"),
                }
        return best

    @staticmethod
    async def update_user_location(
        user_id: Any,
        latitude: float,
        longitude: float,
        accuracy: Optional[float] = None,
        timestamp: Optional[datetime] = None,
    ) -> Optional[dict[str, Any]]:
        """Upsert the user's real GPS location and attempt geofence matching."""
        if db is None:
            return None
        now = timestamp or datetime.now(timezone.utc)
        if timestamp is None:
            timestamp = now

        matched = await LocationService.match_location(latitude, longitude)
        matched_loc_id = matched["id"] if matched else None
        matched_loc_name = matched["name"] if matched else None

        def update_doc():
            doc_ref = db.collection("user_location_states").document(str(user_id))
            doc_ref.set({
                "user_id": str(user_id),
                "latitude": latitude,
                "longitude": longitude,
                "accuracy": accuracy,
                "timestamp": timestamp.isoformat(),
                "tracking_enabled": True,
                "location_status": "LIVE",
                "last_updated": now.isoformat(),
                "location_id": matched_loc_id,
                "location_name": matched_loc_name,
            }, merge=True)
            
        await asyncio.to_thread(update_doc)

        return {
            "user_id": str(user_id),
            "latitude": latitude,
            "longitude": longitude,
            "accuracy": accuracy,
            "timestamp": timestamp.isoformat() if timestamp else None,
            "tracking_enabled": True,
            "location_status": "LIVE",
            "matched_location": matched,
        }

    @staticmethod
    async def disable_user_location(user_id: Any) -> None:
        """Mark a user's location tracking as disabled and clear coordinates."""
        if db is None:
            return
            
        def disable_doc():
            doc_ref = db.collection("user_location_states").document(str(user_id))
            doc_ref.set({
                "tracking_enabled": False,
                "location_status": "OFF",
                "latitude": None,
                "longitude": None,
                "location_id": None,
                "location_name": None,
                "last_updated": datetime.now(timezone.utc).isoformat(),
            }, merge=True)
            
        await asyncio.to_thread(disable_doc)

    @staticmethod
    async def get_rush_state() -> list[dict[str, Any]]:
        """Compute current rush state from real GPS locations, respecting admin overrides."""
        if db is None:
            return []

        # Fetch all campus locations
        locations = await LocationService._get_campus_locations()
        location_map: dict[str, dict] = {loc["_doc_id"]: loc for loc in locations}
        gps_total_users: dict[str, int] = {loc["_doc_id"]: 0 for loc in locations}

        def fetch_states_and_overrides():
            user_states = list(db.collection("user_location_states")
                .where("tracking_enabled", "==", True)
                .stream())
            overrides = list(db.collection("admin_rush_overrides")
                .where("is_active", "==", True)
                .stream())
            return user_states, overrides
            
        user_states_docs, overrides_docs = await asyncio.to_thread(fetch_states_and_overrides)

        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(minutes=LocationService.STALE_THRESHOLD_MINUTES)

        for doc in user_states_docs:
            us = doc.to_dict()
            lat = us.get("latitude")
            lng = us.get("longitude")
            if lat is None or lng is None:
                continue
            ts_str = us.get("timestamp")
            if ts_str:
                try:
                    ts = datetime.fromisoformat(ts_str)
                    if ts.tzinfo is None:
                        ts = ts.replace(tzinfo=timezone.utc)
                    if ts < cutoff:
                        continue
                except (ValueError, TypeError):
                    pass

            loc_id = us.get("location_id")
            if loc_id is not None and loc_id in location_map:
                gps_total_users[loc_id] = gps_total_users.get(loc_id, 0) + 1
            else:
                matched = LocationService._sync_match_location(locations, lat, lng)
                if matched:
                    gps_total_users[matched["id"]] = gps_total_users.get(matched["id"], 0) + 1

        overrides = [doc.to_dict() | {"_doc_id": doc.id} for doc in overrides_docs]

        result = []
        for loc in locations:
            loc_id = loc["_doc_id"]
            count = gps_total_users.get(loc_id, 0)
            capacity = loc.get("capacity")
            level = _rush_level(count, capacity)
            conf = _confidence(count, capacity)

            override = None
            for ov in overrides:
                if ov.get("location_id") == loc_id:
                    expires_str = ov.get("expires_at", "")
                    try:
                        expires_at = datetime.fromisoformat(expires_str)
                        if expires_at.tzinfo is None:
                            expires_at = expires_at.replace(tzinfo=timezone.utc)
                        if expires_at > now:
                            override = ov
                    except (ValueError, TypeError):
                        pass
                    break

            if override:
                result.append({
                    "location_id": loc_id,
                    "location_name": loc.get("name", ""),
                    "current_count": override.get("people_count", 0),
                    "capacity": capacity,
                    "rush_level": override.get("rush_level", "LOW"),
                    "confidence": 1.0,
                    "source": "ADMIN_OVERRIDE",
                    "override_reason": override.get("reason"),
                    "expires_at": override.get("expires_at"),
                    "last_updated": now.isoformat(),
                })
            else:
                result.append({
                    "location_id": loc_id,
                    "location_name": loc.get("name", ""),
                    "current_count": count,
                    "capacity": capacity,
                    "rush_level": level,
                    "confidence": conf,
                    "source": "GPS",
                    "last_updated": now.isoformat(),
                })

        return result

    @staticmethod
    async def get_active_override(location_id: str) -> Optional[dict[str, Any]]:
        """Return an active admin override for a location, or None."""
        if db is None:
            return None
            
        def fetch_overrides():
            return list(db.collection("admin_rush_overrides")
                .where("location_id", "==", location_id)
                .where("is_active", "==", True)
                .stream())
                
        overrides_docs = await asyncio.to_thread(fetch_overrides)
        now = datetime.now(timezone.utc)
        for doc in overrides_docs:
            ov = doc.to_dict()
            try:
                expires_at = datetime.fromisoformat(ov.get("expires_at", ""))
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                if expires_at > now:
                    return ov
            except (ValueError, TypeError):
                pass
        return None

    @staticmethod
    async def create_override(
        location_id: str,
        admin_user_id: Any,
        people_count: int,
        rush_level: str,
        reason: Optional[str],
        duration_minutes: int,
    ) -> dict[str, Any]:
        """Create or replace an admin override for a location."""
        if db is None:
            return {}
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=duration_minutes)

        def update_firestore():
            # Deactivate existing overrides for this location
            existing_ref = (
                db.collection("admin_rush_overrides")
                .where("location_id", "==", location_id)
                .where("is_active", "==", True)
                .stream()
            )
            for doc in existing_ref:
                doc.reference.update({"is_active": False})

            # Create new override
            override_data = {
                "location_id": location_id,
                "admin_user_id": str(admin_user_id),
                "people_count": people_count,
                "rush_level": rush_level,
                "reason": reason,
                "duration_minutes": duration_minutes,
                "expires_at": expires_at.isoformat(),
                "is_active": True,
                "created_at": now.isoformat(),
            }
            db.collection("admin_rush_overrides").add(override_data)
            return override_data
            
        return await asyncio.to_thread(update_firestore)

    @staticmethod
    async def expire_stale_overrides() -> int:
        """Mark expired overrides as inactive. Returns count of deactivated overrides."""
        if db is None:
            return 0
        now = datetime.now(timezone.utc)
        
        def update_expired():
            overrides_ref = (
                db.collection("admin_rush_overrides")
                .where("is_active", "==", True)
                .stream()
            )
            count = 0
            for doc in overrides_ref:
                ov = doc.to_dict()
                try:
                    expires_at = datetime.fromisoformat(ov.get("expires_at", ""))
                    if expires_at.tzinfo is None:
                        expires_at = expires_at.replace(tzinfo=timezone.utc)
                    if expires_at <= now:
                        doc.reference.update({"is_active": False})
                        count += 1
                except (ValueError, TypeError):
                    pass
            return count
            
        return await asyncio.to_thread(update_expired)

    @staticmethod
    def _sync_match_location(locations: list[dict], lat: float, lng: float) -> Optional[dict[str, Any]]:
        """Synchronous geofence match used internally during rush calculation."""
        best = None
        best_dist = float("inf")
        for loc in locations:
            loc_lat = loc.get("latitude")
            loc_lng = loc.get("longitude")
            if loc_lat is None or loc_lng is None:
                continue
            radius = loc.get("geofence_radius_meters", 80.0)
            dist = _haversine(lat, lng, loc_lat, loc_lng)
            if dist <= radius and dist < best_dist:
                best_dist = dist
                best = {"id": loc.get("_doc_id", ""), "name": loc.get("name", "")}
        return best
