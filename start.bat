@echo off
title Network Status Viewer Pro - Launcher
color 0A
echo.
echo ========================================
echo    Network Status Viewer Pro v2.0
echo    Sidebar Layout with Analytics
echo ========================================
echo.

echo [1/4] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Python not found!
    echo.
    echo Please install Python from: https://python.org
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)
echo ✅ Python found!

echo.
echo [2/4] Installing Python dependencies...
cd backend
pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Failed to install dependencies
    echo Please check your internet connection and try again
    pause
    exit /b 1
)
echo ✅ Dependencies installed!

echo.
echo [3/4] Setting up PKT file conversion support...
python install_pkt_converter.py >nul 2>&1
echo ✅ PKT converter ready!

echo.
echo [4/4] Starting application...
echo 🚀 Launching FastAPI server on port 8000...
start "Network Analyzer Backend" cmd /k "echo Server running at http://127.0.0.1:8000 && uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo 🌐 Opening application in browser...
timeout /t 3 /nobreak >nul
cd ..
start "" "index.html"

echo.
echo ========================================
echo ✅ Network Status Viewer Pro is ready!
echo ========================================
echo.
echo 📖 Backend API: http://127.0.0.1:8000
echo 🌐 Frontend: index.html (auto-opened)
echo.
echo 📁 Drag & drop your files to get started:
echo    ✅ .pkt files (Packet Tracer binary)
echo    ✅ .txt files (Packet Tracer text export)  
echo    ✅ .xml files (Packet Tracer XML export)
echo.
echo 🎯 Use the sidebar to navigate between:
echo    📊 Overview   🌐 Topology   🖥️ Devices   🔗 Connections   📈 Analytics
echo.
echo ❓ Need help? See CLIENT_SETUP_GUIDE.md
echo 🔧 Having issues? See QUICK_START.md
echo.
pause
echo.
echo Press any key to exit...
pause >nul
