"""Orchestrator Agent for Campus NEXUS."""

from typing import Any
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.agents.navigation_agent import NavigationAgent
from app.agents.schedule_agent import ScheduleAgent
from app.agents.pulse_agent import PulseAgent
from app.agents.resource_agent import ResourceAgent
from app.agents.faculty_agent import FacultyAgent
from app.agents.issue_agent import IssueAgent
from app.models.user import User
from app.services.ai_orchestrator_service import AIOrchestratorService


class OrchestratorAgent:
    """Central orchestrator for NEXUS AI."""

    def __init__(self) -> None:
        self.ai_service = AIOrchestratorService()
        self.agents = {
            "navigation": NavigationAgent(),
            "schedule": ScheduleAgent(),
            "pulse": PulseAgent(),
            "resource": ResourceAgent(),
            "faculty": FacultyAgent(),
            "issue": IssueAgent(),
        }

    async def process(
        self,
        user_id: str | uuid.UUID,
        query: str,
        context: dict[str, Any] | None = None,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """Process a user query through the appropriate agent.

        If a DB session is provided, the user is fetched so the AI service
        can perform role-based authorization.
        """
        if db is not None:
            try:
                user_uuid = user_id if isinstance(user_id, uuid.UUID) else uuid.UUID(str(user_id))
            except (ValueError, TypeError):
                user_uuid = None
            if user_uuid is not None:
                res = await db.execute(select(User).where(User.id == user_uuid))
                user = res.scalar_one_or_none()
                if user is not None:
                    return await self.ai_service.process_query(user=user, query=query, context=context)

        # Fallback: no role info available, run without authorization checks
        return await self.ai_service.process_query(_AnonymousUser(user_id), query=query, context=context)


class _AnonymousUser:
    """Lightweight user-like object for callers that don't supply DB context."""

    def __init__(self, user_id: Any) -> None:
        self.id = user_id
        self.role = "anonymous"
