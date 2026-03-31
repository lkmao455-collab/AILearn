# CV Learn - Quick Restart Script (PowerShell)
# Usage: .\restart.ps1

$InfoColor = "Cyan"
$SuccessColor = "Green"

Write-Host "Stopping existing services..." -ForegroundColor $InfoColor

# Stop all node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

Write-Host "Starting services..." -ForegroundColor $InfoColor

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ScriptDir "backend"
$FrontendDir = Join-Path $ScriptDir "frontend"

# Start backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Set-Location '$BackendDir'
Write-Host '=== CV Learn Backend ===' -ForegroundColor Cyan
node server.js
"@

Start-Sleep -Seconds 2

# Start frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Set-Location '$FrontendDir'
Write-Host '=== CV Learn Frontend ===' -ForegroundColor Cyan
npm run dev
"@

Start-Sleep -Seconds 5

# Open Chrome
$chromePath = "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
if (Test-Path $chromePath) {
    Start-Process $chromePath -ArgumentList "--new-window", "http://localhost:5173"
}

Write-Host "Done! Visit http://localhost:5173" -ForegroundColor $SuccessColor
