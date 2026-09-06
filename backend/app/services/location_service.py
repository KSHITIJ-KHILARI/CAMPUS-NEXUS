"""Location service for Campus NEXUS real-time GPS geofencing and rush calculation.

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
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.campus_location import CampusLocation
from app.models.user_location import UserLocationState
from app.models.admin_rush_override import AdminRushOverride


EARTH_RADIUS_M = 6_371_000


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
    """Service for real-time GPS geofencing and rush intelligence."""

    STALE_THRESHOLD_MINUTES = 5

    @staticmethod
    async def match_location(db: AsyncSession, lat: float, lng: float) -> Optional[dict[str, Any]]:
        """Return the nearest campus location if the coordinate falls inside its geofence."""
        result = await db.execute(select(CampusLocation))
        locations = result.scalars().all()
        best: Optional[dict[str, Any]] = None
        best_dist = float("inf")
        for loc in locations:
            radius = loc.geofence_radius_meters or 80.0
            dist = _haversine(lat, lng, loc.latitude, loc.longitude)
            if dist <= radius and dist < best_dist:
                best_dist = dist
                best = {
                    "id": loc.id,
                    "name": loc.name,
                    "location_type": str(loc.location_type),
                    "latitude": loc.latitude,
                    "longitude": loc.longitude,
                    "geofence_radius_meters": radius,
                    "distance_meters": round(dist, 1),
                    "capacity": loc.capacity,
                    "operational_status": loc.operational_status or "operational",
                }
        return best

    @staticmethod
    async def update_user_location(
        db: AsyncSession,
        user_id: Any,
        latitude: float,
        longitude: float,
        accuracy: Optional[float] = None,
        timestamp: Optional[datetime] = None,
    ) -> Optional[dict[str, Any]]:
        """Upsert the user's real GPS location and attempt geofence matching.

        Also stores the matched ``location_id`` and ``location_name`` directly
        on the :class:`UserLocationState` record so that rush aggregation
        queries can use an indexed lookup instead of re-running geofence
        matching for every user.
        """
        now = timestamp or datetime.now(timezone.utc)
        if timestamp is None:
            timestamp = now

        result = await db.execute(
            select(UserLocationState).where(UserLocationState.user_id == user_id)
        )
        state = result.scalar_one_or_none()

        # Geofence match first so we can store it on the state record
        matched = await LocationService.match_location(db, latitude, longitude)
        matched_loc_id = matched["id"] if matched else None
        matched_loc_name = matched["name"] if matched else None

        if state:
            state.latitude = latitude
            state.longitude = longitude
            state.accuracy = accuracy
            state.timestamp = timestamp
            state.tracking_enabled = True
            state.location_status = "LIVE"
            state.last_updated = now
            state.location_id = matched_loc_id
            state.location_name = matched_loc_name
        else:
            state = UserLocationState(
                user_id=user_id,
                latitude=latitude,
                longitude=longitude,
                accuracy=accuracy,
                timestamp=timestamp,
                tracking_enabled=True,
                location_status="LIVE",
                last_updated=now,
                location_id=matched_loc_id,
                location_name=matched_loc_name,
            )
            db.add(state)

        await db.commit()
        await db.refresh(state)

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
    async def disable_user_location(db: AsyncSession, user_id: Any) -> None:
        """Mark a user's location tracking as disabled and clear coordinates."""
        result = await db.execute(
            select(UserLocationState).where(UserLocationState.user_id == user_id)
        )
        state = result.scalar_one_or_none()
        if state:
            state.tracking_enabled = False
            state.location_status = "OFF"
            state.latitude = None
            state.longitude = None
            state.location_id = None
            state.location_name = None
            state.last_updated = datetime.now(timezone.utc)
            await db.commit()

    @staticmethod
    async def get_rush_state(db: AsyncSession) -> list[dict[str, Any]]:
        """Compute current rush state from real GPS locations, respecting admin overrides.

        Uses the stored ``location_id`` on :class:`UserLocationState` when
        available (set by :meth:`update_user_location`), falling back to
        geofence re-matching for legacy records that lack it.
        """
        locations_result = await db.execute(select(CampusLocation))
        locations = locations_result.scalars().all()

        location_map: dict[int, CampusLocation] = {loc.id: loc for loc in locations}
        gps_total_users: dict[int, int] = {loc.id: 0 for loc in locations}

        result = await db.execute(
            select(UserLocationState).where(UserLocationState.tracking_enabled == True)
        )
        user_states = result.scalars().all()

        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(minutes=LocationService.STALE_THRESHOLD_MINUTES)

        for us in user_states:
            if us.latitude is None or us.longitude is None:
                continue
            if us.timestamp:
                ts = us.timestamp
                if ts.tzinfo is None:
                    ts = ts.replace(tzinfo=timezone.utc)
                if ts < cutoff:
                    continue

            # Fast path: use pre-computed location_id if available
            if us.location_id is not None and us.location_id in location_map:
                gps_total_users[us.location_id] = gps_total_users.get(us.location_id, 0) + 1
            else:
                # Fallback: geofence match for legacy records
                matched = LocationService._sync_match_location(
                    location_map.values(), us.latitude, us.longitude
                )
                if matched:
                    gps_total_users[matched["id"]] = gps_total_users.get(matched["id"], 0) + 1

        result = await db.execute(
            select(AdminRushOverride).where(AdminRushOverride.is_active == True)
        )
        overrides = result.scalars().all()

        rush_by_location: dict[int, dict[str, Any]] = {}
        for loc in locations:
            count = gps_total_users.get(loc.id, 0)
            capacity = loc.capacity
            level = _rush_level(count, capacity)
            conf = _confidence(count, capacity)

            override = None
            for ov in overrides:
                if ov.location_id == loc.id:
                    if ov.expires_at > now:
                        override = ov
                    break

            if override:
                rush_by_location[loc.id] = {
                    "location_id": loc.id,
                    "location_name": loc.name,
                    "current_count": override.people_count,
                    "capacity": capacity,
                    "rush_level": override.rush_level,
                    "confidence": 1.0,
                    "source": "ADMIN_OVERRIDE",
                    "override_reason": override.reason,
                    "expires_at": override.expires_at.isoformat(),
                    "last_updated": now.isoformat(),
                }
            else:
                rush_by_location[loc.id] = {
                    "location_id": loc.id,
                    "location_name": loc.name,
                    "current_count": count,
                    "capacity": capacity,
                    "rush_level": level,
                    "confidence": conf,
                    "source": "GPS",
                    "last_updated": now.isoformat(),
                }

        return [rush_by_location[loc.id] for loc in locations if loc.id in rush_by_location]

    @staticmethod
    async def get_active_override(db: AsyncSession, location_id: int) -> Optional[AdminRushOverride]:
        """Return an active admin override for a location, or None."""
        result = await db.execute(
            select(AdminRushOverride)
            .where(AdminRushOverride.location_id == location_id)
            .where(AdminRushOverride.is_active == True)
        )
        ov = result.scalar_one_or_none()
        if ov and ov.expires_at <= datetime.now(timezone.utc):
            return None
        return ov

    @staticmethod
    async def create_override(
        db: AsyncSession,
        location_id: int,
        admin_user_id: Any,
        people_count: int,
        rush_level: str,
        reason: Optional[str],
        duration_minutes: int,
    ) -> AdminRushOverride:
        """Create or replace an admin override for a location."""
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=duration_minutes)

        result = await db.execute(
            select(AdminRushOverride)
            .where(AdminRushOverride.location_id == location_id)
            .where(AdminRushOverride.is_active == True)
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.is_active = False
            db.add(existing)

        override = AdminRushOverride(
            location_id=location_id,
            admin_user_id=admin_user_id,
            people_count=people_count,
            rush_level=rush_level,
            reason=reason,
            duration_minutes=duration_minutes,
            expires_at=expires_at,
            is_active=True,
        )
        db.add(override)
        await db.commit()
        await db.refresh(override)
        return override

    @staticmethod
    async def expire_stale_overrides(db: AsyncSession) -> int:
        """Mark expired overrides as inactive. Returns count of deactivated overrides."""
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(AdminRushOverride).where(
                AdminRushOverride.is_active == True,
                AdminRushOverride.expires_at <= now,
            )
        )
        stale = result.scalars().all()
        for ov in stale:
            ov.is_active = False
            db.add(ov)
        await db.commit()
        return len(stale)

    @staticmethod
    def _sync_match_location(locations, lat: float, lng: float) -> Optional[dict[str, Any]]:
        """Synchronous geofence match used internally during rush calculation."""
        best = None
        best_dist = float("inf")
        for loc in locations:
            radius = loc.geofence_radius_meters or 80.0
            dist = _haversine(lat, lng, loc.latitude, loc.longitude)
            if dist <= radius and dist < best_dist:
                best_dist = dist
                best = {"id": loc.id, "name": loc.name}
        return best
