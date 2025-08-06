# Start the FastAPI backend server
Write-Host "Starting Network Status Viewer..." -ForegroundColor Green
Write-Host ""

Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
Set-Location backend
pip install -r requirements.txt

Write-Host ""
Write-Host "Starting FastAPI server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "uvicorn main:app --reload --host 0.0.0.0 --port 8000"

Write-Host ""
Write-Host "Opening frontend in browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Set-Location ..
Start-Process "index.html"

Write-Host ""
Write-Host "Network Status Viewer is now running!" -ForegroundColor Green
Write-Host "Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: Open index.html in your browser" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
