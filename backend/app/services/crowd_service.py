"""Crowd intelligence service for Campus NEXUS."""

import uuid
from datetime import datetime, timedelta
from typing import Any

from app.models import CrowdReport, CrowdState, CampusLocation, SourceType, DensityLevel


class CrowdService:
    """Service for crowd intelligence."""

    async def get_crowd_status(self, location_id: str) -> dict[str, Any]:
        """Get crowd status for a location."""
        # In production, aggregate reports and compute confidence
        return {
            "location_id": location_id,
            "crowd_level": "moderate",
            "confidence": 0.85,
            "report_count": 12,
            "last_updated": datetime.utcnow().isoformat(),
        }

    async def get_campus_pulse(self) -> dict[str, Any]:
        """Get overall campus pulse."""
        return {
            "overall_status": "moderate",
            "buildings": [
                {"name": "SSBAS", "crowd_level": "moderate", "occupancy": 67},
                {"name": "Aurobindo", "crowd_level": "moderate", "occupancy": 72},
                {"name": "Bhaskaracharya", "crowd_level": "low", "occupancy": 45},
            ],
            "facilities": [
                {"name": "Canteen", "crowd_level": "high", "wait_time": "15 min"},
                {"name": "Library", "crowd_level": "low", "occupancy": 23},
            ],
            "last_updated": datetime.utcnow().isoformat(),
        }

    async def submit_report(
        self,
        user_id: str,
        location_id: str,
        level: str,
        context: str | None = None,
        count: int = 1,
        capacity: int | None = None,
        confidence_score: float | None = None,
        source: str | None = None,
        notes: str | None = None,
    ) -> dict[str, Any]:
        """Submit a crowd report using CrowdReport model fields."""
        try:
            density = DensityLevel(level)
        except ValueError:
            density = DensityLevel.MODERATE

        try:
            src = SourceType(source) if source else SourceType.USER
        except ValueError:
            src = SourceType.USER

        report = CrowdReport(
            location_id=int(location_id) if location_id else None,
            reported_by_user_id=uuid.UUID(user_id) if user_id else None,
            count=count,
            capacity=capacity,
            density_level=density.value,
            confidence_score=confidence_score,
            source=src.value,
            reported_at=datetime.utcnow().isoformat(),
            notes=notes if notes is not None else context,
            is_verified=False,
        )

        # In production, save to database and recalculate crowd state
        confidence = await self._calculate_confidence(location_id, level)

        return {
            "report_id": str(report.id),
            "confidence": confidence,
            "message": "Report submitted successfully",
        }

    async def _calculate_confidence(self, location_id: str, level: str) -> float:
        """Calculate confidence score for a crowd report."""
        # In production, use weighted algorithm with recency, user reliability, agreement
        return 0.85
