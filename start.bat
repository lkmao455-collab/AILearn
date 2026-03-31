@echo off
chcp 65001 >nul
title CV Learn - 机器视觉 AI 学习平台启动脚本

echo ========================================
echo   CV Learn 启动脚本
echo   机器视觉 AI 学习刷题平台
echo ========================================
echo.

:: 检查 Node.js 是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址：https://nodejs.org/
    pause
    exit /b 1
)

echo [✓] Node.js 已安装：
node -v
echo.

:: 获取脚本所在目录
set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%backend
set FRONTEND_DIR=%SCRIPT_DIR%frontend

:: 检查并安装后端依赖
echo ========================================
echo [1/4] 检查后端依赖...
echo ========================================
cd /d "%BACKEND_DIR%"
if not exist "node_modules" (
    echo [信息] 首次运行，安装后端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 后端依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo [✓] 后端依赖已存在
)
echo.

:: 检查并安装前端依赖
echo ========================================
echo [2/4] 检查前端依赖...
echo ========================================
cd /d "%FRONTEND_DIR%"
if not exist "node_modules" (
    echo [信息] 首次运行，安装前端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 前端依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo [✓] 前端依赖已存在
)
echo.

:: 启动后端服务
echo ========================================
echo [3/4] 启动后端服务...
echo ========================================
cd /d "%BACKEND_DIR%"
start "CV Learn Backend" cmd /k "node server.js"
echo [✓] 后端服务已启动（端口 3001）
echo.

:: 等待后端启动
timeout /t 3 /nobreak >nul

:: 启动前端服务
echo ========================================
echo [4/4] 启动前端服务...
echo ========================================
cd /d "%FRONTEND_DIR%"
start "CV Learn Frontend" cmd /k "npm run dev"
echo [✓] 前端服务已启动（端口 5173）
echo.

:: 等待前端启动
timeout /t 5 /nobreak >nul

:: 检查谷歌浏览器并打开网站
echo ========================================
echo 正在打开浏览器...
echo ========================================

:: 尝试不同的 Chrome 安装路径
set "CHROME_PATH="

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

if not "%CHROME_PATH%"=="" (
    echo [✓] 找到 Chrome 浏览器
    start "" "%CHROME_PATH%" --new-window "http://localhost:5173"
    echo [✓] 已打开 CV Learn 网站
) else (
    echo [提示] 未找到 Chrome 浏览器，使用默认浏览器打开
    start http://localhost:5173
)

echo.
echo ========================================
echo   启动完成！
echo ========================================
echo.
echo   前端地址：http://localhost:5173
echo   后端地址：http://localhost:3001
echo.
echo   提示：
echo   - 后端服务运行在后台窗口
echo   - 前端服务运行在后台窗口
echo   - 关闭网站请按 Ctrl+C 停止服务
echo.
echo   按任意键查看状态...
pause >nul

:: 检查服务状态
echo.
echo ========================================
echo   服务状态检查
echo ========================================

curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] 后端服务运行正常
) else (
    echo [!] 后端服务可能未正常启动
)

curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] 前端服务运行正常
) else (
    echo [!] 前端服务可能未正常启动
)

echo.
echo 按任意键退出...
pause >nul
