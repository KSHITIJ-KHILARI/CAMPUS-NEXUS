"""API v1 router aggregation.

Aggregates all v1 endpoint routers into a single router.
"""

from fastapi import APIRouter

from app.api.v1 import (
    auth,
    students,
    faculty,
    admin,
    buildings,
    rooms,
    timetable,
    navigation,
    pulse,
    issues,
    events,
    notifications,
    simulation,
    optimization,
    ai,
    lost_found,
    library,
    courses,
    resources,
    faq,
    emergency,
    presence,
    digital_twin,
    location,
)

api_router = APIRouter()

# Include all routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(faculty.router, prefix="/faculty", tags=["faculty"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(buildings.router, prefix="/buildings", tags=["buildings"])
api_router.include_router(rooms.router, prefix="/rooms", tags=["rooms"])
api_router.include_router(timetable.router, prefix="/timetable", tags=["timetable"])
api_router.include_router(navigation.router, prefix="/navigation", tags=["navigation"])
api_router.include_router(pulse.router, prefix="/pulse", tags=["pulse"])
api_router.include_router(issues.router, prefix="/issues", tags=["issues"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(simulation.router, prefix="/simulation", tags=["simulation"])
api_router.include_router(optimization.router, prefix="/optimization", tags=["optimization"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(lost_found.router, prefix="/lost-found", tags=["lost-found"])
api_router.include_router(lost_found.admin_router, prefix="/admin/lost-found", tags=["admin-lost-found"])
api_router.include_router(library.router, prefix="/library", tags=["library"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(resources.router, prefix="/resources", tags=["resources"])
api_router.include_router(faq.router, prefix="/faq", tags=["faq"])
api_router.include_router(emergency.router, prefix="/emergency", tags=["emergency"])
api_router.include_router(presence.router, prefix="/presence", tags=["presence"])
api_router.include_router(digital_twin.router, prefix="/digital-twin", tags=["digital-twin"])
api_router.include_router(location.router, prefix="/location", tags=["location"])

__all__ = ["api_router"]
