"""Issue Agent for Campus NEXUS."""

from typing import Any


class IssueAgent:
    """Agent for issue reporting and tracking."""

    async def report_issue(self, user_id: str, location: str, category: str, description: str) -> dict[str, Any]:
        """Report a new issue."""
        from app.services.issue_service import IssueService
        service = IssueService()
        return await service.report_issue(user_id, location, category, description)

    async def get_active_issues(self, location_id: str | None = None) -> list[dict[str, Any]]:
        """Get active issues."""
        from app.services.issue_service import IssueService
        service = IssueService()
        return await service.get_active_issues(location_id)

    async def get_issue_details(self, issue_id: str) -> dict[str, Any]:
        """Get issue details."""
        return {"id": issue_id, "status": "open"}

    async def cluster_similar_issues(self) -> dict[str, Any]:
        """Cluster similar issues."""
        from app.services.issue_service import IssueService
        service = IssueService()
        return await service.cluster_similar_issues()
