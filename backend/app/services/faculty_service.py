"""Faculty service for Campus NEXUS — Firestore-backed.

Provides:
- Faculty directory search
- Faculty status computation from schedule + IST time
- Next available slot calculation
- Faculty details aggregation
"""

from datetime import datetime, time as dt_time
from typing import Any

from app.core.firebase import db


# Day of week constants
class DayOfWeek:
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class FacultyService:
    """Business logic for faculty data (Firestore)."""

    def __init__(self) -> None:
        pass  # No db session needed — uses Firestore singleton

    async def list_faculty_directory(self, search: str | None = None, department: str | None = None) -> list[dict[str, Any]]:
        """Return faculty directory with live status derived from schedule + IST."""
        if db is None:
            return []

        faculty_ref = db.collection("faculty").stream()
        directory = []
        now_ist = self._now_ist()
        today_day = self._today_day_of_week()

        for doc in faculty_ref:
            fac = doc.to_dict()
            full_name = fac.get("full_name", "")
            dept_name = fac.get("department", "")

            # Apply search filters
            if search and search.lower() not in full_name.lower():
                continue
            if department and department.lower() not in dept_name.lower():
                continue

            schedule = await self._get_today_schedule(doc.id, today_day)
            is_available = fac.get("is_available", True)
            status, next_slot = self._compute_status(is_available, schedule, now_ist)

            directory.append({
                "id": fac.get("user_id", doc.id),
                "faculty_id": doc.id,
                "faculty_name": full_name,
                "full_name": full_name,
                "name": full_name,
                "email": fac.get("email", ""),
                "designation": fac.get("designation", "Professor"),
                "department": dept_name or "Computer Applications",
                "office_location": fac.get("office_location", "SSBAS Room 308"),
                "is_available": is_available,
                "status": status,
                "next_available": next_slot,
                "available_slots": [
                    {"day": "Monday", "start": "15:30", "end": "17:00", "location": fac.get("office_location", "SSBAS Room 308")},
                    {"day": "Wednesday", "start": "14:00", "end": "16:00", "location": fac.get("office_location", "SSBAS Room 308")},
                    {"day": "Friday", "start": "11:00", "end": "13:00", "location": fac.get("office_location", "SSBAS Room 308")},
                ],
                "schedule_today": schedule,
            })
        return directory

    async def get_relevant_faculty_for_student(
        self,
        student_user_id: Any,
        search: str | None = None,
        department: str | None = None,
    ) -> list[dict[str, Any]]:
        """Return faculty relevant to a student based on enrolled courses and department."""
        if db is None:
            return []

        # 1. Look up student profile
        student_doc = None
        students_ref = db.collection("students").where("user_id", "==", str(student_user_id)).stream()
        for doc in students_ref:
            student_doc = doc.to_dict()
            student_doc["_doc_id"] = doc.id
            break

        # 2. Get enrolled faculty IDs & subjects
        enrolled_faculty_map: dict[str, list[str]] = {}
        student_dept = None
        if student_doc:
            student_dept = student_doc.get("department")
            enrollments_ref = db.collection("enrollments").where("student_id", "==", student_doc["_doc_id"]).stream()
            for enroll_doc in enrollments_ref:
                enroll = enroll_doc.to_dict()
                fac_id = enroll.get("faculty_id")
                course_name = enroll.get("course_name", "")
                course_code = enroll.get("course_code", "")
                section = enroll.get("section", "")
                if fac_id:
                    label = f"{course_code} ({section}) - {course_name}" if course_code else course_name
                    enrolled_faculty_map.setdefault(fac_id, []).append(label)

        # 3. Query faculty with optional filters
        faculty_ref = db.collection("faculty").stream()
        now_ist = self._now_ist()
        today_day = self._today_day_of_week()

        relevant_faculty = []
        for doc in faculty_ref:
            fac = doc.to_dict()
            full_name = fac.get("full_name", "")
            dept_name = fac.get("department", "")

            if search and search.lower() not in full_name.lower():
                continue
            if department and department.lower() not in dept_name.lower():
                continue

            is_direct_instructor = doc.id in enrolled_faculty_map
            is_same_dept = (student_dept is not None and fac.get("department") == student_dept)

            relationship = "general_faculty"
            if is_direct_instructor:
                relationship = "course_instructor"
            elif is_same_dept:
                relationship = "department_faculty"

            schedule = await self._get_today_schedule(doc.id, today_day)
            is_available = fac.get("is_available", True)
            status, next_slot = self._compute_status(is_available, schedule, now_ist)
            courses_taught = enrolled_faculty_map.get(doc.id, [])

            relevant_faculty.append({
                "id": fac.get("user_id", doc.id),
                "faculty_id": doc.id,
                "faculty_name": full_name,
                "full_name": full_name,
                "name": full_name,
                "email": fac.get("email", ""),
                "designation": fac.get("designation", "Professor"),
                "department": dept_name or "Computer Science",
                "office_location": fac.get("office_location", "SSBAS Room 308"),
                "is_available": is_available,
                "status": status,
                "next_available": next_slot,
                "relationship": relationship,
                "is_my_instructor": is_direct_instructor,
                "courses_taught_to_student": courses_taught,
                "available_slots": [
                    {"day": "Monday", "start": "15:30", "end": "17:00", "location": fac.get("office_location", "SSBAS Room 308")},
                    {"day": "Wednesday", "start": "14:00", "end": "16:00", "location": fac.get("office_location", "SSBAS Room 308")},
                    {"day": "Friday", "start": "11:00", "end": "13:00", "location": fac.get("office_location", "SSBAS Room 308")},
                ],
                "schedule_today": schedule,
            })

        def relevance_order(item: dict[str, Any]) -> int:
            if item["is_my_instructor"]:
                return 0
            if item["relationship"] == "department_faculty":
                return 1
            return 2

        relevant_faculty.sort(key=relevance_order)
        return relevant_faculty

    async def get_faculty_details(self, faculty_id: str) -> dict[str, Any] | None:
        """Get detailed faculty info including schedule and computed status."""
        if db is None:
            return None

        # Try direct document lookup first
        doc_ref = db.collection("faculty").document(faculty_id)
        doc = doc_ref.get()

        if not doc.exists:
            # Try querying by user_id
            results = db.collection("faculty").where("user_id", "==", faculty_id).stream()
            for result_doc in results:
                doc = result_doc
                break
            else:
                return None

        fac = doc.to_dict()
        now_ist = self._now_ist()
        today_day = self._today_day_of_week()
        schedule = await self._get_today_schedule(doc.id, today_day)
        is_available = fac.get("is_available", True)
        status, next_slot = self._compute_status(is_available, schedule, now_ist)

        return {
            "id": fac.get("user_id", doc.id),
            "faculty_id": doc.id,
            "faculty_name": fac.get("full_name", ""),
            "full_name": fac.get("full_name", ""),
            "name": fac.get("full_name", ""),
            "email": fac.get("email", ""),
            "designation": fac.get("designation", "Professor"),
            "department": fac.get("department", "Computer Applications"),
            "office_location": fac.get("office_location", "SSBAS Room 308"),
            "is_available": is_available,
            "status": status,
            "next_available": next_slot,
            "available_slots": [
                {"day": "Monday", "start": "15:30", "end": "17:00", "location": fac.get("office_location", "SSBAS Room 308")},
                {"day": "Wednesday", "start": "14:00", "end": "16:00", "location": fac.get("office_location", "SSBAS Room 308")},
                {"day": "Friday", "start": "11:00", "end": "13:00", "location": fac.get("office_location", "SSBAS Room 308")},
            ],
            "schedule_today": schedule,
        }

    async def _get_today_schedule(self, faculty_id: str, today_day: str) -> list[dict[str, Any]]:
        """Get today's class sessions for a faculty from Firestore."""
        if db is None:
            return []
        sessions_ref = (
            db.collection("class_sessions")
            .where("faculty_id", "==", faculty_id)
            .where("day_of_week", "==", today_day)
            .where("is_cancelled", "==", False)
            .stream()
        )
        schedule = []
        for doc in sessions_ref:
            sess = doc.to_dict()
            schedule.append({
                "id": doc.id,
                "day": (sess.get("day_of_week", today_day) or today_day).capitalize(),
                "start": sess.get("start_time", ""),
                "end": sess.get("end_time", ""),
                "course": sess.get("course_name", f"Course {sess.get('course_section_id', '')}"),
                "section": sess.get("section_number", ""),
                "room": sess.get("room", ""),
                "type": sess.get("session_type", "lecture"),
            })
        # Sort by start time
        schedule.sort(key=lambda s: s.get("start", ""))
        return schedule

    def _compute_status(self, is_available: bool, schedule: list[dict[str, Any]], now_ist: datetime) -> tuple[str, dict[str, Any] | None]:
        """Compute current status and next available slot from schedule + manual availability."""
        if not is_available:
            return "UNAVAILABLE", None

        current_time = now_ist.time()
        for sess in schedule:
            start = self._parse_time(sess.get("start", ""))
            end = self._parse_time(sess.get("end", ""))
            if start and end and start <= current_time <= end:
                return "IN CLASS", {
                    "current_class": sess.get("course"),
                    "room": sess.get("room"),
                    "ends_at": sess.get("end"),
                    "next_available_after": sess.get("end"),
                }

        for sess in schedule:
            start = self._parse_time(sess.get("start", ""))
            if start and current_time < start:
                return "AVAILABLE", {
                    "next_class": sess.get("course"),
                    "room": sess.get("room"),
                    "starts_at": sess.get("start"),
                    "next_available_after": sess.get("end"),
                }

        return "AVAILABLE", None

    def _now_ist(self) -> datetime:
        """Get current datetime in Asia/Kolkata timezone."""
        try:
            from zoneinfo import ZoneInfo
            return datetime.now(ZoneInfo("Asia/Kolkata"))
        except Exception:
            return datetime.now()

    def _today_day_of_week(self) -> str:
        """Get today's day name in lowercase."""
        now_ist = self._now_ist()
        return now_ist.strftime("%A").lower()

    def _parse_time(self, time_str: str | None) -> dt_time | None:
        """Parse HH:MM string to time object."""
        if not time_str:
            return None
        try:
            return dt_time.fromisoformat(time_str)
        except Exception:
            return None
