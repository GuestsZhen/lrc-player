# Start lrc-player development server
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting lrc-player Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to project directory
Set-Location $PSScriptRoot

Write-Host "Node.js version:" -ForegroundColor Green
node --version
Write-Host ""

Write-Host "Starting Vite dev server..." -ForegroundColor Green
Write-Host ""
Write-Host "Open your browser to http://localhost:5173" -ForegroundColor Yellow
Write-Host "Network access: http://<your-ip>:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow
Write-Host ""

# Use node directly to avoid PowerShell execution policy issues
node node_modules/vite/bin/vite.js --host
