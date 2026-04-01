"""Application settings — reads from wecpy ConfigManager."""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = Field(default="sqlite:///./file_management.db")
    database_wal_mode: bool = Field(default=True)
    cors_allow_origins: list[str] = Field(default=["http://localhost:5173"])
    app_debug: bool = Field(default=False)
    app_title: str = Field(default="File Management API")
    app_version: str = Field(default="1.0.0")

    model_config = {"env_prefix": "APP_", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
