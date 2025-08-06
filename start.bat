@echo off
echo Starting Network Status Viewer...
echo.

echo Installing Python dependencies...
cd backend
pip install -r requirements.txt

echo.
echo Starting FastAPI server...
start "FastAPI Server" cmd /k "uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo Opening frontend in browser...
timeout /t 3 /nobreak >nul
start "" "index.html"

echo.
echo Network Status Viewer is now running!
echo Backend API: http://localhost:8000
echo Frontend: Open index.html in your browser
echo.
echo Press any key to exit...
pause >nul
