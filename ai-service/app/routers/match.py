"""
Match Router – POST /match
Accepts a found item's images + metadata and compares against
a list of lost item candidates, returning sorted similarity scores.
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl

from app.config import settings

logger = logging.getLogger("findit.match")
router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────────────────────────

class LostItemCandidate(BaseModel):
    item_id: str
    image_urls: List[str]
    title: str = ""
    category: str = ""
    brand: str = ""
    color: str = ""
    description: str = ""


class MatchRequest(BaseModel):
    found_item_id: str
    found_image_urls: List[str]
    found_title: str = ""
    found_category: str = ""
    found_brand: str = ""
    found_color: str = ""
    found_description: str = ""
    lost_item_candidates: List[LostItemCandidate]
    threshold: float = settings.SIMILARITY_THRESHOLD


class MatchResult(BaseModel):
    item_id: str
    similarity_score: float
    is_match: bool


class MatchResponse(BaseModel):
    found_item_id: str
    matches: List[MatchResult]
    total_candidates: int
    matches_found: int
    threshold: float


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/", response_model=MatchResponse)
async def match_items(request: Request, body: MatchRequest):
    """
    Main matching endpoint.
    Computes CLIP similarity between a found item and all lost item candidates.
    Returns results sorted by similarity score (descending).
    """
    clip = request.app.state.clip
    if clip.model is None:
        raise HTTPException(status_code=503, detail="CLIP model not loaded")

    if not body.lost_item_candidates:
        raise HTTPException(status_code=400, detail="No lost item candidates provided")

    logger.info(
        f"Matching found item {body.found_item_id} against "
        f"{len(body.lost_item_candidates)} candidates"
    )

    try:
        # 1. Embed all found item images
        found_embeddings = []
        for url in body.found_image_urls[:3]:  # Max 3 images for perf
            try:
                img_bytes = await clip.fetch_image_from_url(url)
                emb = await clip.get_image_embedding(img_bytes)
                found_embeddings.append(emb)
            except Exception as e:
                logger.warning(f"Could not load found image {url}: {e}")

        if not found_embeddings:
            raise HTTPException(status_code=400, detail="Could not load any found item images")

        # 2. Embed found item text
        found_text = clip.build_item_description(
            body.found_title, body.found_category,
            body.found_brand, body.found_color, body.found_description
        )
        found_text_emb = await clip.get_text_embedding(found_text) if found_text else None

        # 3. Score each lost item candidate
        results: List[MatchResult] = []

        for candidate in body.lost_item_candidates:
            # Embed lost item images
            lost_embeddings = []
            for url in candidate.image_urls[:3]:
                try:
                    img_bytes = await clip.fetch_image_from_url(url)
                    emb = await clip.get_image_embedding(img_bytes)
                    lost_embeddings.append(emb)
                except Exception as e:
                    logger.warning(f"Could not load lost image {url}: {e}")

            if not lost_embeddings:
                continue

            # Embed lost item text
            lost_text = clip.build_item_description(
                candidate.title, candidate.category,
                candidate.brand, candidate.color, candidate.description
            )
            lost_text_emb = await clip.get_text_embedding(lost_text) if lost_text else None

            # Compute combined score
            score = await clip.compute_match_score(
                found_embeddings, lost_embeddings,
                found_text_emb, lost_text_emb
            )

            results.append(MatchResult(
                item_id=candidate.item_id,
                similarity_score=score,
                is_match=score >= body.threshold,
            ))

        # Sort by score descending
        results.sort(key=lambda x: x.similarity_score, reverse=True)
        matches = [r for r in results if r.is_match]

        logger.info(
            f"✅ Matching complete: {len(matches)}/{len(results)} matches found "
            f"above threshold {body.threshold}"
        )

        return MatchResponse(
            found_item_id=body.found_item_id,
            matches=results,
            total_candidates=len(results),
            matches_found=len(matches),
            threshold=body.threshold,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Matching error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Matching failed: {str(e)}")


@router.post("/single-image")
async def match_single_image(
    request: Request,
    image: UploadFile = File(...),
    item_ids: str = Form(...),          # comma-separated item IDs
    image_urls: str = Form(...),        # JSON array of arrays
):
    """Upload a single image and match against pre-computed embeddings."""
    clip = request.app.state.clip
    img_bytes = await image.read()

    try:
        found_emb = await clip.get_image_embedding(img_bytes)
        return JSONResponse({"embedding": found_emb.tolist(), "shape": list(found_emb.shape)})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
