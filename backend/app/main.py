"""Campus NEXUS - FastAPI Application Entry Point.

This module creates and configures the FastAPI application instance,
including middleware, CORS, rate limiting, health checks, and API routers.
"""

import logging
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings
from app.api.v1.api import api_router
from app.core.websocket_routes import router as websocket_router

logger = logging.getLogger(__name__)


# --------------------------------------------------------------------------- #
# Lifespan
# --------------------------------------------------------------------------- #

@asynccontextmanager
async def lifespan(application: FastAPI):
    """Application lifespan events."""
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

    yield


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
    # Allow local development origins and deployed Campus NEXUS Vercel frontends.
    cors_origins = list(settings.BACKEND_CORS_ORIGINS)

    known_vercel_origins = [
        "https://campus-nexus-git-main-kstroy.vercel.app",
        "https://campus-nexus-seven.vercel.app",
        "https://campus-nexus.vercel.app",
    ]

    for origin in known_vercel_origins:
        if origin not in cors_origins:
            cors_origins.append(origin)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
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

    @application.get("/", tags=["health"])
    async def root():
        """Root endpoint for basic health checks."""
        return {
            "status": "online",
            "message": "Campus NEXUS API is running. Access /docs for API documentation."
        }

    @application.get("/health", tags=["health"])
    async def health_check():
        """Health check endpoint."""

        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        }

    @application.get(
        "/api/v1/health/auth",
        tags=["health"],
    )
    async def health_auth_alias():
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
