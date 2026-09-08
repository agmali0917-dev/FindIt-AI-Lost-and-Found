from fastapi import APIRouter, UploadFile, File, HTTPException
import logging
from app.services.vision_service import vision_service

router = APIRouter()
logger = logging.getLogger("findit.analyze")

@router.post("/")
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze an uploaded image and extract structured item details using AI.
    """
    try:
        # Read the file contents
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file provided.")
            
        # Call the vision service
        result = await vision_service.analyze_image(contents)
        
        if "error" in result:
            logger.error(f"Analysis error: {result['error']}")
            raise HTTPException(status_code=500, detail=result["error"])
            
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail="Failed to process image.")
