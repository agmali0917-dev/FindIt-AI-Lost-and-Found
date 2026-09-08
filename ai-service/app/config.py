"""AI Service Configuration"""

from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: Literal["development", "production", "test"] = "development"

    # CLIP Model
    CLIP_MODEL: str = "ViT-B-32"

    # Matching
    SIMILARITY_THRESHOLD: float = 0.85

    # Server callback
    SERVER_URL: str = "http://localhost:5000"
    SERVER_API_KEY: str = ""

    # Redis (optional)
    REDIS_URL: str = ""

    # Logging
    LOG_LEVEL: str = "INFO"

    # Gemini
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
