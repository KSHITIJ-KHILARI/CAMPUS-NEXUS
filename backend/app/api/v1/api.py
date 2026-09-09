"""API v1 router aggregation.

Aggregates all v1 endpoint routers into a single router.
"""

from fastapi import APIRouter

from app.api.v1 import (
    ai,
    auth,
    digital_twin,
)

api_router = APIRouter()

# Include all routers
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(digital_twin.router, prefix="/digital-twin", tags=["digital-twin"])

__all__ = ["api_router"]
