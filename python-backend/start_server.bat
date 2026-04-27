@echo off
REM BioShield IoT API Server Startup Script for Windows

chcp 65001 >nul
cls

echo.
echo ════════════════════════════════════════
echo    BioShield IoT API Server Startup
echo ════════════════════════════════════════
echo.

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo ✗ Virtual environment not found!
    echo.
    echo Please create it first:
    echo   python -m venv venv
    echo   venv\Scripts\pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

REM Activate virtual environment
echo ✓ Activating Python virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ✗ Failed to activate virtual environment
    pause
    exit /b 1
)

REM Get Windows IP address
echo ✓ Finding your Windows IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address" ^| findstr /v "127.0.0"') do (
    set "IP=%%a"
    goto found_ip
)

:found_ip
REM Trim whitespace
for /f "tokens=* delims= " %%a in ("%IP%") do set "IP=%%a"

echo.
echo 📱 For your phone:
echo    https://%IP%:8000/
echo.
echo ⚠️  Using self-signed certificate
echo ✓ Using HTTPS for security
echo.
echo 🚀 Starting FastAPI server with HTTPS...
echo    Server will listen on https://0.0.0.0:8000
echo.

REM Start the server with HTTPS
python -m uvicorn app.main:app ^
  --host 0.0.0.0 ^
  --port 8000 ^
  --ssl-keyfile=certs/key.pem ^
  --ssl-certfile=certs/cert.pem ^
  --reload

if errorlevel 1 (
    echo.
    echo ✗ Failed to start FastAPI server
    echo.
    pause
    exit /b 1
)

pause
