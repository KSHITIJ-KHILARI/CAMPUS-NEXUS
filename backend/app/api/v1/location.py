"""Location API v1 routes for Campus NEXUS — real GPS tracking & rush intelligence."""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_db, get_current_active_user, require_admin
from app.models import User, CampusLocation
from app.models.user_location import UserLocationState
from app.models.admin_rush_override import AdminRushOverride
from app.schemas.location import (
    LocationUpdate,
    LocationStatusResponse,
    CampusLocationSchema,
    RushStateItem,
    OverrideCreate,
    OverrideResponse,
)
from app.services.location_service import LocationService

router = APIRouter()


@router.get("/locations", response_model=list[CampusLocationSchema])
async def get_campus_locations(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all campus locations with geofence metadata."""
    result = await db.execute(select(CampusLocation))
    locations = result.scalars().all()
    return locations


@router.post("/update", response_model=LocationStatusResponse)
async def submit_location_update(
    payload: LocationUpdate,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Submit real GPS coordinates from the browser Geolocation API.

    Only accepted when the user has an active PresenceConsent and
    LocationTrackingControl enabled.  No fake coordinates are ever
    fabricated server-side.
    """
    ts = None
    if payload.timestamp:
        try:
            ts = datetime.fromisoformat(payload.timestamp.replace("Z", "+00:00"))
        except ValueError:
            ts = None

    loc_result = await LocationService.update_user_location(
        db,
        current_user.id,
        payload.latitude,
        payload.longitude,
        payload.accuracy,
        ts,
    )

    result = await db.execute(
        select(UserLocationState).where(UserLocationState.user_id == current_user.id)
    )
    updated_state = result.scalar_one_or_none()

    matched = loc_result.get("matched_location") if loc_result else None

    return LocationStatusResponse(
        user_id=str(current_user.id),
        tracking_enabled=True,
        location_status="LIVE",
        latitude=payload.latitude,
        longitude=payload.longitude,
        accuracy=payload.accuracy,
        timestamp=ts.isoformat() if ts else None,
        matched_location=matched,
    )


@router.get("/status", response_model=LocationStatusResponse)
async def get_location_status(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get the current user's real location tracking status."""
    result = await db.execute(
        select(UserLocationState).where(UserLocationState.user_id == current_user.id)
    )
    state = result.scalar_one_or_none()

    if not state:
        return LocationStatusResponse(
            user_id=str(current_user.id),
            tracking_enabled=False,
            location_status="OFF",
        )

    matched = None
    if state.latitude is not None and state.longitude is not None:
        matched = await LocationService.match_location(
            db, state.latitude, state.longitude
        )

    return LocationStatusResponse(
        user_id=str(current_user.id),
        tracking_enabled=state.tracking_enabled,
        location_status=state.location_status,
        latitude=state.latitude,
        longitude=state.longitude,
        accuracy=state.accuracy,
        timestamp=state.timestamp.isoformat() if state.timestamp else None,
        matched_location=matched,
    )


@router.post("/disable")
async def disable_location_tracking(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Disable location tracking and clear the user's GPS coordinates."""
    await LocationService.disable_user_location(db, current_user.id)
    return {"status": "success", "message": "Location tracking disabled. All GPS coordinates cleared."}


@router.get("/rush", response_model=list[RushStateItem])
async def get_campus_rush(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get aggregated campus rush state from real GPS locations and admin overrides."""
    await LocationService.expire_stale_overrides(db)
    rush = await LocationService.get_rush_state(db)
    return rush


@router.get("/rush/{location_id}", response_model=RushStateItem)
async def get_location_rush(
    location_id: int,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get the rush state for a single campus location."""
    rush_list = await LocationService.get_rush_state(db)
    for item in rush_list:
        if item["location_id"] == location_id:
            return item
    raise HTTPException(status_code=404, detail="Location not found or no rush data")


@router.get("/admin/overrides", response_model=list[OverrideResponse])
async def get_admin_overrides(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(require_admin),
):
    """List all admin rush overrides (active and expired)."""
    await LocationService.expire_stale_overrides(db)
    result = await db.execute(select(AdminRushOverride))
    overrides = result.scalars().all()
    return overrides


@router.post("/admin/override", response_model=OverrideResponse)
async def create_admin_override(
    payload: OverrideCreate,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(require_admin),
):
    """Create or replace an admin rush override for a campus location."""
    loc_result = await db.execute(
        select(CampusLocation).where(CampusLocation.id == payload.location_id)
    )
    loc = loc_result.scalar_one_or_none()
    if not loc:
        raise HTTPException(status_code=404, detail="Campus location not found")

    invalid_levels = {"LOW", "MODERATE", "HIGH", "VERY_HIGH"}
    if payload.rush_level not in invalid_levels:
        raise HTTPException(
            status_code=400,
            detail=f"rush_level must be one of: {', '.join(sorted(invalid_levels))}",
        )

    override = await LocationService.create_override(
        db=db,
        location_id=payload.location_id,
        admin_user_id=current_user.id,
        people_count=payload.people_count,
        rush_level=payload.rush_level,
        reason=payload.reason,
        duration_minutes=payload.duration_minutes,
    )

    return OverrideResponse(
        id=override.id,
        location_id=override.location_id,
        people_count=override.people_count,
        rush_level=override.rush_level,
        is_active=override.is_active,
        reason=override.reason,
        duration_minutes=override.duration_minutes,
        expires_at=override.expires_at,
        created_at=override.created_at,
    )


@router.delete("/admin/override/{override_id}")
async def delete_admin_override(
    override_id: str,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(require_admin),
):
    """Remove an active admin rush override."""
    import uuid as uuid_mod
    try:
        override_uuid = uuid_mod.UUID(override_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Override not found")

    result = await db.execute(
        select(AdminRushOverride).where(AdminRushOverride.id == override_uuid)
    )
    override = result.scalar_one_or_none()
    if not override:
        raise HTTPException(status_code=404, detail="Override not found")

    await db.delete(override)
    await db.commit()
    return {"status": "success", "message": "Override removed. System returns to GPS-derived rush."}
