"""
Vision Service - Extracts structured data from images using Google Gemini.
"""

import logging
import google.generativeai as genai
from app.config import settings
import json
import io
from PIL import Image

logger = logging.getLogger("findit.vision")

# Initialize Gemini if key is provided
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    
class VisionService:
    def __init__(self):
        # We use gemini-1.5-flash as it's fast and suitable for multimodal tasks
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        
    async def analyze_image(self, image_data: bytes) -> dict:
        """
        Extracts title, category, brand, color, and description from the image.
        Returns a dictionary with these fields.
        """
        if not settings.GEMINI_API_KEY:
            logger.error("GEMINI_API_KEY is not set.")
            return {"error": "AI Auto-fill is not configured."}
            
        try:
            # Convert bytes to PIL Image
            img = Image.open(io.BytesIO(image_data))
            
            prompt = """
            Analyze this image and extract the following details for a lost & found platform:
            - title: A short, clear title for the item (e.g. "Red Nike Backpack").
            - category: Choose one from: Electronics, Clothing, Accessories, Bags & Wallets, Keys, Documents, Jewelry, Sports & Outdoors, Books & Stationery, Toys & Games, Musical Instruments, Vehicles, Pets, Other.
            - brand: The brand of the item, if visible (leave empty if unknown).
            - color: The primary color(s) of the item.
            - description: A clear, concise description of the item, highlighting any unique features.

            Return ONLY a valid JSON object with these keys. No markdown formatting, just raw JSON.
            """
            
            response = self.model.generate_content([prompt, img])
            text = response.text.strip()
            
            # Clean up potential markdown formatting in response
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
                
            return json.loads(text.strip())
            
        except Exception as e:
            logger.error(f"Error in vision service: {e}")
            return {"error": str(e)}

vision_service = VisionService()
