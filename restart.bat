@echo off
chcp 65001 >nul
REM CV Learn - Quick Restart Script (Batch)
REM Usage: .\restart.bat

echo Stopping existing services...

REM Stop all node processes
taskkill /F /IM node.exe 2>nul

REM Wait for processes to stop
timeout /t 1 /nobreak >nul

echo Starting services...

REM Get script directory
set "ScriptDir=%~dp0"
set "BackendDir=%ScriptDir%backend"
set "FrontendDir=%ScriptDir%frontend"

REM Start backend in new window
start "CV Learn Backend" cmd /k "cd /d "%BackendDir%" && echo === CV Learn Backend === && node server.js"

REM Wait for backend to start
timeout /t 2 /nobreak >nul

REM Start frontend in new window
start "CV Learn Frontend" cmd /k "cd /d "%FrontendDir%" && echo === CV Learn Frontend === && npm run dev"

REM Wait for frontend to start
timeout /t 5 /nobreak >nul

REM Open Chrome
set "ChromePath=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if exist "%ChromePath%" (
    start "" "%ChromePath%" --new-window http://localhost:5173
)

echo Done! Visit http://localhost:5173

pause
