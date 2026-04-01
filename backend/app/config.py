"""Application settings — 透過 wecpy ConfigManager 讀取 config.yaml。

前提：呼叫此模組前，必須已在進入點（main.py / conftest.py）完成：
    from wecpy.config_manager import ConfigManager
    ConfigManager('config.yaml')
"""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

from wecpy.config_manager import ConfigManager


@dataclass
class Settings:
    database_url: str
    database_wal_mode: bool
    cors_allow_origins: list[str]
    app_debug: bool
    app_title: str
    app_version: str


@lru_cache
def get_settings() -> Settings:
    """讀取 ConfigManager.config_dict（PILOT/config.yaml 或 PROD/config.yaml），回傳 Settings 實例。

    ConfigManager 必須已於呼叫此函式前完成初始化（main.py / conftest.py 第一行）。
    wecpy 1.10.0 使用 ConfigManager.config_dict class attribute 存取完整設定字典。
    """
    cfg = ConfigManager.config_dict
    db_cfg = cfg.get("database", {})
    cors_cfg = cfg.get("cors", {})
    app_cfg = cfg.get("app", {})
    return Settings(
        database_url=str(db_cfg.get("url", "sqlite:///./file_management.db")),
        database_wal_mode=bool(db_cfg.get("wal_mode", True)),
        cors_allow_origins=list(cors_cfg.get("allow_origins", ["http://localhost:5173"])),
        app_debug=bool(app_cfg.get("debug", False)),
        app_title=str(app_cfg.get("title", "File Management API")),
        app_version=str(app_cfg.get("version", "1.0.0")),
    )
