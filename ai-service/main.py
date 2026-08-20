"""
FindIt AI Service – Main Application Entry Point
FastAPI + CLIP-based image matching service
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.routers import match, health, embeddings
from app.services.clip_service import CLIPService

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("findit.ai")


# ─── App Lifespan ─────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load CLIP model on startup, clean up on shutdown."""
    logger.info("🚀 Starting FindIt AI Service...")
    logger.info(f"📦 Loading CLIP model: {settings.CLIP_MODEL}")
    clip = CLIPService()
    await clip.load_model()
    app.state.clip = clip
    logger.info("✅ CLIP model loaded and ready!")
    yield
    logger.info("🛑 Shutting down AI Service...")


# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="FindIt AI Service",
    description="AI-powered image matching service using CLIP embeddings for the FindIt platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── Middleware ───────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.SERVER_URL, "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(health.router, tags=["Health"])
app.include_router(match.router, prefix="/match", tags=["Matching"])
app.include_router(embeddings.router, prefix="/embeddings", tags=["Embeddings"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        workers=1,  # Single worker for GPU model
    )
