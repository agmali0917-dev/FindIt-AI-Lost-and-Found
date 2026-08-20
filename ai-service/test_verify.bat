@echo off
cd /d "E:\SM\FindIt – AI Powered Lost & Found Platform\ai-service"
echo === CWD ===
cd
echo === Python Import Test ===
venv\Scripts\python.exe -c "from app.config import settings; print('Config OK:', settings.CLIP_MODEL)"
echo === Full App Import Test ===
venv\Scripts\python.exe -c "from main import app; print('FastAPI app imported OK')"
echo === OpenCLIP Test ===
venv\Scripts\python.exe -c "import open_clip; print('OpenCLIP version:', open_clip.__version__)"
echo === CLIP Model Name Test ===
venv\Scripts\python.exe -c "import open_clip; m,_,p = open_clip.create_model_and_transforms('ViT-B-32', pretrained='openai'); print('CLIP model loaded OK')"
echo === Done ===
