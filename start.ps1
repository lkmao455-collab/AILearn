# CV Learn - Startup Script (PowerShell)
# Usage: .\start.ps1 or powershell -ExecutionPolicy Bypass -File .\start.ps1

param([switch]$NoBrowser)

$InfoColor = "Cyan"
$SuccessColor = "Green"
$ErrorColor = "Red"
$WarningColor = "Yellow"

function Write-Color {
    param($Message, $Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Write-Section {
    param($Message)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor $InfoColor
    Write-Host "  $Message" -ForegroundColor $InfoColor
    Write-Host "========================================" -ForegroundColor $InfoColor
    Write-Host ""
}

Write-Section "CV Learn - Machine Vision AI Learning Platform"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ScriptDir "backend"
$FrontendDir = Join-Path $ScriptDir "frontend"

# Check Node.js
Write-Color "[Check] Checking Node.js installation..." $InfoColor
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Color "[OK] Node.js installed: $nodeVersion" $SuccessColor
    } else {
        throw "Node.js not installed"
    }
} catch {
    Write-Color "[ERROR] Node.js not found. Please install Node.js first." $ErrorColor
    Write-Color "Download: https://nodejs.org/" $WarningColor
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Install backend dependencies
Write-Section "Checking Backend Dependencies"
Set-Location $BackendDir

if (-not (Test-Path "node_modules")) {
    Write-Color "[Info] Installing backend dependencies..." $InfoColor
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Color "[ERROR] Backend dependency installation failed" $ErrorColor
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Color "[OK] Backend dependencies installed" $SuccessColor
} else {
    Write-Color "[OK] Backend dependencies exist" $SuccessColor
}
Write-Host ""

# Install frontend dependencies
Write-Section "Checking Frontend Dependencies"
Set-Location $FrontendDir

if (-not (Test-Path "node_modules")) {
    Write-Color "[Info] Installing frontend dependencies..." $InfoColor
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Color "[ERROR] Frontend dependency installation failed" $ErrorColor
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Color "[OK] Frontend dependencies installed" $SuccessColor
} else {
    Write-Color "[OK] Frontend dependencies exist" $SuccessColor
}
Write-Host ""

# Start backend
Write-Section "Starting Backend Service"
Set-Location $BackendDir

$backendPort = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($backendPort) {
    Write-Color "[Warning] Port 3001 is in use. Continue?" $WarningColor
    $continue = Read-Host "Continue (y/n)"
    if ($continue -ne 'y') { exit 1 }
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Set-Location '$BackendDir'
Write-Host '=== CV Learn Backend ===' -ForegroundColor Cyan
node server.js
"@ -WindowStyle Normal

Write-Color "[OK] Backend started (port 3001)" $SuccessColor
Write-Host ""
Start-Sleep -Seconds 3

# Start frontend
Write-Section "Starting Frontend Service"
Set-Location $FrontendDir

$frontendPort = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontendPort) {
    Write-Color "[Warning] Port 5173 is in use. Continue?" $WarningColor
    $continue = Read-Host "Continue (y/n)"
    if ($continue -ne 'y') { exit 1 }
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Set-Location '$FrontendDir'
Write-Host '=== CV Learn Frontend ===' -ForegroundColor Cyan
npm run dev
"@ -WindowStyle Normal

Write-Color "[OK] Frontend started (port 5173)" $SuccessColor
Write-Host ""
Start-Sleep -Seconds 5

# Check services
Write-Section "Service Status Check"

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 3 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Color "[OK] Backend service running" $SuccessColor
    }
} catch {
    Write-Color "[!] Backend may not be running properly" $WarningColor
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 3 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Color "[OK] Frontend service running" $SuccessColor
    }
} catch {
    Write-Color "[!] Frontend may not be running properly" $WarningColor
}
Write-Host ""

# Open browser
if (-not $NoBrowser) {
    Write-Section "Opening Browser"

    $chromePaths = @(
        "C:\Program Files\Google\Chrome\Application\chrome.exe",
        "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    )

    $chromePath = $null
    foreach ($path in $chromePaths) {
        if (Test-Path $path) {
            $chromePath = $path
            break
        }
    }

    if ($chromePath) {
        Write-Color "[OK] Chrome found: $chromePath" $SuccessColor
        Start-Process $chromePath -ArgumentList "--new-window", "http://localhost:5173"
        Write-Color "[OK] CV Learn website opened" $SuccessColor
    } else {
        Write-Color "[Info] Chrome not found, using default browser" $InfoColor
        Start-Process "http://localhost:5173"
    }
}

Write-Section "Startup Complete"

Write-Host @"

  Frontend: http://localhost:5173
  Backend:  http://localhost:3001

  Tips:
  - Backend runs in a separate PowerShell window
  - Frontend runs in a separate PowerShell window
  - Close windows or run stop.ps1 to stop services

"@

Write-Color "Press any key to exit..." $InfoColor
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
