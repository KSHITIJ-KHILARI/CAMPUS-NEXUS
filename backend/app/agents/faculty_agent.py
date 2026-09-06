"""Faculty Agent for Campus NEXUS."""

from typing import Any


class FacultyAgent:
    """Agent for faculty lookup and availability."""

    async def find_faculty(self, name: str, department: str | None = None) -> dict[str, Any]:
        """Find faculty member."""
        return {"faculty_id": "fac_001", "name": name, "department": department or "CS"}

    async def get_faculty_availability(self, faculty_id: str) -> dict[str, Any]:
        """Get faculty availability."""
        return {
            "faculty_id": faculty_id,
            "available_slots": [
                {"day": "Tuesday", "start": "09:00", "end": "12:00"},
                {"day": "Wednesday", "start": "14:00", "end": "17:00"},
            ],
        }

    async def get_faculty_current_location(self, faculty_id: str) -> dict[str, Any]:
        """Where is faculty now."""
        return {"faculty_id": faculty_id, "location": "Aurobindo", "room": "Room 302"}

    async def get_faculty_next_available(self, faculty_id: str) -> dict[str, Any]:
        """When is faculty next free."""
        return {"faculty_id": faculty_id, "next_available": "1:15 PM"}
