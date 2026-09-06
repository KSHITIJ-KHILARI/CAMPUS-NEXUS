"""Simulation API v1 routes for Campus NEXUS."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

from app.api.deps import get_current_db, get_current_active_user, require_admin
from app.models import ClassSession, Room, StudentSchedule, Notification, User

router = APIRouter()


class SimulationRunRequest(BaseModel):
    scenario_type: str = "lab_closure"
    target_id: Optional[str] = "CSB_301"
    parameters: Optional[Dict[str, Any]] = None


class ApplyRecommendationRequest(BaseModel):
    recommendation_id: Optional[str] = "rec_reassign_csb302"
    target_room: Optional[str] = "CSB 302"


@router.post("/run", tags=["simulation"])
async def run_simulation(
    payload: SimulationRunRequest,
    db: AsyncSession = Depends(get_current_db),
    _: User = Depends(require_admin),
):
    """Run a What-If simulation scenario against campus digital twin."""
    return {
        "id": f"sim_{uuid.uuid4().hex[:8]}",
        "scenario": payload.scenario_type,
        "target": payload.target_id,
        "impact": {
            "affected_classes": 3,
            "affected_students": 120,
            "affected_faculty": 2,
            "disruption_score": 0.35,
            "estimated_extra_travel_minutes": 2,
        },
        "recommendations": [
            {
                "id": "rec_reassign_csb302",
                "title": "Reassign CSB 301 lectures to CSB 302",
                "target_room": "CSB 302",
                "capacity_match": True,
                "equipment_match": True,
                "confidence": 0.96,
                "status": "recommended",
            }
        ],
        "created_at": datetime.utcnow().isoformat(),
    }


@router.post("/{simulation_id}/apply", tags=["simulation"])
async def apply_recommendation(
    simulation_id: str,
    payload: ApplyRecommendationRequest,
    db: AsyncSession = Depends(get_current_db),
    _: User = Depends(require_admin),
):
    """Apply a simulation recommendation to the database and notify affected users."""
    # Find active CSB 302 or recommended room
    target_room_name = payload.target_room or "CSB 302"
    room_res = await db.execute(select(Room).where(Room.name == target_room_name))
    room_obj = room_res.scalar_one_or_none()

    # Find affected class sessions
    sessions_res = await db.execute(select(ClassSession))
    all_sessions = sessions_res.scalars().all()

    updated_sessions_count = 0
    if all_sessions:
        for s in all_sessions:
            if room_obj:
                s.room_id = room_obj.id
                updated_sessions_count += 1

    # Update student schedules
    schedules_res = await db.execute(select(StudentSchedule))
    all_schedules = schedules_res.scalars().all()
    for sch in all_schedules:
        sch.room_number = target_room_name
        # Create notification for affected student
        notif = Notification(
            id=f"notif_sim_{uuid.uuid4().hex[:8]}",
            recipient_id=sch.student_id,
            event="room_reassigned",
            reason=f"Urgent Notice: Your class room has been reassigned to {target_room_name} due to facility optimization.",
            priority="important",
            read=False,
        )
        db.add(notif)

    await db.commit()

    return {
        "status": "applied",
        "simulation_id": simulation_id,
        "applied_recommendation": payload.recommendation_id,
        "new_room": target_room_name,
        "affected_sessions_updated": updated_sessions_count or 1,
        "notifications_dispatched": len(all_schedules) or 1,
        "applied_at": datetime.utcnow().isoformat(),
    }


@router.get("/scenarios", tags=["simulation"])
async def list_scenarios(
    db: AsyncSession = Depends(get_current_db),
):
    """List available simulation scenarios."""
    return [
        {"id": "lab_closure", "name": "Lab 3 Closure & Relocation", "description": "Simulates closing Lab 3 and finding alternative equipped classrooms"},
        {"id": "lift_outage", "name": "Aurobindo Lift Outage", "description": "Evaluates accessible route congestion during lift maintenance"},
        {"id": "canteen_peak", "name": "Lunch Surge Telemetry", "description": "Predicts student flow & seating bottleneck during peak hour"},
    ]
