"""Embeddings router – generate and cache embeddings for items"""
import logging
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import List, Optional

logger = logging.getLogger("findit.embeddings")
router = APIRouter()


class EmbedImageRequest(BaseModel):
    image_url: str
    item_id: Optional[str] = None


class EmbedTextRequest(BaseModel):
    title: str
    category: str = ""
    brand: str = ""
    color: str = ""
    description: str = ""


class EmbeddingResponse(BaseModel):
    embedding: List[float]
    dimension: int


@router.post("/image", response_model=EmbeddingResponse)
async def embed_image(request: Request, body: EmbedImageRequest):
    """Generate CLIP image embedding for a given image URL."""
    clip = request.app.state.clip
    if clip.model is None:
        raise HTTPException(status_code=503, detail="Model not ready")
    try:
        img_bytes = await clip.fetch_image_from_url(body.image_url)
        emb = await clip.get_image_embedding(img_bytes)
        flat = emb.flatten().tolist()
        return EmbeddingResponse(embedding=flat, dimension=len(flat))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/text", response_model=EmbeddingResponse)
async def embed_text(request: Request, body: EmbedTextRequest):
    """Generate CLIP text embedding for item metadata."""
    clip = request.app.state.clip
    if clip.model is None:
        raise HTTPException(status_code=503, detail="Model not ready")
    try:
        text = clip.build_item_description(
            body.title, body.category, body.brand, body.color, body.description
        )
        emb = await clip.get_text_embedding(text)
        flat = emb.flatten().tolist()
        return EmbeddingResponse(embedding=flat, dimension=len(flat))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
