# CV Learn - Stop Services Script (PowerShell)
# Usage: .\stop.ps1 or powershell -ExecutionPolicy Bypass -File .\stop.ps1

$InfoColor = "Cyan"
$SuccessColor = "Green"
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

Write-Section "CV Learn - Stop Services"

Write-Color "[Info] Searching for Node.js processes..." $InfoColor
Write-Host ""

$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Color "[Found] Found $($nodeProcesses.Count) Node.js process(es):" $InfoColor
    foreach ($proc in $nodeProcesses) {
        Write-Host "  - PID: $($proc.Id), Memory: $([math]::Round($proc.WorkingSet / 1MB, 2)) MB" -ForegroundColor Gray
    }
    Write-Host ""

    $confirm = Read-Host "Stop all Node.js services? (y/n)"
    if ($confirm -eq 'y') {
        foreach ($proc in $nodeProcesses) {
            try {
                Stop-Process -Id $proc.Id -Force -ErrorAction Stop
                Write-Color "[OK] Stopped process PID: $($proc.Id)" "Green"
            } catch {
                Write-Color "[!] Failed to stop process PID: $($proc.Id) - $_" "Yellow"
            }
        }
        Write-Host ""
        Write-Color "========================================" $SuccessColor
        Write-Color "  All services stopped successfully" $SuccessColor
        Write-Color "========================================" $SuccessColor
    } else {
        Write-Color "[Cancelled] Operation cancelled" $WarningColor
    }
} else {
    Write-Color "[!] No running Node.js services found" $WarningColor
}

Write-Host ""
Write-Color "Press any key to exit..." $InfoColor
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
