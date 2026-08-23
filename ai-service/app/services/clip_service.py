"""
CLIP Service – Core AI Matching Engine
Uses OpenAI CLIP (ViT-B/32) to generate image and text embeddings,
then computes cosine similarity for lost/found item matching.
"""

import logging
import asyncio
from typing import List, Optional, Union
from pathlib import Path
import io
import base64

import torch
import numpy as np
import open_clip
from PIL import Image, ImageOps
import httpx

from app.config import settings

logger = logging.getLogger("findit.clip")


class CLIPService:
    """
    Singleton service that wraps the CLIP model for embedding generation
    and cosine similarity-based matching.
    """

    def __init__(self):
        self.model = None
        self.preprocess = None
        self.tokenizer = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._lock = asyncio.Lock()

    async def load_model(self):
        """Load CLIP model asynchronously (runs in thread pool to not block event loop)."""
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, self._load_model_sync)

    def _load_model_sync(self):
        """Synchronous model loading."""
        try:
            logger.info(f"Loading CLIP {settings.CLIP_MODEL} on {self.device}...")
            self.model, _, self.preprocess = open_clip.create_model_and_transforms(
                settings.CLIP_MODEL,
                pretrained="datacompdr"
            )
            self.tokenizer = open_clip.get_tokenizer(settings.CLIP_MODEL)
            self.model = self.model.to(self.device)
            self.model.eval()
            logger.info("✅ CLIP model loaded successfully!")
        except Exception as e:
            logger.error(f"❌ Failed to load CLIP model: {e}")
            raise

    def _preprocess_image(self, image_data: Union[bytes, str]) -> torch.Tensor:
        """
        Preprocess image data for CLIP inference.
        Accepts raw bytes or base64-encoded string.
        """
        if isinstance(image_data, str):
            # Handle base64
            if image_data.startswith("data:"):
                image_data = image_data.split(",")[1]
            image_data = base64.b64decode(image_data)

        img = Image.open(io.BytesIO(image_data)).convert("RGB")
        # Auto-orient based on EXIF
        img = ImageOps.exif_transpose(img)
        return self.preprocess(img).unsqueeze(0).to(self.device)

    def _encode_text(self, texts: List[str]) -> np.ndarray:
        """Encode text queries using CLIP text encoder."""
        tokens = self.tokenizer(texts).to(self.device)
        with torch.no_grad():
            features = self.model.encode_text(tokens)
            features = features / features.norm(dim=-1, keepdim=True)
        return features.cpu().numpy()

    def _encode_image(self, image_tensor: torch.Tensor) -> np.ndarray:
        """Encode preprocessed image tensor."""
        with torch.no_grad():
            features = self.model.encode_image(image_tensor)
            features = features / features.norm(dim=-1, keepdim=True)
        return features.cpu().numpy()

    def cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """Compute cosine similarity between two embedding vectors."""
        return float(np.dot(a.flatten(), b.flatten()) / (
            np.linalg.norm(a) * np.linalg.norm(b) + 1e-8
        ))

    async def get_image_embedding(self, image_data: bytes) -> np.ndarray:
        """
        Generate CLIP image embedding (async-safe, runs in thread pool).
        Returns normalized feature vector as numpy array.
        """
        async with self._lock:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(
                None, self._get_image_embedding_sync, image_data
            )

    def _get_image_embedding_sync(self, image_data: bytes) -> np.ndarray:
        img_tensor = self._preprocess_image(image_data)
        return self._encode_image(img_tensor)

    async def get_text_embedding(self, text: str) -> np.ndarray:
        """Generate CLIP text embedding."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._encode_text, [text])

    def build_item_description(
        self,
        title: str,
        category: str = "",
        brand: str = "",
        color: str = "",
        description: str = "",
    ) -> str:
        """
        Build a rich text description for text-embedding to augment image matching.
        """
        parts = [f"a {color} {brand} {category}".strip()]
        if title:
            parts.append(title)
        if description:
            parts.append(description[:200])
        return ". ".join(filter(None, parts))

    async def compute_match_score(
        self,
        found_image_embeddings: List[np.ndarray],
        lost_image_embeddings: List[np.ndarray],
        found_text_embedding: Optional[np.ndarray] = None,
        lost_text_embedding: Optional[np.ndarray] = None,
        image_weight: float = 0.75,
        text_weight: float = 0.25,
    ) -> float:
        """
        Compute a combined image + text similarity score.

        Strategy:
        - For images: compute max similarity across all found x lost image pairs
        - For text: cosine similarity of text embeddings
        - Final score: weighted average of image and text scores
        """
        # Image similarity: max across all image pair combinations
        image_scores = []
        for f_emb in found_image_embeddings:
            for l_emb in lost_image_embeddings:
                score = self.cosine_similarity(f_emb, l_emb)
                image_scores.append(score)

        image_score = max(image_scores) if image_scores else 0.0

        # Text similarity (if available)
        text_score = 0.0
        if found_text_embedding is not None and lost_text_embedding is not None:
            text_score = self.cosine_similarity(found_text_embedding, lost_text_embedding)
            # Weighted combination
            final_score = (image_score * image_weight) + (text_score * text_weight)
        else:
            final_score = image_score

        # Normalize to 0-1 (CLIP cosine sims can be negative)
        final_score = max(0.0, min(1.0, (final_score + 1) / 2))
        return round(final_score, 4)

    async def fetch_image_from_url(self, url: str) -> bytes:
        """Download image from URL (Cloudinary etc.)."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.content
