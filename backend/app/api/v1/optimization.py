"""Optimization API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_db, require_admin
from app.schemas import OptimizationRunCreate, OptimizationResult

router = APIRouter()


@router.post("/run", response_model=OptimizationResult, tags=["optimization"])
async def run_optimization(
    optimization_in: OptimizationRunCreate,
    db: AsyncSession = Depends(get_current_db),
    _: None = Depends(require_admin),
):
    """Run optimization for a scenario."""
    return OptimizationResult(
        id="opt_001",
        run_id="run_001",
        solution={
            "allocations": [
                {"class_id": "class_1", "room_id": "room_302", "time": "14:00"},
            ],
            "score": 0.89,
            "disruption": "low",
        },
        score=0.89,
        verified=True,
        created_at="2024-01-15T10:00:00Z",
    )


@router.get("/results/{optimization_id}", response_model=OptimizationResult, tags=["optimization"])
async def get_optimization_results(
    optimization_id: str,
    db: AsyncSession = Depends(get_current_db),
):
    """Get optimization results."""
    return OptimizationResult(
        id=optimization_id,
        run_id="run_001",
        solution={"allocations": [], "score": 0.89},
        score=0.89,
        verified=True,
        created_at="2024-01-15T10:00:00Z",
    )
