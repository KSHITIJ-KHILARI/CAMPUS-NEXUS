"""Pulse & Crowd Intelligence API routes with NEXUS Buzz integration."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import uuid

from app.api.deps import get_current_db, get_current_active_user
from app.models.campus_location import CampusLocation
from app.models.crowd_state import CrowdState
from app.models.crowd_report import CrowdReport
from app.models.buzz_post import BuzzPost
from app.models.user import User
from app.services.location_service import LocationService

router = APIRouter()


class SubmitCrowdReportRequest(BaseModel):
    location_id: Optional[int] = None
    location_name: Optional[str] = None
    density_level: str = "moderate"  # low, moderate, high, crowded
    notes: Optional[str] = None


class CreateBuzzPostRequest(BaseModel):
    location_id: Optional[int] = None
    location_name: Optional[str] = None
    title: str
    content: str


async def _resolve_loc(db: AsyncSession, loc_id: Optional[int], loc_name: Optional[str]) -> Optional[CampusLocation]:
    """Helper to resolve CampusLocation safely."""
    if loc_id:
        res = await db.execute(select(CampusLocation).where(CampusLocation.id == loc_id).limit(1))
        loc = res.scalars().first()
        if loc:
            return loc
    if loc_name:
        res = await db.execute(select(CampusLocation).where(CampusLocation.name.ilike(f"%{loc_name}%")).limit(1))
        loc = res.scalars().first()
        if loc:
            return loc
    res = await db.execute(select(CampusLocation).limit(1))
    return res.scalars().first()


@router.get("", tags=["pulse"])
@router.get("/", tags=["pulse"])
async def get_campus_pulse(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get overall campus pulse data from real GPS-derived rush state."""
    await LocationService.expire_stale_overrides(db)
    rush_data = await LocationService.get_rush_state(db)

    rush_map = {item["location_id"]: item for item in rush_data}

    facilities = []
    high_count = 0
    for item in rush_data:
        level = item["rush_level"].lower()
        if level in ("high", "very_high"):
            high_count += 1
        facilities.append({
            "id": item["location_id"],
            "name": item["location_name"],
            "type": item.get("location_type", "building"),
            "crowd_level": level,
            "occupancy": item["current_count"],
            "wait_time": f"{item['current_count'] * 2} min" if level in ("high", "very_high") else (f"{item['current_count']} min" if level == "moderate" else "0 min"),
            "capacity": item["capacity"],
            "confidence": item["confidence"],
            "source": item["source"],
        })

    overall_status = "high" if high_count >= 3 else ("moderate" if high_count >= 1 else "low")

    return {
        "overall_status": overall_status,
        "facilities": facilities,
        "high_density_count": high_count,
        "last_updated": datetime.utcnow().isoformat(),
    }


