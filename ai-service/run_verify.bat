@echo off
cd /d "E:\SM\FindIt – AI Powered Lost & Found Platform\ai-service"
"E:\SM\FindIt – AI Powered Lost & Found Platform\ai-service\venv\Scripts\python.exe" verify_service.py
echo.
echo === FastAPI Startup Test ===
echo Starting server for 10 seconds to verify startup...
start /b "E:\SM\FindIt – AI Powered Lost & Found Platform\ai-service\venv\Scripts\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000 > startup_log.txt 2>&1
timeout /t 15 /nobreak > nul
taskkill /f /im python.exe > nul 2>&1
echo.
echo === Startup Log ===
type startup_log.txt
