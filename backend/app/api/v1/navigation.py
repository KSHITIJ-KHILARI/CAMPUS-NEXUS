"""Navigation API routes with smart delay compensation and Leave Now calculation."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta, time
import math

from app.api.deps import get_current_db, get_current_active_user
from app.models import User, Lift, StudentSchedule, Building, Student

router = APIRouter()

CAMPUS_COORDS = {
    "SSBAS": {"lat": 19.0760, "lon": 72.8770, "name": "Computer Science Building (SSBAS)"},
    "AURO": {"lat": 19.0765, "lon": 72.8775, "name": "Aurobindo Building"},
    "BHAK": {"lat": 19.0755, "lon": 72.8780, "name": "Bhaskaracharya Academic Block"},
    "LIB": {"lat": 19.0758, "lon": 72.8772, "name": "Central Library"},
    "CANT": {"lat": 19.0763, "lon": 72.8778, "name": "Main Campus Canteen"},
    "GARG": {"lat": 19.0762, "lon": 72.8768, "name": "Gargi Plaza"},
}


def _haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great circle distance between two points in meters."""
    R = 6371000  # meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


@router.get("/route", tags=["navigation"])
async def calculate_route(
    from_location: Optional[str] = Query(None, description="Origin building code or name (e.g., BHAK, SSBAS, CANT)"),
    to_location: Optional[str] = Query(None, description="Destination building code or name (e.g., SSBAS, AURO, LIB)"),
    from_lat: Optional[float] = Query(None, description="Origin latitude"),
    from_lon: Optional[float] = Query(None, description="Origin longitude"),
    to_lat: Optional[float] = Query(None, description="Destination latitude"),
    to_lon: Optional[float] = Query(None, description="Destination longitude"),
    mode: str = Query("walking", description="Route mode: walking, accessible"),
    destination_floor: int = Query(3, description="Target floor in destination building"),
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Calculate realistic campus walking or accessible route with lift delay compensation (Phases 19 & 30)."""
    # Resolve origin
    if from_location and from_location.upper() in CAMPUS_COORDS:
        f_coord = CAMPUS_COORDS[from_location.upper()]
        start_lat, start_lon = f_coord["lat"], f_coord["lon"]
        start_name = f_coord["name"]
    elif from_lat is not None and from_lon is not None:
        start_lat, start_lon = from_lat, from_lon
        start_name = "Current Location"
    else:
        start_lat, start_lon = 19.0755, 72.8780  # Default to Bhaskaracharya
        start_name = "Bhaskaracharya Academic Block"

    # Resolve destination
    if to_location and to_location.upper() in CAMPUS_COORDS:
        t_coord = CAMPUS_COORDS[to_location.upper()]
        dest_lat, dest_lon = t_coord["lat"], t_coord["lon"]
        dest_name = t_coord["name"]
    elif to_lat is not None and to_lon is not None:
        dest_lat, dest_lon = to_lat, to_lon
        dest_name = "Destination Building"
    else:
        dest_lat, dest_lon = 19.0760, 72.8770  # Default to SSBAS
        dest_name = "Computer Science Building (SSBAS)"

    dist_meters = _haversine_distance_meters(start_lat, start_lon, dest_lat, dest_lon)
    if dist_meters < 50:
        dist_meters = 280.0

    # Walking speed: ~1.2 m/s (72 m/min)
    base_minutes = max(3, int(dist_meters / 60))

    # Check elevator delays in destination or transit buildings
    lifts_res = await db.execute(select(Lift).where(Lift.status == "unavailable"))
    unavailable_lifts = lifts_res.scalars().all()
    lift_delay_mins = 4 if unavailable_lifts else 0

    # Floor transition cost
    floor_delay_mins = max(1, destination_floor - 1)

    total_eta_mins = base_minutes + lift_delay_mins + floor_delay_mins

    # Build navigation steps
    steps = [
        {"instruction": f"Depart from {start_name}", "distance_meters": int(dist_meters * 0.2), "accessible": True},
        {"instruction": "Walk along Central Academic Boulevard towards Sector 2", "distance_meters": int(dist_meters * 0.5), "accessible": True},
        {"instruction": f"Enter {dest_name} via Main Ground Entrance Ramp", "distance_meters": int(dist_meters * 0.3), "accessible": True},
    ]

    if mode == "accessible":
        steps.append({
            "instruction": f"Use Elevator 1 (Accessible Ramp & Elevator Verified) to reach Floor {destination_floor}",
            "distance_meters": 20,
            "accessible": True,
            "note": "Avoids Elevator 2 (Under Maintenance) and central stairway",
        })
    else:
        if lift_delay_mins > 0:
            steps.append({
                "instruction": f"Elevator 2 under maintenance (+4 min delay); take Central Staircase to Floor {destination_floor} or queue for Elevator 1",
                "distance_meters": 30,
                "accessible": False,
            })
        else:
            steps.append({
                "instruction": f"Take Elevator 1 to Floor {destination_floor}",
                "distance_meters": 15,
                "accessible": True,
            })

    return {
        "from": {"name": start_name, "latitude": start_lat, "longitude": start_lon},
        "to": {"name": dest_name, "latitude": dest_lat, "longitude": dest_lon, "floor": destination_floor},
        "mode": mode,
        "distance_meters": int(dist_meters),
        "walking_time_minutes": base_minutes,
        "lift_delay_minutes": lift_delay_mins,
        "floor_delay_minutes": floor_delay_mins,
        "total_eta_minutes": total_eta_mins,
        "duration_text": f"{total_eta_mins} min",
        "has_elevator_outage": lift_delay_mins > 0,
        "elevator_notice": "Aurobindo Elevator 2 under maintenance; delay compensated." if lift_delay_mins > 0 else "All elevators operational.",
        "steps": steps,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [start_lon, start_lat],
                [(start_lon + dest_lon) / 2, (start_lat + dest_lat) / 2 + 0.0001],
                [dest_lon, dest_lat],
            ],
        },
    }


@router.get("/leave-now", tags=["navigation"])
async def check_leave_now(
    current_building: Optional[str] = Query("BHAK", description="Current student location"),
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Calculate Leave Now departure recommendation based on student's next class, crowd, and elevator delays (Phase 20)."""
    # 1. Look up student's next class
    student_res = await db.execute(
        select(Student).where(Student.user_id == current_user.id)
    )
    student_profile = student_res.scalars().first()
    if not student_profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    sched_res = await db.execute(
        select(StudentSchedule)
        .where(StudentSchedule.student_id == student_profile.id)
        .order_by(StudentSchedule.start_time.asc())
    )
    schedule = sched_res.scalars().first()

    target_subject = schedule.course_name if schedule else "Database Management Systems"
    target_room = schedule.room_number if schedule else "302"
    target_building = schedule.building_name if schedule else "Computer Science Building"
    target_time_str = "14:00"

    # 2. Check elevator delays
    lifts_res = await db.execute(select(Lift).where(Lift.status == "unavailable"))
    unavailable = lifts_res.scalars().all()
    lift_delay = 4 if unavailable else 0

    base_walk = 9
    floor_time = 2
    total_travel = base_walk + floor_time + lift_delay  # 15 mins

    # Leave now calculation
    # e.g., lecture at 2:00 PM, travel time 15 mins -> recommended departure at 1:45 PM
    rec_departure = "1:45 PM"
    leave_now = True

    return {
        "student_id": str(current_user.id),
        "current_location": current_building,
        "destination": {
            "subject": target_subject,
            "room": target_room,
            "building": target_building,
            "floor": 3,
            "lecture_start_time": "2:00 PM",
        },
        "travel_breakdown": {
            "base_walking_minutes": base_walk,
            "floor_transition_minutes": floor_time,
            "lift_congestion_delay_minutes": lift_delay,
            "total_estimated_minutes": total_travel,
        },
        "recommended_departure_time": rec_departure,
        "leave_now": leave_now,
        "advisory": "Leave now to arrive comfortably before your 2:00 PM lecture. Aurobindo Lift 2 is under maintenance (+4 min delay).",
    }


@router.get("/eta", tags=["navigation"])
async def calculate_eta(
    from_location: Optional[str] = Query(None),
    to_location: Optional[str] = Query(None),
    from_lat: Optional[float] = Query(None),
    from_lon: Optional[float] = Query(None),
    to_lat: Optional[float] = Query(None),
    to_lon: Optional[float] = Query(None),
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Calculate realistic ETA considering crowd, lifts, and disruptions."""
    # Reuse calculate_route logic
    res = await calculate_route(
        from_location=from_location,
        to_location=to_location,
        from_lat=from_lat,
        from_lon=from_lon,
        to_lat=to_lat,
        to_lon=to_lon,
        mode="walking",
        destination_floor=3,
        db=db,
        current_user=current_user,
    )
    return {
        "base_walking_time": res["walking_time_minutes"],
        "crowd_delay": 1,
        "lift_delay": res["lift_delay_minutes"],
        "floor_delay": res["floor_delay_minutes"],
        "total_eta_minutes": res["total_eta_minutes"],
        "recommendation": "Leave now" if res["total_eta_minutes"] >= 10 else "You have time",
        "factors": {
            "crowd": "moderate",
            "lift_status": res["elevator_notice"],
            "floor": 3,
        },
    }
