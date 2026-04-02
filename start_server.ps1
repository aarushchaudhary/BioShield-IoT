# BioShield IoT API Server Startup Script for Windows (PowerShell)

# Setup
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   BioShield IoT API Server Startup" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "✗ Virtual environment not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create it first:" -ForegroundColor Yellow
    Write-Host "  python -m venv venv" -ForegroundColor Yellow
    Write-Host "  venv\Scripts\pip install -r requirements.txt" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Activate virtual environment
Write-Host "✓ Activating Python virtual environment..." -ForegroundColor Green
& "venv\Scripts\Activate.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to activate virtual environment" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Get Windows IP address
Write-Host "✓ Finding your Windows IP address..." -ForegroundColor Green

$IP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" } | Select-Object -First 1).IPAddress

if (-not $IP) {
    Write-Host "✗ Could not find Windows IP address" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Display connection info
Write-Host ""
Write-Host "📱 For your phone:" -ForegroundColor Cyan
Write-Host "   https://$IP`:8000/" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Using self-signed certificate" -ForegroundColor Yellow
Write-Host "✓ Using HTTPS for security" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting FastAPI server with HTTPS..." -ForegroundColor Cyan
Write-Host "   Server will listen on https://0.0.0.0:8000" -ForegroundColor Cyan
Write-Host ""

# Start the server with HTTPS
python -m uvicorn app.main:app `
  --host 0.0.0.0 `
  --port 8000 `
  --ssl-keyfile=certs/key.pem `
  --ssl-certfile=certs/cert.pem `
  --reload

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "✗ Failed to start FastAPI server" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Read-Host "Press Enter to exit"
