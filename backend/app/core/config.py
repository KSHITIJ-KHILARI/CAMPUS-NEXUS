"""Application configuration using Pydantic Settings.

Centralises all environment variables and runtime settings for the
Campus Nexus backend.
"""

from functools import lru_cache
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env."""

    model_config = SettingsConfigDict(
        env_file=(".env.local", "../.env.local", ".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Application ---
    APP_NAME: str = "Campus Nexus"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # --- Database (Firebase/Firestore — no SQL database required) ---
    # All data persistence uses Google Cloud Firestore via firebase-admin SDK.
    # See app/core/firebase.py for the Firestore client singleton.

    # --- Security & Hosts ---
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BCRYPT_ROUNDS: int = 12

    ALLOWED_HOSTS: list[str] = Field(default_factory=lambda: ["*", "localhost", "127.0.0.1", "campus-nexus-6z4h.onrender.com"])

    @field_validator("ALLOWED_HOSTS", mode="before")
    @classmethod
    def parse_allowed_hosts(cls, v: Any) -> list[str]:
        """Parse allowed hosts from a string or list."""
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except (json.JSONDecodeError, ValueError):
                return [s.strip() for s in v.strip("[]").split(",") if s.strip()]
        if isinstance(v, list):
            return v
        return ["*", "localhost", "127.0.0.1", "campus-nexus-6z4h.onrender.com"]

    # --- CORS ---
    BACKEND_CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000", 
            "http://localhost:5173", 
            "http://127.0.0.1:3000",
            "https://campus-nexus-v2.vercel.app",
            "https://campusnexus-two.vercel.app"
        ]
    )

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        """Parse CORS origins from a string or list."""
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except (json.JSONDecodeError, ValueError):
                return [s.strip() for s in v.strip("[]").split(",") if s.strip()]
        if isinstance(v, list):
            return v
        return [
            "http://localhost:3000", 
            "http://localhost:5173", 
            "http://127.0.0.1:3000",
            "https://campus-nexus-v2.vercel.app",
            "https://campusnexus-two.vercel.app"
        ]

    # --- Rate Limiting ---
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_DEFAULT: str = "100/minute"
    RATE_LIMIT_AUTH: str = "10/minute"

    # --- AI & Ollama ---
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma4:12b-mlx"
    LLM_MODEL: str = "gpt-4o"
    LLM_PROVIDER: str | None = None
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # --- Features ---
    ENABLE_WEBSOCKETS: bool = True
    ENABLE_SIMULATION: bool = True
    ENABLE_OPTIMIZATION: bool = True
    ENABLE_NOTIFICATIONS: bool = True
    ENABLE_AUDIT_LOG: bool = True

    # --- External Services ---
    NEXUS_API_KEY: str | None = None
    GOOGLE_MAPS_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None

    # --- Supabase ---
    SUPABASE_URL: str | None = None
    SUPABASE_SECRET_KEY: str | None = None
    SUPABASE_ANON_KEY: str | None = None

    @property
    def EFFECTIVE_AI_KEY(self) -> str | None:
        """Return NEXUS_API_KEY as single source of truth, fallback to OPENAI_API_KEY."""
        return self.NEXUS_API_KEY or self.OPENAI_API_KEY

    # --- Geospatial ---
    DEFAULT_SEARCH_RADIUS_METERS: int = 500

    # --- Email ---
    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    FROM_EMAIL: str = "noreply@campus-nexus.local"

    # --- Logging ---
    LOG_LEVEL: str = "INFO"

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ENVIRONMENT.lower() == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.ENVIRONMENT.lower() in ("development", "dev")


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()


settings: Settings = get_settings()
