"""Application configuration using Pydantic Settings.

Centralises all environment variables and runtime settings for the
Campus Nexus backend.
"""

import os
from functools import lru_cache
from typing import Any

from pydantic import AnyHttpUrl, Field, field_validator
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
    ENVIRONMENT: str = Field("development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=False, env="DEBUG")

    # --- Database ---
    DATABASE_URL: str = Field(
        "postgresql+asyncpg://campus_nexus:campus_nexus_pass@localhost:5432/campus_nexus",
        env="DATABASE_URL",
    )

    @property
    def SYNC_DATABASE_URL(self) -> str:
        """Return a synchronous database URL for Alembic / migrations."""
        return self.DATABASE_URL.replace("asyncpg", "psycopg2")

    # --- Redis ---
    REDIS_URL: str = Field("redis://localhost:6379/0", env="REDIS_URL")
    REDIS_MAX_CONNECTIONS: int = Field(20, env="REDIS_MAX_CONNECTIONS")

    # --- Security & Hosts ---
    SECRET_KEY: str = Field("dev-secret-key-change-in-production", env="SECRET_KEY")
    ALGORITHM: str = Field("HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(1440, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(7, env="REFRESH_TOKEN_EXPIRE_DAYS")
    BCRYPT_ROUNDS: int = Field(12, env="BCRYPT_ROUNDS")

    ALLOWED_HOSTS: list[str] = Field(
        default_factory=lambda: ["*"],
        env="ALLOWED_HOSTS",
    )

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
        return ["*"]

    # --- CORS ---
    BACKEND_CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"],
        env="BACKEND_CORS_ORIGINS",
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
        return ["*"]

    # --- Rate Limiting ---
    RATE_LIMIT_ENABLED: bool = Field(True, env="RATE_LIMIT_ENABLED")
    RATE_LIMIT_DEFAULT: str = Field("100/minute", env="RATE_LIMIT_DEFAULT")
    RATE_LIMIT_AUTH: str = Field("10/minute", env="RATE_LIMIT_AUTH")

    # --- AI & Ollama ---
    OLLAMA_BASE_URL: str = Field("http://localhost:11434", env="OLLAMA_BASE_URL")
    OLLAMA_MODEL: str = Field("gemma4:12b-mlx", env="OLLAMA_MODEL")
    LLM_MODEL: str = Field("gpt-4o", env="LLM_MODEL")
    LLM_PROVIDER: str | None = Field(None, env="LLM_PROVIDER")
    OPENROUTER_BASE_URL: str = Field("https://openrouter.ai/api/v1", env="OPENROUTER_BASE_URL")

    # --- Features ---
    ENABLE_WEBSOCKETS: bool = Field(True, env="ENABLE_WEBSOCKETS")
    ENABLE_SIMULATION: bool = Field(True, env="ENABLE_SIMULATION")
    ENABLE_OPTIMIZATION: bool = Field(True, env="ENABLE_OPTIMIZATION")
    ENABLE_NOTIFICATIONS: bool = Field(True, env="ENABLE_NOTIFICATIONS")
    ENABLE_AUDIT_LOG: bool = Field(True, env="ENABLE_AUDIT_LOG")

    # --- External Services ---
    NEXUS_API_KEY: str | None = Field(None, env="NEXUS_API_KEY")
    GOOGLE_MAPS_API_KEY: str | None = Field(None, env="GOOGLE_MAPS_API_KEY")
    OPENAI_API_KEY: str | None = Field(None, env="OPENAI_API_KEY")

    # --- Supabase ---
    SUPABASE_URL: str | None = Field(None, env="SUPABASE_URL")
    SUPABASE_SECRET_KEY: str | None = Field(None, env="SUPABASE_SECRET_KEY")
    SUPABASE_ANON_KEY: str | None = Field(None, env="SUPABASE_ANON_KEY")

    @property
    def EFFECTIVE_AI_KEY(self) -> str | None:
        """Return NEXUS_API_KEY as single source of truth, fallback to OPENAI_API_KEY."""
        return self.NEXUS_API_KEY or self.OPENAI_API_KEY

    # --- Geospatial ---
    DEFAULT_SEARCH_RADIUS_METERS: int = Field(500, env="DEFAULT_SEARCH_RADIUS_METERS")

    # --- Email ---
    SMTP_HOST: str | None = Field(None, env="SMTP_HOST")
    SMTP_PORT: int | None = Field(None, env="SMTP_PORT")
    SMTP_USER: str | None = Field(None, env="SMTP_USER")
    SMTP_PASSWORD: str | None = Field(None, env="SMTP_PASSWORD")
    FROM_EMAIL: str = Field("noreply@campus-nexus.local", env="FROM_EMAIL")

    # --- Logging ---
    LOG_LEVEL: str = Field("INFO", env="LOG_LEVEL")

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
