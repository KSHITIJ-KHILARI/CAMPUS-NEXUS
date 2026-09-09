from pydantic import ConfigDict
"""Pydantic schemas for Simulation and Optimization models."""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List


class SimulationScenarioBase(BaseModel):
    """Base simulation scenario schema."""
    name: str
    scenario_type: str
    parameters: Dict[str, Any]
    created_by: int


class SimulationScenarioCreate(SimulationScenarioBase):
    """Schema for creating a simulation scenario."""
    pass


class SimulationScenario(SimulationScenarioBase):
    """Schema for simulation scenario response."""
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SimulationResultBase(BaseModel):
    """Base simulation result schema."""
    scenario_id: str
    impact: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    verified: bool


class SimulationResult(SimulationResultBase):
    """Schema for simulation result response."""
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OptimizationRunBase(BaseModel):
    """Base optimization run schema."""
    scenario_id: str
    objective: str
    constraints: Dict[str, Any]


class OptimizationRunCreate(OptimizationRunBase):
    """Schema for creating an optimization run."""
    pass


class OptimizationResult(BaseModel):
    """Schema for optimization result response."""
    id: str
    run_id: str
    solution: Dict[str, Any]
    score: float
    verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
