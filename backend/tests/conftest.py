"""Shared pytest fixtures."""
from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# wecpy 強制初始化順序（必須在任何 app.* 模組匯入之前執行）
os.environ.setdefault("IMX_ENV", "PILOT")
from wecpy.config_manager import ConfigManager
ConfigManager("config.yaml")

from app.database import Base, get_db
from app.main import app
import app.models as _models  # noqa: F401 — ensure all ORM models are registered


@pytest.fixture(scope="function")
def db_session() -> Session:
    """In-memory SQLite session, rolled back after each test.

    StaticPool ensures all connections share the same underlying
    connection, which is required for sqlite:///:memory: — otherwise
    each SQLAlchemy pool checkout gets an isolated empty database.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine)
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(engine)


@pytest.fixture(scope="function")
def client(db_session: Session) -> TestClient:
    """TestClient with DB dependency overridden to use in-memory session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
