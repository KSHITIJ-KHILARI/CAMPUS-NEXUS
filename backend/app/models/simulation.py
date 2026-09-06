"""Simulation and Optimization models for Campus NEXUS."""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base, GUID


class Simulation(Base):
    """Simulation run entity."""

    __tablename__ = "simulations"

    id = Column(String, primary_key=True, index=True)
    scenario_id = Column(String, ForeignKey("simulation_scenarios.id"), nullable=False)
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="running")  # running, completed, failed
    result = Column(String)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    # Relationships
    scenario = relationship("SimulationScenario")
    creator = relationship("User")


class SimulationScenario(Base):
    """Simulation scenario definition."""

    __tablename__ = "simulation_scenarios"

    id = Column(String, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    scenario_type = Column(String(100), nullable=False)
    parameters = Column(String)  # JSON string
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User")
    simulations = relationship("Simulation", back_populates="scenario")


class SimulationResult(Base):
    """Simulation result entity."""

    __tablename__ = "simulation_results"

    id = Column(String, primary_key=True, index=True)
    simulation_id = Column(String, ForeignKey("simulations.id"), nullable=False)
    impact = Column(String)  # JSON string
    recommendations = Column(String)  # JSON array
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    simulation = relationship("Simulation")


class OptimizationRun(Base):
    """Optimization run entity."""

    __tablename__ = "optimization_runs"

    id = Column(String, primary_key=True, index=True)
    scenario_id = Column(String, ForeignKey("simulation_scenarios.id"), nullable=False)
    objective = Column(String(255), nullable=False)
    constraints = Column(String)  # JSON string
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="running")
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    # Relationships
    scenario = relationship("SimulationScenario")
    creator = relationship("User")


class OptimizationResult(Base):
    """Optimization result entity."""

    __tablename__ = "optimization_results"

    id = Column(String, primary_key=True, index=True)
    run_id = Column(String, ForeignKey("optimization_runs.id"), nullable=False)
    solution = Column(String)  # JSON string
    score = Column(Float, nullable=False)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    run = relationship("OptimizationRun")
