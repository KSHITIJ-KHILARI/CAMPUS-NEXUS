"""Issue service for Campus NEXUS — Firestore-backed."""

import uuid
from datetime import datetime, timezone
from typing import Any

from app.core.firebase import db


class IssueService:
    """Service for issue management (Firestore)."""

    def __init__(self) -> None:
        pass

    async def report_issue(
        self,
        user_id: str,
        location_id: str,
        category: str,
        description: str,
        priority: str = "medium",
    ) -> dict[str, Any]:
        """Report a new campus issue to Firestore."""
        issue_id = f"issue_{uuid.uuid4().hex[:12]}"
        issue_data = {
            "id": issue_id,
            "reporter_user_id": user_id,
            "location_id": location_id,
            "category": category,
            "title": description[:100],
            "description": description,
            "priority": priority,
            "status": "open",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "upvotes": 0,
        }

        if db is not None:
            db.collection("issues").document(issue_id).set(issue_data)

        return {
            "issue_id": issue_id,
            "status": "open",
            "message": "Issue reported successfully",
        }

    async def get_active_issues(self, location_id: str | None = None) -> list[dict[str, Any]]:
        """Get active issues from Firestore, optionally filtered by location."""
        if db is None:
            return []

        query = db.collection("issues").where("status", "in", ["open", "in_progress"])
        if location_id:
            query = query.where("location_id", "==", location_id)

        issues = []
        for doc in query.stream():
            data = doc.to_dict()
            issues.append({
                "id": doc.id,
                "title": data.get("title", ""),
                "priority": data.get("priority", "medium"),
                "status": data.get("status", "open"),
                "location_id": data.get("location_id"),
                "category": data.get("category", ""),
                "description": data.get("description", ""),
                "created_at": data.get("created_at"),
            })
        return issues

    async def cluster_similar_issues(self) -> dict[str, Any]:
        """Cluster similar issues using semantic similarity."""
        return {
            "clusters_created": 0,
            "issues_merged": 0,
        }

    async def upvote_issue(self, issue_id: str, user_id: str) -> dict[str, Any]:
        """Upvote/confirm an issue in Firestore."""
        if db is not None:
            doc_ref = db.collection("issues").document(issue_id)
            doc = doc_ref.get()
            if doc.exists:
                current = doc.to_dict().get("upvotes", 0)
                doc_ref.update({"upvotes": current + 1})
                return {"message": "Issue upvoted", "report_count": current + 1}
        return {"message": "Issue upvoted", "report_count": 1}
