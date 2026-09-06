"""Export all schemas."""

from app.schemas.user import User, UserCreate, UserUpdate, UserInDB, Token, TokenPayload
from app.schemas.auth import LoginRequest, RefreshTokenRequest, PasswordChange
from app.schemas.building import Building, BuildingCreate, BuildingUpdate, BuildingInDB, BuildingWithFloors
from app.schemas.room import Room, RoomCreate, RoomUpdate, RoomInDB, RoomAvailability
from app.schemas.timetable import (
    ClassSession, ClassSessionCreate, ClassSessionUpdate, ClassSessionInDB,
    Timetable, TimetableCreate, TimetableInDB,
    ScheduleEntry, StudentSchedule
)
from app.schemas.crowd import CrowdReport, CrowdReportCreate, CrowdReportInDB, CrowdState
from app.schemas.issue import Issue, IssueCreate, IssueReport, IssueReportCreate, IssueReportInDB, IssueCluster
from app.schemas.notification import Notification, NotificationCreate, NotificationInDB, NotificationPreference
from app.schemas.event import Event, EventCreate, EventUpdate, EventInDB, EventRegistration, EventRegistrationCreate
from app.schemas.campus_state import CampusState, CampusStateCreate, CampusStateUpdate, CampusStateInDB
from app.schemas.lost_found import LostItem, LostItemCreate, LostItemInDB, FoundItem, FoundItemCreate, FoundItemInDB, LostFoundMatch
from app.schemas.simulation import SimulationScenario, SimulationScenarioCreate, SimulationResult, OptimizationRunCreate, OptimizationResult

__all__ = [
    "User", "UserCreate", "UserUpdate", "UserInDB", "Token", "TokenPayload",
    "LoginRequest", "RefreshTokenRequest", "PasswordChange",
    "Building", "BuildingCreate", "BuildingUpdate", "BuildingInDB", "BuildingWithFloors",
    "Room", "RoomCreate", "RoomUpdate", "RoomInDB", "RoomAvailability",
    "ClassSession", "ClassSessionCreate", "ClassSessionUpdate", "ClassSessionInDB",
    "Timetable", "TimetableCreate", "TimetableInDB",
    "ScheduleEntry", "StudentSchedule",
    "CrowdReport", "CrowdReportCreate", "CrowdReportInDB", "CrowdState",
    "Issue", "IssueCreate", "IssueReport", "IssueReportCreate", "IssueReportInDB", "IssueCluster",
    "Notification", "NotificationCreate", "NotificationInDB", "NotificationPreference",
    "Event", "EventCreate", "EventUpdate", "EventInDB", "EventRegistration", "EventRegistrationCreate",
    "CampusState", "CampusStateCreate", "CampusStateUpdate", "CampusStateInDB",
    "LostItem", "LostItemCreate", "LostItemInDB", "FoundItem", "FoundItemCreate", "FoundItemInDB", "LostFoundMatch",
    "SimulationScenario", "SimulationScenarioCreate", "SimulationResult", "OptimizationRunCreate", "OptimizationResult",
]
