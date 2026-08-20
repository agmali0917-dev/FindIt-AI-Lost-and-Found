"""Verification script for FindIt AI Service"""
import sys
import os

# Ensure we're running from the right directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("FindIt AI Service Verification")
print("=" * 60)

# Test 1: Python version
print(f"\n[1] Python version: {sys.version}")

# Test 2: Core imports
print("\n[2] Core imports:")
try:
    import torch
    print(f"  torch: {torch.__version__} (CUDA: {torch.cuda.is_available()})")
except ImportError as e:
    print(f"  torch: FAILED - {e}")

try:
    import torchvision
    print(f"  torchvision: {torchvision.__version__}")
except ImportError as e:
    print(f"  torchvision: FAILED - {e}")

try:
    import open_clip
    print(f"  open_clip: {open_clip.__version__}")
except ImportError as e:
    print(f"  open_clip: FAILED - {e}")

try:
    import fastapi
    print(f"  fastapi: {fastapi.__version__}")
except ImportError as e:
    print(f"  fastapi: FAILED - {e}")

try:
    import uvicorn
    print(f"  uvicorn: {uvicorn.__version__ if hasattr(uvicorn, '__version__') else 'OK'}")
except ImportError as e:
    print(f"  uvicorn: FAILED - {e}")

try:
    import pydantic_settings
    print(f"  pydantic_settings: OK")
except ImportError as e:
    print(f"  pydantic_settings: FAILED - {e}")

# Test 3: App config
print("\n[3] App config:")
try:
    from app.config import settings
    print(f"  CLIP_MODEL: {settings.CLIP_MODEL}")
    print(f"  HOST: {settings.HOST}")
    print(f"  PORT: {settings.PORT}")
    print(f"  LOG_LEVEL: {settings.LOG_LEVEL}")
    print(f"  Config import: OK")
except Exception as e:
    print(f"  Config import: FAILED - {e}")

# Test 4: Router imports
print("\n[4] Router imports:")
try:
    from app.routers import match, health, embeddings
    print(f"  match router: OK")
    print(f"  health router: OK")
    print(f"  embeddings router: OK")
except Exception as e:
    print(f"  Router imports: FAILED - {e}")

# Test 5: CLIP service import
print("\n[5] CLIP service import:")
try:
    from app.services.clip_service import CLIPService
    clip = CLIPService()
    print(f"  CLIPService: OK")
    print(f"  Device: {clip.device}")
except Exception as e:
    print(f"  CLIPService: FAILED - {e}")

# Test 6: Full FastAPI app import
print("\n[6] FastAPI app import:")
try:
    from main import app
    print(f"  app.title: {app.title}")
    print(f"  app.version: {app.version}")
    routes = [r.path for r in app.routes if hasattr(r, 'path')]
    print(f"  Routes: {routes}")
    print(f"  FastAPI app: OK")
except Exception as e:
    print(f"  FastAPI app: FAILED - {e}")

# Test 7: OpenCLIP model name validation
print("\n[7] OpenCLIP model name validation:")
try:
    import open_clip
    available = open_clip.list_models()
    model_name = settings.CLIP_MODEL
    if model_name in available:
        print(f"  '{model_name}' is a valid OpenCLIP model name: OK")
    else:
        print(f"  '{model_name}' NOT found in available models!")
        # Check for close matches
        close = [m for m in available if 'ViT-B' in m]
        print(f"  Close matches: {close[:5]}")
except Exception as e:
    print(f"  Model validation: FAILED - {e}")

print("\n" + "=" * 60)
print("Verification complete")
print("=" * 60)
