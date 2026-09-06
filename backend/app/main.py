"""Campus NEXUS - FastAPI Application Entry Point.

This module creates and configures the FastAPI application instance,
including middleware, CORS, rate limiting, health checks, and API routers.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.api.v1.api import api_router
from app.core.websocket_routes import router as websocket_router
from app.core.database import get_session, init_db
from app.core.redis_client import is_redis_online, close_redis

logger = logging.getLogger(__name__)


# --------------------------------------------------------------------------- #
# Lifespan
# --------------------------------------------------------------------------- #

@asynccontextmanager
async def lifespan(application: FastAPI):
    """Application lifespan events."""
    # Startup
    from app.services.digital_twin_service import DigitalTwinService

    application.state.digital_twin = DigitalTwinService()

    # Check Redis status on startup
    redis_ok = await is_redis_online()

    if redis_ok:
        logger.info("Connected to Redis at %s", settings.REDIS_URL)
    else:
        logger.warning(
            "Redis is offline. Operating with graceful in-memory fallback "
            "in development mode."
        )

    # Security validation on startup
    if settings.is_production:
        insecure_keys = {
            "dev-secret-key",
            "dev-secret-key-change-in-production",
            "change-this-to-a-long-random-secret-key-minimum-32-characters",
        }

        if (
            settings.SECRET_KEY in insecure_keys
            or len(settings.SECRET_KEY) < 32
        ):
            logger.critical(
                "SECURITY ALERT: Running in PRODUCTION with insecure or "
                "short SECRET_KEY. Please set a strong SECRET_KEY in "
                "environment variables."
            )

    # Initialize database tables in development
    if settings.is_development:
        await init_db()
        logger.info("Database tables initialized")

    yield

    # Shutdown
    await close_redis()


# --------------------------------------------------------------------------- #
# Application factory
# --------------------------------------------------------------------------- #

def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""

    application = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "AI-powered Digital Twin and Campus Intelligence Platform "
            "for Somaiya Vidyavihar University"
        ),
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
        openapi_url="/openapi.json" if settings.is_development else None,
        lifespan=lifespan,
    )

    # ----------------------------------------------------------------------- #
    # Middleware
    # ----------------------------------------------------------------------- #

    # CORS
    #
    # Allow the deployed Campus NEXUS Vercel frontend.
    cors_origins = list(settings.BACKEND_CORS_ORIGINS)

    vercel_frontend_origin = "https://campus-nexus-seven.vercel.app"

    if vercel_frontend_origin not in cors_origins:
        cors_origins.append(vercel_frontend_origin)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Trusted host (security) - configured via ALLOWED_HOSTS
    if (
        settings.is_production
        and settings.ALLOWED_HOSTS
        and "*" not in settings.ALLOWED_HOSTS
    ):
        application.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.ALLOWED_HOSTS,
        )

    # Rate limiting (with development fallback)
    try:
        limiter = Limiter(
            key_func=get_remote_address,
            storage_uri=settings.REDIS_URL,
        )
    except Exception:
        limiter = Limiter(
            key_func=get_remote_address,
            storage_uri="memory://",
        )

    application.state.limiter = limiter

    application.add_exception_handler(
        RateLimitExceeded,
        _rate_limit_exceeded_handler,
    )

    # ----------------------------------------------------------------------- #
    # Routers
    # ----------------------------------------------------------------------- #

    application.include_router(api_router, prefix="/api/v1")
    application.include_router(websocket_router)

    # ----------------------------------------------------------------------- #
    # Health check
    # ----------------------------------------------------------------------- #

    @application.get("/health", tags=["health"])
    async def health_check(
        db: AsyncSession = Depends(get_session),
    ):
        """Health check endpoint reporting backend, database and Redis status."""

        db_status = "unavailable"

        try:
            await db.execute(text("SELECT 1"))
            db_status = "connected"
        except Exception as exc:
            logger.error("Health check DB error: %s", exc)
            db_status = "disconnected"

        redis_status = (
            "connected"
            if await is_redis_online()
            else "unavailable"
        )

        return {
            "status": (
                "healthy"
                if db_status == "connected"
                else "degraded"
            ),
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "database": db_status,
            "redis": redis_status,
        }

    @application.get(
        "/api/v1/health/auth",
        tags=["health"],
    )
    async def health_auth_alias(
        db: AsyncSession = Depends(get_session),
    ):
        """Safe auth health check alias."""

        return {
            "status": "auth_configured",
            "jwt_algorithm": settings.ALGORITHM,
            "auth_type": "Bearer JWT",
        }

    return application


# --------------------------------------------------------------------------- #
# Create app instance
# --------------------------------------------------------------------------- #

app = create_application()
