"""Health check router"""
from fastapi import APIRouter, Request
from pydantic import BaseModel
import torch

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
    clip_model: str


@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    """Health check endpoint for Docker and load balancers."""
    from app.config import settings
    clip = getattr(request.app.state, "clip", None)
    return HealthResponse(
        status="ok",
        model_loaded=clip is not None and clip.model is not None,
        device="cuda" if torch.cuda.is_available() else "cpu",
        clip_model=settings.CLIP_MODEL if clip and clip.model else "not loaded",
    )


@router.get("/")
async def root():
    return {"message": "FindIt AI Service", "version": "1.0.0", "docs": "/docs"}
