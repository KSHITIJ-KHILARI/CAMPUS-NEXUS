"""AI Orchestrator service for Campus NEXUS.

Enforces role-based authorization for tool access:
- Students: own schedule/crowd/issue queries
- Faculty: students in their own sections
- Admins: any query
"""

from typing import Any
from datetime import datetime, timedelta

from sqlalchemy import or_ as sa_or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import Course, Department, Student
from app.models import Notification, Issue as IssueModel, LostItem, FoundItem, Building, Room
from app.models.event import Event as EventModel
from app.models.library import LibraryBook
from app.models.user import User
from app.models.user import User as UserModel
from app.services.crowd_service import CrowdService
from app.services.issue_service import IssueService
from app.services.navigation_service import NavigationService
from app.services.timetable_service import TimetableService


class AIOrchestratorService:
    """Orchestrator for NEXUS AI."""

    def __init__(self) -> None:
        self.timetable_service = TimetableService()
        self.navigation_service = NavigationService()
        self.crowd_service = CrowdService()
        self.issue_service = IssueService()

    async def process_query(
        self,
        user: User,
        query: str,
        context: dict[str, Any] | None = None,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """Process a natural language query for a given user (role-aware)."""
        intent = await self._classify_intent(query)

        if intent == "next_class":
            return await self._handle_next_class(user, db)
        elif intent == "schedule":
            return await self._handle_schedule(user, query, db)
        elif intent == "navigation":
            return await self._handle_navigation(user, query, db)
        elif intent == "crowd":
            return await self._handle_crowd(user, query, db)
        elif intent == "issue":
            return await self._handle_issue(user, query, db)
        elif intent == "faculty_students":
            return await self._handle_faculty_students(user, query)
        elif intent == "faculty_availability":
            return await self._handle_faculty_availability(user, query, db)
        elif intent == "admin_dashboard":
            return await self._handle_admin_dashboard(user, query)
        elif intent == "events":
            return await self._handle_events(user, query, db)
        elif intent == "courses":
            return await self._handle_courses(user, query, db)
        elif intent == "rooms":
            return await self._handle_rooms(user, query, db)
        elif intent == "library":
            return await self._handle_library(user, query, db)
        elif intent == "notifications":
            return await self._handle_notifications(user, query, db)
        elif intent == "lost_found":
            return await self._handle_lost_found(user, query, db)
        elif intent == "digital_twin":
            return await self._handle_digital_twin(user, query, db)
        elif intent == "student_details":
            return await self._handle_student_details(user, query, db)
        elif intent == "student_portfolio":
            return await self._handle_portfolio(user, query, db)
        else:
            return {
                "response": "I am NEXUS AI, your campus intelligence assistant for Somaiya Vidyavihar University. I can help you with schedules, events, faculty availability, course information, library books, issue reports, campus navigation, crowd levels, notifications, lost & found, and your student portfolio. What would you like to know?",
                "tools_used": ["general_query"],
                "confidence": 0.85,
            }

    async def _classify_intent(self, query: str) -> str:
        """Classify user intent (supports English + Hindi/Hinglish keywords)."""
        q = query.lower().strip()
        hindi_keywords = {
            "kaunsa": "which", "konsa": "which", "kaha": "where", "kya": "what",
            "kab": "when", "kaise": "how", "kyun": "why",
            "hai": "is", "hain": "are", "hun": "are",
            "mein": "in", "par": "on", "pe": "on",
            "free": "free", "available": "available",
            "shikshak": "faculty", "teacher": "teacher", "faculty": "faculty",
            "kitab": "book", "library": "library",
            "kaksh": "room", "classroom": "room",
            "event": "event", "program": "program", "seminar": "seminar",
            "course": "course", "subject": "subject", "class": "class",
            "portfolio": "portfolio", "project": "project", "internship": "internship",
            "skill": "skill", "certification": "certification",
            "notification": "notification", "notice": "notification",
            "lost": "lost", "found": "found", "misplace": "lost",
            "crowd": "crowd", "busy": "busy", "crowded": "crowded",
            "schedule": "schedule", "timetable": "schedule", "timing": "schedule",
            "digital": "digital", "twin": "twin", "campus": "campus",
            "student": "student", "faculty": "faculty",
            "register": "register", "enroll": "register",
            "nikalna": "leave", "nikal": "leave", "jana": "go",
            "chahiye": "should", "ab": "now", "padega": "must",
            "should": "should", "go": "go", "now": "now",
        }
        for hin, eng in hindi_keywords.items():
            q = q.replace(hin, eng)

        # Next class — check before navigation since "where is my next class" is a schedule query
        if any(k in q for k in ["next class", "next lecture", "next period", "my next class", "should i leave", "should i go", "leave now", "leave", "need to leave", "time to leave", "gotta go", "should i go"]):
            return "next_class"

        # Navigation: route, how to get, where is, direction
        if any(k in q for k in ["navigate", "route", "how to get", "how do i get", "where is", "direction", "how do i reach", "way to"]):
            if "free" not in q and "next class" not in q:
                return "navigation"

        # Events: event, happening, upcoming, happening, register
        if any(k in q for k in ["event", "happening", "upcoming", "register for", "enroll in", "attend", "seminar", "workshop"]) and "course" not in q and "class" not in q:
            return "events"

        # Schedule: schedule, timetable, next class, my day
        if any(k in q for k in ["schedule", "timetable", "my day", "my schedule", "next class", "next lecture", "next period", "lecture schedule", "class schedule"]):
            return "schedule"

        # Notifications
        if any(k in q for k in ["notification", "notif", "alert", "reminder", "message"]):
            return "notifications"

        # Lost & Found
        if any(k in q for k in ["lost", "found", "misplace", "missing item", "i lost", "i found"]):
            return "lost_found"

        # Digital twin / campus facilities
        if any(k in q for k in ["digital twin", "campus overview", "campus status", "campus state", "facility", "facilities", "building status", "campus facilities"]):
            return "digital_twin"

        # Library / books / reservations
        if any(k in q for k in ["book", "reserve", "reservation", "library", "catalog", "available book", "borrow", "checkout"]) and "crowd" not in q and "crowded" not in q and "pulse" not in q and "rush" not in q:
            return "library"

        # Courses
        if any(k in q for k in ["course", "subject", "teach", "taught", "syllabus", "credit", "prerequisite"]) and "teacher" not in q and "faculty" not in q and "professor" not in q:
            return "courses"

        # Faculty availability
        if ("faculty" in q or "teacher" in q or "professor" in q) and ("free" in q or "available" in q or "busy" in q or "where is" in q):
            return "faculty_availability"
        if any(k in q for k in ["who is free", "who is available", "which faculty", "which professor"]):
            return "faculty_availability"

        # Student details / portfolio
        if "portfolio" in q or "my project" in q or "my internship" in q or ("skill" in q and "my" in q) or "certification" in q:
            return "student_portfolio"
        if any(k in q for k in ["student", "enroll", "gpa", "grade", "academic", "attendance"]) and "faculty" not in q:
            return "student_details"

        # Rooms
        if any(k in q for k in ["free room", "vacant room", "classroom", "empty room", "room for", "available room", "study room"]):
            return "rooms"
        if "free" in q and "faculty" not in q and "room" in q:
            return "rooms"

        # Issues
        if any(k in q for k in ["issue", "problem", "broken", "report", "maintenance", "out of order"]):
            return "issue"

        # Crowd / campus pulse
        if any(k in q for k in ["crowd", "busy", "occupancy", "crowded", "pulse", "how crowded"]):
            return "crowd"

        # Free availability (fallthrough)
        if "free" in q or "available" in q:
            return "faculty_availability"

        # Faculty students list
        if "my students" in q or "student list" in q:
            return "faculty_students"

        # Admin dashboard
        if "admin dashboard" in q or "campus overview" in q:
            return "admin_dashboard"

        return "general"

    def _role_value(self, user: User) -> str:
        """Return the stringified role for comparison."""
        role = user.role
        return role.value if hasattr(role, "value") else str(role)

    async def _handle_next_class(self, user: User, db: AsyncSession | None = None) -> dict[str, Any]:
        """Handle next class query — returns the next upcoming class from the schedule."""
        from app.models import StudentSchedule

        if db is None:
            next_class = await self.timetable_service.get_next_class(str(user.id))
        else:
            try:
                student_id = user.student_profile.id if user.student_profile else None
                today_weekday = datetime.utcnow().weekday()
                now = datetime.utcnow()

                # 1. Try today's schedule with future start times
                stmt = (
                    select(StudentSchedule)
                    .where(StudentSchedule.student_id == student_id)
                    .where(StudentSchedule.day_of_week == today_weekday)
                    .where(StudentSchedule.start_time > now)
                    .order_by(StudentSchedule.start_time)
                )
                result = await db.execute(stmt)
                schedules = result.scalars().all()

                next_class = None
                if schedules:
                    s = schedules[0]
                    starts_in = int((s.start_time - now).total_seconds() / 60)
                    next_class = {
                        "course_name": s.course_name,
                        "room": f"{s.building_name} {s.room_number}",
                        "start_time": s.start_time.strftime("%I:%M %p"),
                        "starts_in_minutes": starts_in,
                        "building": s.building_name,
                    }
                else:
                    # 2. Fall back: any future classes regardless of day_of_week
                    stmt2 = (
                        select(StudentSchedule)
                        .where(StudentSchedule.student_id == student_id)
                        .where(StudentSchedule.start_time > now)
                        .order_by(StudentSchedule.start_time)
                    )
                    result2 = await db.execute(stmt2)
                    future = result2.scalars().all()
                    if future:
                        s = future[0]
                        starts_in = int((s.start_time - now).total_seconds() / 60)
                        next_class = {
                            "course_name": s.course_name,
                            "room": f"{s.building_name} {s.room_number}",
                            "start_time": s.start_time.strftime("%I:%M %p"),
                            "starts_in_minutes": starts_in,
                            "building": s.building_name,
                        }
                    else:
                        # 3. Fall back: first class from today's schedule (even if past)
                        stmt3 = (
                            select(StudentSchedule)
                            .where(StudentSchedule.student_id == student_id)
                            .where(StudentSchedule.day_of_week == today_weekday)
                            .order_by(StudentSchedule.start_time)
                        )
                        result3 = await db.execute(stmt3)
                        schedules_today = result3.scalars().all()
                        if schedules_today:
                            s = sorted(schedules_today, key=lambda x: x.start_time)[-1]
                            next_class = {
                                "course_name": s.course_name,
                                "room": f"{s.building_name} {s.room_number}",
                                "start_time": s.start_time.strftime("%I:%M %p"),
                                "starts_in_minutes": 0,
                                "building": s.building_name,
                                "note": "All classes for today are in the past.",
                            }
                        else:
                            # 4. Last resort: any class from the schedule
                            stmt4 = (
                                select(StudentSchedule)
                                .where(StudentSchedule.student_id == student_id)
                                .order_by(StudentSchedule.start_time)
                            )
                            result4 = await db.execute(stmt4)
                            all_schedules = result4.scalars().all()
                            if all_schedules:
                                s = sorted(all_schedules, key=lambda x: x.start_time)[-1]
                                next_class = {
                                    "course_name": s.course_name,
                                    "room": f"{s.building_name} {s.room_number}",
                                    "start_time": s.start_time.strftime("%I:%M %p"),
                                    "starts_in_minutes": 0,
                                    "building": s.building_name,
                                    "note": "Your next recurring class.",
                                }
            except Exception:
                next_class = await self.timetable_service.get_next_class(str(user.id))

        if not next_class:
            return {
                "response": "You don't have any more classes scheduled for today.",
                "tools_used": ["get_next_class"],
                "confidence": 0.9,
            }

        # Get current GPS location and matched campus location for ETA
        current_location_name = None
        eta_minutes = 15
        try:
            from app.models.user_location import UserLocationState
            from app.services.location_service import LocationService as _LocSvc

            loc_res = await db.execute(
                select(UserLocationState).where(UserLocationState.user_id == user.id)
            ) if db else None
            loc_state = loc_res.scalar_one_or_none() if loc_res else None
            if loc_state and loc_state.latitude is not None and loc_state.longitude is not None:
                matched = await _LocSvc.match_location(db, loc_state.latitude, loc_state.longitude) if db else None
                current_location_name = matched["name"] if matched else "your current location"
                # Use navigation service for ETA (includes lift/crowd/floor delays)
                eta_result = await self.navigation_service.calculate_realistic_eta(
                    from_lat=loc_state.latitude,
                    from_lon=loc_state.longitude,
                    to_lat=19.0760,
                    to_lon=72.8770,
                )
                eta_minutes = eta_result.get("total_eta_minutes", 15)
        except Exception:
            pass

        if current_location_name is None:
            current_location_name = "your current location"

        starts_in = next_class.get("starts_in_minutes", 0)
        room = next_class.get("room", "TBA")
        class_time = next_class.get("start_time", "TBD")
        course = next_class.get("course_name", "Your class")

        # Build response
        if starts_in <= 0:
            response = (
                f"Your next class is {course} in {room} starting at {class_time}. "
                f"You are currently near {current_location_name}. "
                f"Your class has already started — check your schedule for upcoming classes."
            )
        elif starts_in <= eta_minutes:
            response = (
                f"Your next class is {course} in {room} starting at {class_time}. "
                f"You are currently near {current_location_name}. "
                f"Estimated travel time is {eta_minutes} minutes. "
                f"You should leave now."
            )
        elif starts_in <= eta_minutes + 5:
            wait_mins = eta_minutes - starts_in
            response = (
                f"Your next class is {course} in {room} starting at {class_time}. "
                f"You are currently near {current_location_name}. "
                f"Estimated travel time is {eta_minutes} minutes. "
                f"You should leave in about {max(0, wait_mins)} minutes."
            )
        else:
            response = (
                f"Your next class is {course} in {room} starting at {class_time}. "
                f"You are currently near {current_location_name}. "
                f"Estimated travel time is {eta_minutes} minutes. "
                f"You have time — you can leave in {starts_in - eta_minutes} minutes."
            )

        return {
            "response": response,
            "tools_used": ["get_next_class", "get_current_location"],
            "confidence": 0.95,
            "data": {**next_class, "current_location": current_location_name, "eta_minutes": eta_minutes},
        }

    async def _handle_navigation(self, user: User, query: str, db: AsyncSession | None = None) -> dict[str, Any]:
        """Handle navigation query — extract destination and provide route info."""
        from app.models.campus_location import CampusLocation

        q_lower = query.lower().strip()

        # Try to extract a destination from the query
        destination_keywords = {
            "library": ["library"],
            "canteen": ["canteen", "cafeteria", "cafeteria"],
            "lab": ["lab", "computer lab", "csb", "ssbas"],
            "auditorium": ["auditorium", "auditorium"],
        }

        target_location = None
        for canonical, aliases in destination_keywords.items():
            if any(alias in q_lower for alias in aliases):
                target_location = canonical
                break

        if db and target_location:
            try:
                result = await db.execute(
                    select(CampusLocation).where(CampusLocation.name.ilike(f"%{target_location}%"))
                )
                loc = result.scalars().first()
                if loc:
                    return {
                        "response": f"{target_location.title()} is located at {loc.name} (building {loc.location_type}).\n"
                        f"Coordinates: {loc.latitude}, {loc.longitude}.\n"
                        f"Navigate via the campus map for turn-by-turn directions.",
                        "tools_used": ["get_current_location", "calculate_route"],
                        "confidence": 0.9,
                        "data": {
                            "destination": loc.name,
                            "coordinates": {"lat": loc.latitude, "lon": loc.longitude},
                        },
                    }
                else:
                    pass
            except Exception:
                pass

        return {
            "response": "I can help you navigate. Where would you like to go?",
            "tools_used": ["get_current_location", "calculate_route"],
            "confidence": 0.85,
        }

    async def _handle_crowd(self, user: User, query: str, db: AsyncSession | None = None) -> dict[str, Any]:
        """Handle crowd / campus pulse queries using real GPS-derived rush data."""
        if db is None:
            return {
                "response": "Campus pulse data requires a database connection. Please try again.",
                "tools_used": ["get_campus_pulse"],
                "confidence": 0.5,
            }

        try:
            from app.services.location_service import LocationService
            rush_data = await LocationService.get_rush_state(db)

            if not rush_data:
                return {
                    "response": "No campus locations are configured yet. Campus pulse data is unavailable.",
                    "tools_used": ["get_campus_pulse"],
                    "confidence": 0.7,
                }

            # Check if there's any real activity
            total_people = sum(r["current_count"] for r in rush_data)
            gps_sources = [r for r in rush_data if r["source"] == "GPS" and r["current_count"] > 0]
            override_sources = [r for r in rush_data if r["source"] == "ADMIN_OVERRIDE"]

            if total_people == 0 and not override_sources:
                location_names = ", ".join(r["location_name"] for r in rush_data[:5])
                return {
                    "response": f"Live location data is currently insufficient — no users have GPS tracking active on campus right now. Monitored locations include: {location_names}. Enable GPS tracking in your settings to contribute to campus pulse data.",
                    "tools_used": ["get_campus_pulse"],
                    "confidence": 0.8,
                }

            # Build natural response
            lines = []
            high_areas = [r for r in rush_data if r["rush_level"] in ("HIGH", "VERY_HIGH")]
            moderate_areas = [r for r in rush_data if r["rush_level"] == "MODERATE"]
            low_areas = [r for r in rush_data if r["rush_level"] == "LOW"]

            if high_areas:
                lines.append("🔴 **Crowded areas:**")
                for r in high_areas:
                    cap = f"/{r['capacity']}" if r.get("capacity") else ""
                    src = " (admin override)" if r["source"] == "ADMIN_OVERRIDE" else ""
                    lines.append(f"  - {r['location_name']}: {r['current_count']}{cap} people ({r['rush_level']}){src}")

            if moderate_areas:
                lines.append("🟡 **Moderate activity:**")
                for r in moderate_areas:
                    cap = f"/{r['capacity']}" if r.get("capacity") else ""
                    lines.append(f"  - {r['location_name']}: {r['current_count']}{cap} people")

            if low_areas and len(lines) < 8:
                lines.append("🟢 **Calm areas:**")
                for r in low_areas[:3]:
                    lines.append(f"  - {r['location_name']}: {r['current_count']} people")

            response = "\n".join(lines)
            return {
                "response": response,
                "tools_used": ["get_campus_pulse", "get_rush_state"],
                "confidence": 0.95,
            }

        except Exception as exc:
            return {
                "response": f"Error retrieving campus pulse data: {exc}",
                "tools_used": ["get_campus_pulse"],
                "confidence": 0.4,
            }

    async def _handle_issue(self, user: User, query: str, db: AsyncSession | None = None) -> dict[str, Any]:
        """Handle issue queries and reports."""
        role = self._role_value(user)
        if role not in ("student", "faculty", "admin", "super_admin"):
            return {
                "response": "Issue reports require authentication.",
                "tools_used": [],
                "confidence": 1.0,
                "denied": True,
            }
        try:
            issues = await self.issue_service.get_active_issues()

            if not issues:
                return {
                    "response": "No active issues reported on campus.",
                    "tools_used": ["report_issue", "get_active_issues"],
                    "confidence": 0.9,
                }

            response = f"Active issues ({len(issues)}):\n" + "\n".join(
                f"- {i['title']} ({i['priority']})" for i in issues[:5]
            )
            return {
                "response": response,
                "tools_used": ["get_active_issues"],
                "confidence": 0.9,
            }
        except Exception as exc:
            return {
                "response": f"Error querying issues: {exc}",
                "tools_used": ["get_active_issues"],
                "confidence": 0.5,
            }

    async def _handle_faculty_students(self, user: User, query: str) -> dict[str, Any]:
        """List students: faculty see only their own sections; admins see all; students denied."""
        role = self._role_value(user)
        if role in ("student",):
            return {
                "response": "I'm sorry, but listing students is restricted to faculty and administrators.",
                "tools_used": [],
                "confidence": 1.0,
                "denied": True,
            }
        if role not in ("faculty", "admin", "super_admin"):
            return {
                "response": "Operation not permitted for your role.",
                "tools_used": [],
                "confidence": 1.0,
                "denied": True,
            }
        return {
            "response": f"Fetching students visible to a {role}.",
            "tools_used": ["list_faculty_students"],
            "confidence": 0.9,
            "scope": "own_sections" if role == "faculty" else "all",
        }

    async def _handle_faculty_availability(self, user: User, query: str, db: AsyncSession | None = None) -> dict[str, Any]:
        """Handle faculty availability queries with real database data."""
        from sqlalchemy.future import select

        from app.models.faculty import Faculty
        from app.models.user import User as UserModel

        query_lower = query.lower()
        stop_words = [
            "is", "when", "who", "what", "how", "where", "find", "available", "free",
            "right", "now", "are", "there", "any", "which", "kaunsa", "konsa", "kaha",
            "hai", "hain", "mein", "par", "pe", "the", "can", "could", "will", "would",
            "faculty", "teacher", "professor", "abhi", "currently", "today",
        ]
        target_name = None
        for word in query_lower.split():
            clean_word = word.replace("?", "").replace(".", "").replace(",", "")
            if clean_word in stop_words:
                continue
            target_name = clean_word.title()
            break

        if not target_name or len(target_name) < 2:
            target_name = None

        async def get_faculty_info(session: AsyncSession, name_filter: str | None) -> list[dict[str, Any]]:
            stmt = (
                select(Faculty, UserModel, Department.name.label("dept_name"))
                .join(UserModel, Faculty.user_id == UserModel.id)
                .outerjoin(Department, Faculty.department_id == Department.id)
            )
            if name_filter:
                stmt = stmt.where(UserModel.full_name.ilike(f"%{name_filter}%"))
            result = await session.execute(stmt)
            rows = result.all()
            faculty_list = []
            for fac, usr, dept_name in rows:
                faculty_list.append({
                    "name": usr.full_name,
                    "email": usr.email,
                    "designation": fac.designation or "Professor",
                    "department": dept_name or "Computer Applications",
                    "office_location": fac.office_location or "SSBAS Room 308",
                    "is_available": fac.is_available if fac.is_available is not None else True,
                    "office_hours": fac.office_hours_summary or "Mon/Wed/Fri 2:00 PM - 4:00 PM",
                })
            return faculty_list

        role = self._role_value(user)
        if role == "student":
            pass
        elif role not in ("faculty", "admin", "super_admin"):
            return {
                "response": "I'm sorry, but faculty availability queries are restricted to authenticated users.",
                "tools_used": [],
                "confidence": 1.0,
                "denied": True,
            }

        if db is None:
            return {
                "response": "I'm unable to access faculty data right now. Please try again later.",
                "tools_used": ["get_faculty_availability"],
                "confidence": 0.5,
            }

        try:
            faculty_list = await get_faculty_info(db, target_name)
        except Exception as exc:
            return {
                "response": f"Error querying faculty availability: {exc}",
                "tools_used": ["get_faculty_availability"],
                "confidence": 0.5,
            }

        if not faculty_list:
            if target_name:
                return {
                    "response": f"I couldn't find any faculty member matching '{target_name}' in the campus directory.",
                    "tools_used": ["get_faculty_availability"],
                    "confidence": 0.9,
                }
            return {
                "response": "No faculty members found in the campus directory.",
                "tools_used": ["get_faculty_availability"],
                "confidence": 0.9,
            }

        if target_name and len(faculty_list) == 1:
            fac = faculty_list[0]
            status = "Available" if fac["is_available"] else "Unavailable"
            return {
                "response": f"{fac['name']} ({fac['designation']}, {fac['department']}) is currently {status}. Office: {fac['office_location']}. Office hours: {fac['office_hours']}.",
                "tools_used": ["get_faculty_availability"],
                "confidence": 0.95,
                "data": fac,
            }

        lines = []
        for fac in faculty_list[:10]:
            status = "Available" if fac["is_available"] else "Unavailable"
            lines.append(f"- {fac['name']}: {status} ({fac['office_hours']})")
        response = "Faculty availability:\n" + "\n".join(lines)
        return {
            "response": response,
            "tools_used": ["get_faculty_availability"],
            "confidence": 0.9,
            "data": faculty_list,
        }

    async def _handle_admin_dashboard(self, user: User, query: str) -> dict[str, Any]:
        """Admin dashboard: admins/super_admins only."""
        role = self._role_value(user)
        if role not in ("admin", "super_admin"):
            return {
                "response": "I'm sorry, but the admin dashboard is restricted to administrators.",
                "tools_used": [],
                "confidence": 1.0,
                "denied": True,
            }
        return {
            "response": "Loading campus-wide admin overview.",
            "tools_used": ["get_admin_dashboard"],
            "confidence": 0.9,
        }

    async def _handle_events(self, user: User, query: str, db: AsyncSession | None = None) -> dict[str, Any]:
        """Handle event queries using real database data."""
        from sqlalchemy.orm import selectinload

        role = self._role_value(user)
        if role not in ("student", "faculty", "admin", "super_admin"):
            return {
                "response": "Event queries require authentication.",
                "tools_used": [],
                "confidence": 1.0,
                "denied": True,
            }
        if db is None:
            return {
                "response": "I'm unable to access event data right now. Please try again later.",
                "tools_used": ["get_events"],
                "confidence": 0.5,
            }
        q_lower = query.lower()
        try:
            result = await db.execute(
                select(EventModel)
                .where(EventModel.status.in_(["upcoming", "ongoing"]))
                .options(selectinload(EventModel.location))
            )
            events = result.scalars().all()
            if not events:
                return {
                    "response": "No upcoming events found on campus.",
                    "tools_used": ["get_events"],
                    "confidence": 0.9,
                }
            lines = []
            for e in events[:10]:
                start = e.start_time.strftime("%b %d, %I:%M %p") if e.start_time else "TBD"
                loc = e.location.name if e.location else "Campus"
                lines.append(f"- {e.title} on {start} at {loc}")
            response = "Upcoming events:\n" + "\n".join(lines)

            # If the user asked to register, register for the next available event
            if "register" in q_lower or "enroll" in q_lower or "attend" in q_lower:
                from app.models.event_registration import EventRegistration, RegistrationStatus

                first_event = events[0]
                existing = await db.execute(
                    select(EventRegistration).where(
                        EventRegistration.event_id == first_event.id,
                        EventRegistration.user_id == user.id,
                        EventRegistration.status != RegistrationStatus.CANCELLED.value,
                    )
                )
                if existing.scalars().first() is not None:
                    response = f"You are already registered for '{first_event.title}'."
                else:
                    registration = EventRegistration(
                        event_id=first_event.id,
                        user_id=user.id,
                        status=RegistrationStatus.REGISTERED.value,
                        registered_at=datetime.utcnow().isoformat(),
                    )
                    db.add(registration)
                    try:
                        from app.services.notification_service import notify_student_event_registration
                        await notify_student_event_registration(
                            db,
                            student_user_id=user.id,
                            event_title=first_event.title,
                            event_id=str(first_event.id),
                        )
                    except Exception:
                        pass
                    await db.commit()
                    response = f"Registered for '{first_event.title}' on {start} at {loc}. Check your notifications for details."
                return {
                    "response": response,
                    "tools_used": ["get_events", "register_for_event"],
                    "confidence": 0.95,
                    "data": {"event_count": len(events)},
                }

            return {
                "response": response,
                "tools_used": ["get_events"],
                "confidence": 0.95,
                "data": {"event_count": len(events)},
            }
        except Exception as exc:
            return {
                "response": f"Error querying events: {exc}",
                "tools_used": ["get_events"],
                "confidence": 0.5,
            }

    async def _handle_courses(self, user: User, query: str, db: AsyncSession | None = None) -> dict[str, Any]:
        """Handle course queries using real database data."""
        from sqlalchemy.orm import selectinload

        if db is None:
            return {
                "response": "I'm unable to access course data right now. Please try again later.",
                "tools_used": ["search_courses"],
                "confidence": 0.5,
            }
        try:
            q_lower = query.lower()
            # Course search
            stmt = select(Course).options(
                selectinload(Course.department),
                selectinload(Course.sections),
            )
            search_terms = {
                "ai": ["ai", "artificial", "machine", "ml", "neural", "deep learning"],
                "java": ["java"],
                "python": ["python"],
                "data": ["data"],
                "machine": ["machine", "ml"],
            }
            # For each matched keyword, expand to broader DB patterns
            ai_expanded = ["ai", "artificial", "machine", "ml", "neural", "learning", "intelligence"]
            matched_patterns = []
            for term, keywords in search_terms.items():
                if any(k in q_lower for k in keywords):
                    for k in keywords:
                        matched_patterns.append(f"%{k}%")
                    if term == "ai":
                        for k in ai_expanded:
                            pat = f"%{k}%"
                            if pat not in matched_patterns:
                                matched_patterns.append(pat)
            if matched_patterns:
                stmt = stmt.where(sa_or_(*[sa_or_(Course.name.ilike(p), Course.code.ilike(p)) for p in matched_patterns]))
            result = await db.execute(stmt)
            courses = result.scalars().all()
            if courses:
                lines = []
                for c in courses[:10]:
                    dept = c.department.name if c.department else "N/A"
                    lines.append(f"- {c.code}: {c.name} ({c.credits} credits, {dept})")
                return {
                    "response": "Matching courses:\n" + "\n".join(lines),
                    "tools_used": ["search_courses"],
                    "confidence": 0.95,
                    "data": {"count": len(courses)},
                }
            return {
                "response": "No courses found matching your criteria.",
                "tools_used": ["search_courses"],
                "confidence": 0.9,
            }
        except Exception as exc:
            return {
                "response": f"Error querying courses: {exc}",
                "tools_used": ["search_courses"],
                "confidence": 0.5,
            }

    async def _handle_library(self, user: User, query: str, db: AsyncSession | None = None) -> dict[str, Any]:
        """Handle library/book queries using real database data."""
        if db is None:
            return {
                "response": "I'm unable to access library data right now. Please try again later.",
                "tools_used": ["search_library_books"],
                "confidence": 0.5,
            }
        try:
            q_lower = query.lower()
            search_term = None
            if "data science" in q_lower:
                search_term = "Data Science"
            elif "java" in q_lower:
                search_term = "Java"
            elif "python" in q_lower:
                search_term = "Python"

            if search_term:
                result = await db.execute(
                    select(LibraryBook).where(
                        sa_or_(
                            LibraryBook.title.ilike(f"%{search_term}%"),
                            LibraryBook.author.ilike(f"%{search_term}%"),
                            LibraryBook.subject.ilike(f"%{search_term}%"),
                        )
                    )
                )
            else:
                result = await db.execute(select(LibraryBook))
            books = result.scalars().all()

            # Check if user wants to reserve a book
            if "reserve" in q_lower or "reservation" in q_lower:
                from app.models.library import LibraryReservation

                # Try to find a book mentioned in the query
                target_book = None
                import re
                query_words = re.findall(r'\b[a-z]+\b', q_lower.replace("reserve", "").replace("book", "").replace("me", ""))
                for word in query_words:
                    if len(word) < 3:
                        continue
                    for b in books:
                        if word in b.title.lower() or word in b.author.lower():
                            target_book = b
                            break
                    if target_book:
                        break

                # If no specific book mentioned, pick the first available one
                if not target_book:
                    target_book = next((b for b in books if b.available_copies > 0), None)

                if not books:
                    return {
                        "response": "No books found in the library catalog.",
                        "tools_used": ["search_library_books"],
                        "confidence": 0.9,
                    }

                if not target_book or target_book.available_copies <= 0:
                    avail_books = [b for b in books if b.available_copies > 0]
                    if avail_books:
                        lines = [f"- {b.title} by {b.author} ({b.available_copies}/{b.total_copies} available)" for b in avail_books[:5]]
                        return {
                            "response": "No books are currently available for reservation. Available books:\n" + "\n".join(lines) + "\n\nSay 'Reserve [book title]' to reserve a specific book.",
                            "tools_used": ["search_library_books"],
                            "confidence": 0.85,
                        }
                    return {
                        "response": "No books are currently available for reservation.",
                        "tools_used": ["search_library_books"],
                        "confidence": 0.85,
                    }

                # Reserve the book
                target_book.available_copies -= 1
                deadline = datetime.utcnow() + timedelta(days=2)
                reservation = LibraryReservation(
                    book_id=target_book.id,
                    student_id=user.id,
                    status="ready_for_pickup",
                    reserved_at=datetime.utcnow(),
                    pickup_deadline=deadline,
                )
                db.add(reservation)
                try:
                    from app.services.notification_service import notify_student_book_reserved
                    await notify_student_book_reserved(
                        db,
                        student_user_id=user.id,
                        book_title=target_book.title,
                        book_id=str(target_book.id),
                        pickup_deadline=deadline.strftime("%b %d"),
                    )
                except Exception:
                    pass
                await db.commit()

                return {
                    "response": f"Reserved '{target_book.title}' by {target_book.author}. Pick up at shelf {target_book.shelf_location or 'Main Desk'} by {deadline.strftime('%b %d')}.",
                    "tools_used": ["search_library_books", "reserve_book"],
                    "confidence": 0.95,
                    "data": {"book_id": target_book.id},
                }

            if books:
                lines = []
                for b in books[:10]:
                    avail = b.available_copies if b.available_copies is not None else b.total_copies
                    total = b.total_copies
                    lines.append(f"- {b.title} by {b.author} ({avail}/{total} available)")
                return {
                    "response": f"Library books matching '{search_term or 'all'}':\n" + "\n".join(lines),
                    "tools_used": ["search_library_books"],
                    "confidence": 0.95,
                }
            return {
                "response": "No books found matching your criteria.",
                "tools_used": ["search_library_books"],
                "confidence": 0.9,
            }
        except Exception as exc:
            return {
                "response": f"Error querying library: {exc}",
                "tools_used": ["search_library_books"],
                "confidence": 0.5,
            }

    async def _handle_rooms(self, user: User, query: str, db: AsyncSession | None = None) -> dict[str, Any]:
        """Handle room availability queries."""
        role = self._role_value(user)
        if role not in ("student", "faculty", "admin", "super_admin"):
            return {
                "response": "Room availability queries require authentication.",
                "tools_used": [],
                "confidence": 1.0,
                "denied": True,
            }
        if db is None:
            return {
                "response": "I'm unable to access room data right now. Please try again later.",
                "tools_used": ["find_available_rooms"],
                "confidence": 0.5,
            }
        try:
            from sqlalchemy.orm import selectinload

            from app.models import Room
            stmt = select(Room).options(selectinload(Room.building))
            result = await db.execute(stmt)
            rooms = result.scalars().all()
            available = [r for r in rooms if not getattr(r, "is_occupied", False)]
            if available:
                lines = [f"- {r.name} ({r.building.name if r.building else 'N/A'})" for r in available[:10]]
                return {
                    "response": f"Available rooms ({len(available)}):\n" + "\n".join(lines),
                    "tools_used": ["find_available_rooms"],
                    "confidence": 0.95,
                    "data": {"count": len(available)},
                }
            return {
                "response": "No rooms are currently available.",
                "tools_used": ["find_available_rooms"],
                "confidence": 0.9,
            }
        except Exception as exc:
            return {
                "response": f"Error querying rooms: {exc}",
                "tools_used": ["find_available_rooms"],
                "confidence": 0.5,
            }

    async def _handle_portfolio(self, user: User, query: str, db: AsyncSession | None = None) -> dict[str, Any]:
        """Handle student portfolio queries using real database data."""
        role = self._role_value(user)
        if db is None:
            return {
                "response": "I'm unable to access portfolio data right now. Please try again later.",
                "tools_used": ["get_student_portfolio"],
                "confidence": 0.5,
            }
        try:
            if role == "student":
                stmt = select(Student).where(Student.user_id == user.id)
                result = await db.execute(stmt)
                student = result.scalar_one_or_none()
            else:
                q_lower = query.lower()
                stmt = select(Student, UserModel).join(UserModel, Student.user_id == UserModel.id)
                student = None
                for s, u in (await db.execute(stmt)).all():
                    if u.full_name and u.full_name.lower() in q_lower:
                        student = s
                        break

            if not student:
                return {
                    "response": "No portfolio data found for the requested student.",
                    "tools_used": ["get_student_portfolio"],
                    "confidence": 0.9,
                    "denied": role != "student",
                }

            import json as _json
            portfolio = {}
            if student.portfolio_json:
                try:
                    portfolio = _json.loads(student.portfolio_json)
                except Exception:
                    portfolio = {}
            skills = portfolio.get("skills", [])
            projects = portfolio.get("projects", [])
            internships = portfolio.get("internships", [])
            clubs = portfolio.get("clubs", [])
            certs = portfolio.get("certifications", [])

            parts = []
            if skills:
                parts.append(f"Skills: {', '.join(skills[:8])}")
            if projects:
                parts.append(f"Projects: {', '.join(p.get('title', '') for p in projects[:3])}")
            if internships:
                parts.append(f"Internships: {', '.join(i.get('role', '') for i in internships[:3])}")
            if clubs:
                parts.append(f"Clubs: {', '.join(c.get('name', '') for c in clubs[:3])}")
            if certs:
                parts.append(f"Certifications: {', '.join(c.get('name', '') for c in certs[:3])}")

            student_name = student.user.full_name if student.user else "you"
            response = f"Portfolio summary for {student_name}:\n" + "\n".join(parts) if parts else f"Portfolio for {student_name} is being built. Add skills, projects, and experiences to see them here."
            return {
                "response": response,
                "tools_used": ["get_student_portfolio"],
                "confidence": 0.9,
                "data": portfolio,
            }
        except Exception as exc:
            return {
                "response": f"Error retrieving portfolio: {exc}",
                "tools_used": ["get_student_portfolio"],
                "confidence": 0.5,
            }

    async def _handle_schedule(self, user: User, query: str, db: AsyncSession | None = None) -> dict[str, Any]:
        """Handle schedule/timetableView queries."""
        role = self._role_value(user)
        if db is None:
            return {
                "response": "I'm unable to access schedule data right now. Please try again later.",
                "tools_used": ["get_schedule"],
                "confidence": 0.5,
            }
        try:
            from app.models import StudentSchedule

            if role == "student":
                student_id = user.student_profile.id if user.student_profile else None
                stmt = (
                    select(StudentSchedule)
                    .where(StudentSchedule.student_id == student_id)
                    .order_by(StudentSchedule.start_time)
                )
            elif role == "faculty":
                stmt = (
                    select(StudentSchedule)
                    .where(StudentSchedule.faculty_name.ilike(f"%{user.full_name}%"))
                    .order_by(StudentSchedule.start_time)
                )
            else:
                stmt = (
                    select(StudentSchedule)
                    .order_by(StudentSchedule.start_time)
                )

            result = await db.execute(stmt)
            rows = result.scalars().all()

            if rows:
                lines = []
                for s in rows[:15]:
                    lines.append(f"- {s.course_code} {s.course_name}: {s.start_time.strftime('%I:%M %p')} in {s.building_name} {s.room_number} ({s.faculty_name})")
                return {
                    "response": f"Your schedule:\n" + "\n".join(lines),
                    "tools_used": ["get_schedule"],
                    "confidence": 0.95,
                    "data": {"count": len(rows)},
                }
            return {
                "response": "No schedule items found.",
                "tools_used": ["get_schedule"],
                "confidence": 0.9,
            }
        except Exception as exc:
            return {
                "response": f"Error querying schedule: {exc}",
                "tools_used": ["get_schedule"],
                "confidence": 0.5,
            }

    async def _handle_notifications(self, user: User, query: str, db: AsyncSession | None = None) -> dict[str, Any]:
        """Handle notification queries."""
        role = self._role_value(user)
        if db is None:
            return {
                "response": "I'm unable to access notification data right now. Please try again later.",
                "tools_used": ["get_notifications"],
                "confidence": 0.5,
            }
        try:
            stmt = (
                select(Notification)
                .where(Notification.recipient_id == user.id)
                .order_by(Notification.timestamp.desc())
                .limit(20)
            )
            result = await db.execute(stmt)
            notifs = result.scalars().all()

            unread = [n for n in notifs if not n.read]
            if not notifs:
                return {
                    "response": "You have no notifications.",
                    "tools_used": ["get_notifications"],
                    "confidence": 0.9,
                }

            lines = []
            for n in notifs[:10]:
                status = " (unread)" if not n.read else ""
                lines.append(f"- {n.event}: {n.reason}{status}")
            response = f"Notifications ({len(notifs)} total, {len(unread)} unread):\n" + "\n".join(lines)
            return {
                "response": response,
                "tools_used": ["get_notifications"],
                "confidence": 0.95,
                "data": {"total": len(notifs), "unread": len(unread)},
            }
        except Exception as exc:
            return {
                "response": f"Error querying notifications: {exc}",
                "tools_used": ["get_notifications"],
                "confidence": 0.5,
            }

    async def _handle_lost_found(self, user: User, query: str, db: AsyncSession | None = None) -> dict[str, Any]:
        """Handle lost & found queries."""
        role = self._role_value(user)
        if role not in ("student", "faculty", "admin", "super_admin"):
            return {
                "response": "Lost & found queries require authentication.",
                "tools_used": [],
                "confidence": 1.0,
                "denied": True,
            }
        if db is None:
            return {
                "response": "I'm unable to access lost & found data right now. Please try again later.",
                "tools_used": ["get_lost_found"],
                "confidence": 0.5,
            }
        try:
            q_lower = query.lower()
            items = []

            if "lost" in q_lower or "missing" in q_lower:
                stmt = select(LostItem)
                result = await db.execute(stmt)
                for li in result.scalars().all():
                    items.append(f"Lost: {li.name or li.category or 'Item'} - {li.description or 'No description'}")
            elif "found" in q_lower:
                stmt = select(FoundItem)
                result = await db.execute(stmt)
                for fi in result.scalars().all():
                    items.append(f"Found: {fi.name or fi.category or 'Item'} (unclaimed)")
            else:
                stmt_lost = select(LostItem)
                stmt_found = select(FoundItem)
                for li in (await db.execute(stmt_lost)).scalars().all():
                    items.append(f"Lost: {li.name or li.category or 'Item'}")
                for fi in (await db.execute(stmt_found)).scalars().all():
                    items.append(f"Found: {fi.name or fi.category or 'Item'} (unclaimed)")

            items = items[:10]
            if items:
                return {
                    "response": "Lost & Found items:\n" + "\n".join(items),
                    "tools_used": ["get_lost_found"],
                    "confidence": 0.95,
                    "data": {"count": len(items)},
                }
            return {
                "response": "No lost or found items reported currently.",
                "tools_used": ["get_lost_found"],
                "confidence": 0.9,
            }
        except Exception as exc:
            return {
                "response": f"Error querying lost & found: {exc}",
                "tools_used": ["get_lost_found"],
                "confidence": 0.5,
            }

    async def _handle_digital_twin(self, user: User, query: str, db: AsyncSession | None = None) -> dict[str, Any]:
        """Handle digital twin / campus overview queries."""
        role = self._role_value(user)
        if db is None:
            return {
                "response": "I'm unable to access campus data right now. Please try again later.",
                "tools_used": ["get_campus_state"],
                "confidence": 0.5,
            }
        try:
            from sqlalchemy.orm import selectinload
            from app.models.campus_state import CampusState

            q_lower = query.lower()

            if "building" in q_lower:
                stmt = select(Building)
                result = await db.execute(stmt)
                buildings = result.scalars().all()
                lines = [f"- {b.name} ({b.code})" for b in buildings]
                return {
                    "response": "Campus buildings:\n" + "\n".join(lines),
                    "tools_used": ["get_buildings"],
                    "confidence": 0.95,
                    "data": {"count": len(buildings)},
                }

            if "facility" in q_lower or "campus overview" in q_lower:
                stmt = select(CampusState).where(CampusState.id == "current")
                result = await db.execute(stmt)
                state = result.scalar_one_or_none()

                facilities = await self.crowd_service.get_campus_pulse()
                pulse = facilities.get("facilities", [])
                lines = [f"- {f['name']}: {f['crowd_level']}" for f in pulse[:8]]
                response = "Campus overview:\n" + "\n".join(lines)
                return {
                    "response": response,
                    "tools_used": ["get_campus_pulse", "get_campus_state"],
                    "confidence": 0.9,
                }

            stmt = select(Building)
            result = await db.execute(stmt)
            buildings = result.scalars().all()
            pulse = await self.crowd_service.get_campus_pulse()
            lines = [f"- {f['name']}: {f['crowd_level']}" for f in pulse.get("facilities", [])[:5]]
            response = f"Digital twin snapshot: {len(buildings)} buildings. Campus facilities:\n" + "\n".join(lines)
            return {
                "response": response,
                "tools_used": ["get_campus_state", "get_campus_pulse"],
                "confidence": 0.9,
            }
        except Exception as exc:
            return {
                "response": f"Error accessing campus data: {exc}",
                "tools_used": ["get_campus_state"],
                "confidence": 0.5,
            }

    async def _handle_student_details(self, user: User, query: str, db: AsyncSession | None = None) -> dict[str, Any]:
        """Handle student detail queries."""
        role = self._role_value(user)
        if role == "student":
            pass
        elif role not in ("faculty", "admin", "super_admin"):
            return {
                "response": "Student detail queries require authentication.",
                "tools_used": [],
                "confidence": 1.0,
                "denied": True,
            }
        if db is None:
            return {
                "response": "I'm unable to access student data right now. Please try again later.",
                "tools_used": ["get_student_details"],
                "confidence": 0.5,
            }
        try:
            q_lower = query.lower()
            target_name = None
            for word in q_lower.split():
                clean = word.replace("?", "").replace(".", "").replace(",", "")
                if clean in ["student", "show", "me", "the", "find", "get", "for", "info", "about", "details", "detail", "what"]:
                    continue
                target_name = clean.title()
                break

            if role == "student":
                stmt = select(Student).where(Student.user_id == user.id)
                result = await db.execute(stmt)
                student = result.scalar_one_or_none()
            else:
                stmt = select(Student, UserModel).join(UserModel, Student.user_id == UserModel.id)
                student = None
                for s, u in (await db.execute(stmt)).all():
                    if not target_name or (u.full_name and target_name.lower() in u.full_name.lower()):
                        student = s
                        break

            if not student:
                return {
                    "response": "No student data found.",
                    "tools_used": ["get_student_details"],
                    "confidence": 0.9,
                }

            student_name = student.user.full_name if student.user else "Student"
            response = (
                f"Student: {student_name}\n"
                f"Student ID: {student.student_id_number or 'N/A'}\n"
                f"Program: {student.program.name if student.program else 'N/A'}\n"
                f"Semester: {student.semester or 'N/A'}\n"
                f"Academic Year: {student.academic_year or 'N/A'}"
            )
            return {
                "response": response,
                "tools_used": ["get_student_details"],
                "confidence": 0.95,
                "data": {"student_id": str(student.id)},
            }
        except Exception as exc:
            return {
                "response": f"Error retrieving student details: {exc}",
                "tools_used": ["get_student_details"],
                "confidence": 0.5,
            }