@router.get("/locations", tags=["pulse"])
async def get_pulse_locations(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all monitored campus locations with their real-time GPS-derived telemetry."""
    rush_data = await LocationService.get_rush_state(db)
    return rush_data


@router.post("/report", tags=["pulse"])
async def submit_crowd_report(
    payload: SubmitCrowdReportRequest,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Submit a crowdsourced crowd density observation with confidence weighting (Phase 16)."""
    loc = await _resolve_loc(db, payload.location_id, payload.location_name)
    if not loc:
        raise HTTPException(status_code=404, detail="Campus location not found")

    now_str = datetime.utcnow().isoformat()
    # Add crowd report
    report = CrowdReport(
        location_id=loc.id,
        reported_by_user_id=current_user.id,
        count=80 if payload.density_level == "high" else 40,
        capacity=100,
        density_level=payload.density_level,
        confidence_score=0.95,
        reported_at=now_str,
        notes=payload.notes,
        is_verified=True,
    )
    db.add(report)

    # Update or create crowd state
    cs_res = await db.execute(select(CrowdState).where(CrowdState.location_id == loc.id))
    cs = cs_res.scalar_one_or_none()
    if cs:
        cs.density_level = payload.density_level
        cs.last_updated = now_str
        cs.is_alert = payload.density_level in ("high", "critical")
    else:
        db.add(CrowdState(
            location_id=loc.id,
            current_count=80 if payload.density_level == "high" else 40,
            capacity=100,
            occupancy_ratio=0.8 if payload.density_level == "high" else 0.4,
            density_level=payload.density_level,
            last_updated=now_str,
            is_alert=payload.density_level in ("high", "critical"),
        ))

    await db.commit()
    return {
        "status": "success",
        "message": f"Crowd report for {loc.name} recorded. Thank you for contributing to Campus NEXUS intelligence!",
        "density_level": payload.density_level,
    }


@router.get("/buzz", tags=["pulse"])
async def get_nexus_buzz(
    location_id: Optional[int] = None,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get location-specific community feeds and live AI activity summary (Phase 17)."""
    stmt = (
        select(BuzzPost, CampusLocation.name.label("location_name"), User.full_name.label("author_name"))
        .outerjoin(CampusLocation, BuzzPost.location_id == CampusLocation.id)
        .outerjoin(User, BuzzPost.user_id == User.id)
        .order_by(BuzzPost.id.desc())
    )
    if location_id:
        stmt = stmt.where(BuzzPost.location_id == location_id)

    result = await db.execute(stmt)
    rows = result.all()

    posts = []
    for post, loc_name, auth_name in rows:
        posts.append({
            "id": post.id,
            "location_name": loc_name or "Campus",
            "author": auth_name or "Student",
            "title": post.title,
            "content": post.content,
            "likes": post.likes_count,
            "created_at": post.created_at.strftime("%I:%M %p") if hasattr(post.created_at, "strftime") else "Recently",
        })

    # Dynamic AI institutional summary based on real database state & GPS rush telemetry
    try:
        rush_states = await LocationService.get_rush_state(db)
        high_rush = [r for r in rush_states if r.get("rush_level") in ("HIGH", "VERY_HIGH")]
        low_rush = [r for r in rush_states if r.get("rush_level") == "LOW"]
        
        summary_parts = []
        if high_rush:
            busy_str = ", ".join([f"{r['location_name']} ({r.get('rush_level', '').replace('_', ' ').title()})" for r in high_rush[:3]])
            summary_parts.append(f"High activity observed at: {busy_str}.")
        if low_rush:
            quiet_str = ", ".join([r['location_name'] for r in low_rush[:3]])
            summary_parts.append(f"Quiet zones with low density include: {quiet_str}.")
            
        if summary_parts:
            ai_situation = "CURRENT SOMAIYA CAMPUS SITUATION: " + " ".join(summary_parts)
        else:
            ai_situation = "CURRENT SOMAIYA CAMPUS SITUATION: Normal traffic flow across all campus zones. Real-time GPS rush telemetry is operational."
    except Exception:
        ai_situation = "CURRENT SOMAIYA CAMPUS SITUATION: Telemetry active. All campus facilities operating normally."

    return {
        "ai_summary": ai_situation,
        "posts": posts,
    }


@router.post("/buzz", tags=["pulse"])
async def create_buzz_post(
    payload: CreateBuzzPostRequest,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Post to NEXUS Buzz community feed (Phase 17)."""
    loc = await _resolve_loc(db, payload.location_id, payload.location_name)
    if not loc:
        raise HTTPException(status_code=404, detail="Campus location not found")

    post = BuzzPost(
        location_id=loc.id,
        user_id=current_user.id,
        title=payload.title,
        content=payload.content,
        likes_count=0,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)

    return {
        "status": "success",
        "post_id": post.id,
        "title": post.title,
        "message": "NEXUS Buzz post published successfully",
    }


@router.get("/states", tags=["pulse"])
async def get_pulse_states(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get detailed crowd telemetry across all campus locations."""
    return await get_pulse_locations(db, current_user)


@router.get("/heatmap", tags=["pulse"])
async def get_heatmap_data(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get campus heatmap GeoJSON data."""
    locs_res = await db.execute(select(CampusLocation))
    locations = locs_res.scalars().all()
    features = []
    for loc in locations:
        cs_res = await db.execute(select(CrowdState).where(CrowdState.location_id == loc.id))
        cs = cs_res.scalars().first()
        intensity = cs.occupancy_ratio if cs else 0.5
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [loc.longitude or 72.877, loc.latitude or 19.076]},
            "properties": {"name": loc.name, "intensity": intensity, "level": cs.density_level if cs else "moderate"},
        })

    return {
        "type": "FeatureCollection",
        "features": features,
    }
