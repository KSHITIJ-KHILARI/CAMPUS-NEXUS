"""Optimization service for Campus NEXUS."""

from typing import Any

from ortools.sat.python import cp_model


class OptimizationService:
    """Service for optimization operations."""

    async def run_optimization(
        self,
        scenario: dict[str, Any],
        objective: str = "minimize_disruption",
    ) -> dict[str, Any]:
        """Run optimization for a scenario."""
        try:
            # Try to use OR-Tools if available
            return await self._run_with_ortools(scenario, objective)
        except Exception:
            # Fallback to simple heuristic
            return await self._run_heuristic(scenario, objective)

    async def _run_with_ortools(self, scenario: dict[str, Any], objective: str) -> dict[str, Any]:
        """Run optimization using Google OR-Tools."""
        model = cp_model.CpModel()

        # Simplified example - in production, use real constraints
        affected_classes = scenario.get("affected_classes", [])
        available_rooms = scenario.get("available_rooms", [])

        # Create variables
        assignments = {}
        for cls in affected_classes:
            for room in available_rooms:
                assignments[(cls, room)] = model.NewBoolVar(f"assign_{cls}_{room}")

        # Add constraints
        for cls in affected_classes:
            model.Add(sum(assignments[(cls, r)] for r in available_rooms) == 1)

        # Objective
        model.Minimize(sum(assignments.values()))

        # Solve
        solver = cp_model.CpSolver()
        status = solver.Solve(model)

        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            recommendations = []
            for (cls, room), var in assignments.items():
                if solver.Value(var):
                    recommendations.append({
                        "type": "room_change",
                        "class_id": cls,
                        "room_id": room,
                        "score": solver.ObjectiveValue(),
                    })
            return {
                "status": "optimal" if status == cp_model.OPTIMAL else "feasible",
                "recommendations": recommendations,
                "score": solver.ObjectiveValue(),
            }

        return {"status": "infeasible", "recommendations": [], "score": 0}

    async def _run_heuristic(self, scenario: dict[str, Any], objective: str) -> dict[str, Any]:
        """Run optimization using simple heuristic."""
        # Simple greedy assignment
        recommendations = []
        affected = scenario.get("affected_classes", [])
        available = scenario.get("available_rooms", [])

        for i, cls in enumerate(affected):
            if i < len(available):
                recommendations.append({
                    "type": "room_change",
                    "class_id": cls,
                    "room_id": available[i],
                    "score": 1.0,
                })

        return {
            "status": "heuristic",
            "recommendations": recommendations,
            "score": len(recommendations) / max(len(affected), 1),
        }
