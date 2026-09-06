"""Database models for Campus NEXUS.

Defines SQLAlchemy ORM models for all campus entities.
"""

from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.admin import Admin
from app.models.department import Department
from app.models.program import Program
from app.models.course import Course
from app.models.course_section import CourseSection
from app.models.enrollment import Enrollment
from app.models.building import Building
from app.models.floor import Floor
from app.models.room import Room
from app.models.classroom import Classroom
from app.models.laboratory import Laboratory
from app.models.campus_location import CampusLocation
from app.models.facility import Facility
from app.models.lift import Lift, LiftStatusRecord
from app.models.lift_status import LiftStatus
from app.models.equipment import Equipment
from app.models.resource import Resource
from app.models.timetable import Timetable
from app.models.class_session import ClassSession
from app.models.room_booking import RoomBooking
from app.models.faculty_availability import FacultyAvailability
from app.models.student_schedule import StudentSchedule
from app.models.crowd_report import CrowdReport, SourceType, DensityLevel
from app.models.crowd_state import CrowdState
from app.models.buzz_post import BuzzPost
from app.models.issue import Issue
from app.models.issue_report import IssueReport
from app.models.issue_cluster import IssueCluster
from app.models.lost_item import LostItem
from app.models.found_item import FoundItem
from app.models.lost_found_match import LostFoundMatch
from app.models.event import Event
from app.models.event_registration import EventRegistration
from app.models.notification import Notification
from app.models.notification_preference import NotificationPreference
from app.models.campus_state import CampusState
from app.models.audit_log import AuditLog
from app.models.agent_execution import AgentExecution
from app.models.tool_execution import ToolExecution
from app.models.simulation import Simulation, SimulationScenario, SimulationResult, OptimizationRun, OptimizationResult
from app.models.library import LibraryBook, LibraryBookCopy, LibraryReservation, LibrarySeat
from app.models.learning_resource import LearningResource, ResourceBookmark
from app.models.faq import FAQEntry, KnowledgeDocument
from app.models.emergency import EmergencyReport
from app.models.presence import PresenceConsent
from app.models.user_location import UserLocationState
from app.models.admin_rush_override import AdminRushOverride

__all__ = [
    "User",
    "Student",
    "Faculty",
    "Admin",
    "Department",
    "Program",
    "Course",
    "CourseSection",
    "Enrollment",
    "Building",
    "Floor",
    "Room",
    "Classroom",
    "Laboratory",
    "CampusLocation",
    "Facility",
    "Lift",
    "LiftStatus",
    "LiftStatusRecord",
    "Equipment",
    "Resource",
    "Timetable",
    "ClassSession",
    "RoomBooking",
    "FacultyAvailability",
    "StudentSchedule",
    "CrowdReport",
    "CrowdState",
    "SourceType",
    "DensityLevel",
    "BuzzPost",
    "Issue",
    "IssueReport",
    "IssueCluster",
    "LostItem",
    "FoundItem",
    "LostFoundMatch",
    "Event",
    "EventRegistration",
    "Notification",
    "NotificationPreference",
    "CampusState",
    "AuditLog",
    "AgentExecution",
    "ToolExecution",
    "Simulation",
    "SimulationScenario",
    "SimulationResult",
    "OptimizationRun",
    "OptimizationResult",
    "LibraryBook",
    "LibraryBookCopy",
    "LibraryReservation",
    "LibrarySeat",
    "LearningResource",
    "ResourceBookmark",
    "FAQEntry",
    "KnowledgeDocument",
    "EmergencyReport",
    "PresenceConsent",
    "UserLocationState",
    "AdminRushOverride",
]
