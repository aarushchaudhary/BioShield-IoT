"""
Application configuration loaded from environment variables.
Uses pydantic-settings to validate and parse .env values.
The app will crash on startup if any required variable is missing.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """BioShield IoT application settings.

    All required fields have no default — pydantic-settings will raise
    a ValidationError (crashing the app) if they are absent from the
    environment or .env file.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Database ──────────────────────────────────────────────────────
    DATABASE_URL: str

    # ── Redis ─────────────────────────────────────────────────────────
    REDIS_URL: str
    REDIS_PASSWORD: str = ""

    # ── Security ──────────────────────────────────────────────────────
    PASETO_SECRET_KEY: str
    AES_MASTER_KEY: str

    # ── Token ─────────────────────────────────────────────────────────
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60, ge=1)

    # ── CORS ──────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:*"
    
    # ── Server ────────────────────────────────────────────────────────
    SERVER_HOST: str = "0.0.0.0"  # Listen on all interfaces
    SERVER_PORT: int = 8000

    # ── Environment ───────────────────────────────────────────────────
    ENVIRONMENT: str = "development"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


# Singleton — imported throughout the app
settings = Settings()
