"""Simulation service for Campus NEXUS."""

from typing import Any

from app.models import SimulationScenario, Simulation, SimulationResult
from app.services.optimization_service import OptimizationService
from app.services.verification_agent import VerificationAgent


class SimulationService:
    """Service for running simulation scenarios."""

    def __init__(self) -> None:
        self.optimization_service = OptimizationService()
        self.verification_agent = VerificationAgent()

    async def run_simulation(self, scenario: dict[str, Any]) -> dict[str, Any]:
        """Run a simulation scenario."""
        # Create simulation record
        simulation = Simulation(
            scenario_id=scenario.get("id", "unknown"),
            created_by=scenario.get("created_by", "system"),
            status="running",
        )

        try:
            # 1. Get current campus state
            current_state = await self._get_current_state()

            # 2. Apply scenario transformation
            transformed_state = await self._apply_scenario(current_state, scenario)

            # 3. Analyze impact
            impact = await self._analyze_impact(transformed_state)

            # 4. Run optimization if needed
            recommendations = []
            if impact.get("requires_reallocation"):
                optimization_result = await self.optimization_service.run_optimization(
                    scenario=transformed_state,
                    objective="minimize_disruption",
                )
                recommendations = optimization_result.get("recommendations", [])

                # 5. Verify recommendations
                verified_recommendations = []
                for rec in recommendations:
                    is_valid = await self.verification_agent.verify_recommendation(rec)
                    if is_valid:
                        verified_recommendations.append(rec)

            # 6. Create result
            result = SimulationResult(
                simulation_id=str(simulation.id),
                impact=impact,
                recommendations=verified_recommendations,
                verified=all(
                    await self.verification_agent.verify_recommendation(rec)
                    for rec in verified_recommendations
                ),
            )

            simulation.status = "completed"
            simulation.result = str(result.dict())

            return {
                "simulation_id": str(simulation.id),
                "impact": impact,
                "recommendations": verified_recommendations,
                "verified": result.verified,
            }

        except Exception as e:
            simulation.status = "failed"
            raise

    async def _get_current_state(self) -> dict[str, Any]:
        """Get current campus state."""
        from app.services.digital_twin_service import DigitalTwinService
        dt = DigitalTwinService()
        return await dt.get_campus_state()

    async def _apply_scenario(self, state: dict[str, Any], scenario: dict[str, Any]) -> dict[str, Any]:
        """Apply scenario to current state."""
        # In production, clone state and apply changes
        return state

    async def _analyze_impact(self, state: dict[str, Any]) -> dict[str, Any]:
        """Analyze impact of scenario."""
        return {
            "affected_classes": 5,
            "affected_students": 127,
            "affected_faculty": 3,
            "resource_gaps": ["lab_computers", "projector"],
            "disruption_score": 0.72,
        }
