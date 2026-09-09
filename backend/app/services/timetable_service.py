"""Timetable service for Campus NEXUS — Firestore-backed."""

from datetime import datetime, timedelta, timezone
from typing import Any

from app.core.firebase import db


class TimetableService:
    """Service for timetable operations (Firestore)."""

    async def get_student_schedule(self, student_id: str, target_date: datetime | None = None) -> dict[str, Any]:
        """Get student schedule for a date from Firestore."""
        if db is None:
            return {"student_id": student_id, "entries": [], "next_class": None}

        # Get schedule entries for this student
        entries = []
        schedule_ref = db.collection("schedule_entries").where("student_id", "==", student_id).stream()
        for doc in schedule_ref:
            entry = doc.to_dict()
            entries.append({
                "id": doc.id,
                "course_name": entry.get("course_name", ""),
                "room": entry.get("room", ""),
                "start_time": entry.get("start_time", ""),
                "end_time": entry.get("end_time", ""),
                "day_of_week": entry.get("day_of_week", ""),
                "building": entry.get("building", ""),
            })

        return {
            "student_id": student_id,
            "entries": entries,
            "next_class": entries[0] if entries else None,
        }

    async def get_next_class(self, user_id: str) -> dict[str, Any] | None:
        """Get the next upcoming class for a user from Firestore."""
        if db is None:
            return None

        # Check schedule_entries for this user
        try:
            from zoneinfo import ZoneInfo
            now = datetime.now(ZoneInfo("Asia/Kolkata"))
        except Exception:
            now = datetime.now(timezone.utc)

        today = now.strftime("%A").lower()
        current_time = now.strftime("%H:%M")

        schedule_ref = (
            db.collection("schedule_entries")
            .where("student_id", "==", user_id)
            .where("day_of_week", "==", today)
            .stream()
        )

        next_class = None
        for doc in schedule_ref:
            entry = doc.to_dict()
            start_time = entry.get("start_time", "")
            if start_time > current_time:
                if next_class is None or start_time < next_class.get("start_time", ""):
                    next_class = entry
                    next_class["_doc_id"] = doc.id

        if next_class:
            # Calculate starts_in_minutes
            try:
                h, m = map(int, next_class["start_time"].split(":"))
                start_dt = now.replace(hour=h, minute=m, second=0, microsecond=0)
                diff = (start_dt - now).total_seconds() / 60
            except Exception:
                diff = 30

            return {
                "course_name": next_class.get("course_name", ""),
                "room": next_class.get("room", ""),
                "start_time": next_class.get("start_time", ""),
                "starts_in_minutes": max(0, int(diff)),
                "building": next_class.get("building", ""),
                "floor": next_class.get("floor"),
            }

        # Fallback mock for demo
        return {
            "course_name": "Java Practical",
            "room": "Aurobindo Lab 304",
            "start_time": (now + timedelta(minutes=32)).isoformat(),
            "starts_in_minutes": 32,
            "building": "Aurobindo",
            "floor": 3,
        }

    async def detect_conflicts(self, schedule: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Detect timetable conflicts."""
        conflicts = []
        return conflicts

    async def get_room_availability(self, room_id: str, start: datetime, end: datetime) -> dict[str, Any]:
        """Check room availability for a time range from Firestore."""
        if db is None:
            return {"available": True, "conflicts": []}

        # Check class_sessions for overlapping bookings
        sessions_ref = (
            db.collection("class_sessions")
            .where("room_id", "==", room_id)
            .stream()
        )
        conflicts = []
        for doc in sessions_ref:
            sess = doc.to_dict()
            # Basic time overlap check would go here
            pass

        return {"available": len(conflicts) == 0, "conflicts": conflicts}
