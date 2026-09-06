"""Faculty service for Campus NEXUS.

Provides:
- Faculty directory search
- Faculty status computation from schedule + IST time
- Next available slot calculation
- Faculty details aggregation
"""

from datetime import datetime, time as dt_time
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.faculty import Faculty
from app.models.user import User
from app.models.class_session import ClassSession, DayOfWeek
from app.models import Department, Room, Building, CourseSection, Student, Enrollment, Course


class FacultyService:
    """Business logic for faculty data."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_faculty_directory(self, search: str | None = None, department: str | None = None) -> list[dict[str, Any]]:
        """Return faculty directory with live status derived from schedule + IST."""
        stmt = (
            select(Faculty, User, Department.name.label("dept_name"))
            .join(User, Faculty.user_id == User.id)
            .outerjoin(Department, Faculty.department_id == Department.id)
            .order_by(User.full_name.asc())
        )
        if search:
            stmt = stmt.where(User.full_name.ilike(f"%{search}%"))
        if department:
            stmt = stmt.where(Department.name.ilike(f"%{department}%"))
        result = await self.db.execute(stmt)
        rows = result.all()

        directory = []
        now_ist = self._now_ist()
        today_day = self._today_day_of_week()

        for fac, usr, dept_name in rows:
            schedule = await self._get_today_schedule(fac.id, today_day)
            status, next_slot = self._compute_status(fac, schedule, now_ist)

            directory.append({
                "id": str(usr.id),
                "faculty_id": str(fac.id),
                "faculty_name": usr.full_name,
                "full_name": usr.full_name,
                "name": usr.full_name,
                "email": usr.email,
                "designation": fac.designation or "Professor",
                "department": dept_name or "Computer Applications",
                "office_location": fac.office_location or "SSBAS Room 308",
                "is_available": fac.is_available if fac.is_available is not None else True,
                "status": status,
                "next_available": next_slot,
                "available_slots": [
                    {
                        "day": "Monday",
                        "start": "15:30",
                        "end": "17:00",
                        "location": fac.office_location or "SSBAS Room 308",
                    },
                    {
                        "day": "Wednesday",
                        "start": "14:00",
                        "end": "16:00",
                        "location": fac.office_location or "SSBAS Room 308",
                    },
                    {
                        "day": "Friday",
                        "start": "11:00",
                        "end": "13:00",
                        "location": fac.office_location or "SSBAS Room 308",
                    },
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
        # 1. Look up student profile
        stud_stmt = select(Student).where(Student.user_id == student_user_id)
        stud_res = await self.db.execute(stud_stmt)
        student = stud_res.scalar_one_or_none()

        # 2. Get enrolled faculty IDs & subjects
        enrolled_faculty_map: dict[int, list[str]] = {}
        student_dept_id = None
        if student:
            student_dept_id = student.department_id
            enroll_stmt = (
                select(CourseSection.faculty_id, CourseSection.section_number, Course.name, Course.code)
                .join(Enrollment, Enrollment.course_section_id == CourseSection.id)
                .join(Course, CourseSection.course_id == Course.id)
                .where(Enrollment.student_id == student.id)
            )
            enroll_res = await self.db.execute(enroll_stmt)
            for fac_id, sec_no, c_name, c_code in enroll_res.all():
                if fac_id:
                    enrolled_faculty_map.setdefault(fac_id, []).append(f"{c_code} ({sec_no}) - {c_name}")

        # 3. Query faculty with optional filters
        stmt = (
            select(Faculty, User, Department.name.label("dept_name"))
            .join(User, Faculty.user_id == User.id)
            .outerjoin(Department, Faculty.department_id == Department.id)
            .order_by(User.full_name.asc())
        )
        if search:
            stmt = stmt.where(User.full_name.ilike(f"%{search}%"))
        if department:
            stmt = stmt.where(Department.name.ilike(f"%{department}%"))

        result = await self.db.execute(stmt)
        rows = result.all()

        now_ist = self._now_ist()
        today_day = self._today_day_of_week()

        relevant_faculty = []
        for fac, usr, dept_name in rows:
            is_direct_instructor = fac.id in enrolled_faculty_map
            is_same_dept = (student_dept_id is not None and fac.department_id == student_dept_id)

            relationship = "general_faculty"
            if is_direct_instructor:
                relationship = "course_instructor"
            elif is_same_dept:
                relationship = "department_faculty"

            schedule = await self._get_today_schedule(fac.id, today_day)
            status, next_slot = self._compute_status(fac, schedule, now_ist)
            courses_taught = enrolled_faculty_map.get(fac.id, [])

            relevant_faculty.append({
                "id": str(usr.id),
                "faculty_id": str(fac.id),
                "faculty_name": usr.full_name,
                "full_name": usr.full_name,
                "name": usr.full_name,
                "email": usr.email,
                "designation": fac.designation or "Professor",
                "department": dept_name or "Computer Science",
                "office_location": fac.office_location or "SSBAS Room 308",
                "is_available": fac.is_available if fac.is_available is not None else True,
                "status": status,
                "next_available": next_slot,
                "relationship": relationship,
                "is_my_instructor": is_direct_instructor,
                "courses_taught_to_student": courses_taught,
                "available_slots": [
                    {"day": "Monday", "start": "15:30", "end": "17:00", "location": fac.office_location or "SSBAS Room 308"},
                    {"day": "Wednesday", "start": "14:00", "end": "16:00", "location": fac.office_location or "SSBAS Room 308"},
                    {"day": "Friday", "start": "11:00", "end": "13:00", "location": fac.office_location or "SSBAS Room 308"},
                ],
                "schedule_today": schedule,
            })

        # Sort so student's direct course instructors appear first, followed by department faculty, then others
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
        try:
            fk = int(faculty_id)
        except ValueError:
            fk = None

        stmt = (
            select(Faculty, User, Department.name.label("dept_name"))
            .join(User, Faculty.user_id == User.id)
            .outerjoin(Department, Faculty.department_id == Department.id)
        )
        if fk is not None:
            stmt = stmt.where(Faculty.id == fk)
        else:
            stmt = stmt.where(User.id == faculty_id)
        result = await self.db.execute(stmt)
        row = result.first()
        if not row:
            return None

        fac, usr, dept_name = row
        now_ist = self._now_ist()
        today_day = self._today_day_of_week()
        schedule = await self._get_today_schedule(fac.id, today_day)
        status, next_slot = self._compute_status(fac, schedule, now_ist)

        return {
            "id": str(usr.id),
            "faculty_id": str(fac.id),
            "faculty_name": usr.full_name,
            "full_name": usr.full_name,
            "name": usr.full_name,
            "email": usr.email,
            "designation": fac.designation or "Professor",
            "department": dept_name or "Computer Applications",
            "office_location": fac.office_location or "SSBAS Room 308",
            "is_available": fac.is_available if fac.is_available is not None else True,
            "status": status,
            "next_available": next_slot,
            "available_slots": [
                {"day": "Monday", "start": "15:30", "end": "17:00", "location": fac.office_location or "SSBAS Room 308"},
                {"day": "Wednesday", "start": "14:00", "end": "16:00", "location": fac.office_location or "SSBAS Room 308"},
                {"day": "Friday", "start": "11:00", "end": "13:00", "location": fac.office_location or "SSBAS Room 308"},
            ],
            "schedule_today": schedule,
        }

    async def _get_today_schedule(self, faculty_id: int, today_day: str) -> list[dict[str, Any]]:
        """Get today's class sessions for a faculty."""
        stmt = (
            select(ClassSession, CourseSection.section_number, Room.room_number, Building.name.label("building_name"))
            .join(CourseSection, ClassSession.course_section_id == CourseSection.id)
            .outerjoin(Room, ClassSession.room_id == Room.id)
            .outerjoin(Building, Room.building_id == Building.id)
            .where(ClassSession.faculty_id == faculty_id)
            .where(ClassSession.day_of_week == today_day)
            .where(ClassSession.is_cancelled == False)
            .order_by(ClassSession.start_time.asc())
        )
        result = await self.db.execute(stmt)
        rows = result.all()
        schedule = []
        for sess, sec_num, rm_num, b_name in rows:
            schedule.append({
                "id": sess.id,
                "day": sess.day_of_week.capitalize() if sess.day_of_week else today_day.capitalize(),
                "start": sess.start_time,
                "end": sess.end_time,
                "course": f"Course {sess.course_section_id}",
                "section": sec_num,
                "room": f"{b_name or 'Campus'} {rm_num or ''}".strip(),
                "type": sess.session_type.value if hasattr(sess.session_type, 'value') else str(sess.session_type),
            })
        return schedule

    def _compute_status(self, faculty: Faculty, schedule: list[dict[str, Any]], now_ist: datetime) -> tuple[str, dict[str, Any] | None]:
        """Compute current status and next available slot from schedule + manual availability."""
        if not faculty.is_available:
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
        """Get today's day name in lowercase matching DayOfWeek enum."""
        now_ist = self._now_ist()
        day_name = now_ist.strftime("%A").lower()
        mapping = {
            "monday": DayOfWeek.MONDAY,
            "tuesday": DayOfWeek.TUESDAY,
            "wednesday": DayOfWeek.WEDNESDAY,
            "thursday": DayOfWeek.THURSDAY,
            "friday": DayOfWeek.FRIDAY,
            "saturday": DayOfWeek.SATURDAY,
            "sunday": DayOfWeek.SUNDAY,
        }
        return mapping.get(day_name, DayOfWeek.MONDAY)

    def _parse_time(self, time_str: str | None) -> dt_time | None:
        """Parse HH:MM string to time object."""
        if not time_str:
            return None
        try:
            return dt_time.fromisoformat(time_str)
        except Exception:
            return None
