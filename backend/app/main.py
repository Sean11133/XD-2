"""FastAPI application entry point.

Startup order (wecpy 強制初始化順序):
1. ConfigManager init — 必須連續兩行最先執行（不得御）
2. LogManager        — 取得 logger
3. App assembly      — 其後才可匯入其他模組
"""
from __future__ import annotations

# ── wecpy 強制初始化順序（最先連續兩行，不可插入任何程式碼）─────────────────────
from wecpy.config_manager import ConfigManager
ConfigManager("config.yaml")

from wecpy.log_manager import LogManager
log = LogManager.get_logger()

# ── 其他 imports（必須在 wecpy 初始化之後）────────────────────────────────────
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import Base, engine
from app.routers import labels_router, nodes_router

# ── Settings ───────────────────────────────────────────────────────────────────
settings = get_settings()

# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.app_title,
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Middleware ────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global exception handler ───────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    log.error("Unhandled error on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "code": "INTERNAL_ERROR"},
    )


# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(nodes_router, prefix="/api")
app.include_router(labels_router, prefix="/api")

# ── DB table creation ──────────────────────────────────────────────────────────
# Import models so that Base.metadata is populated before create_all
import app.models as _models  # noqa: F401, E402

Base.metadata.create_all(bind=engine)

log.info("File Management API started — %s", settings.app_version)
