from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings and environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # API Keys
    OPENAI_API_KEY: str
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    GOOGLE_API_KEY: str

    # Model Configuration
    GEMINI_MODEL_ID: str = "gemini-2.5-flash-lite"

    # FastAPI Settings
    API_TITLE: str = "ApplyFlow API"
    API_VERSION: str = "1.0.0"

    # Session Storage Settings
    USE_S3_SESSION_STORAGE: bool = False  # Set to True for production
    S3_SESSION_BUCKET: str = "applyflow-session-storage"
    AWS_REGION: str = "us-east-1"


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.

    Using lru_cache ensures we only create one Settings instance
    throughout the application lifecycle.
    """
    return Settings()  # type: ignore


# Convenience instance for easy importing
settings = get_settings()
