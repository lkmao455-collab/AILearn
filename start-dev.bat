@echo off
chcp 65001 >nul
echo ========================================
echo    🚀 CV Learn 全栈开发环境启动器
echo ========================================
echo.

:: 检查是否安装了 concurrently
where concurrently >nul 2>nul
if %errorlevel% neq 0 (
    echo 正在安装 concurrently...
    npm install -g concurrently
)

echo 启动后端服务...
echo 启动前端服务...
echo.

:: 使用 concurrently 同时启动两个服务
concurrently ^
    "cd backend && npm run dev" ^
    "cd frontend && npm run dev" ^
    --names "后端,前端" ^
    --prefix-colors "blue,green" ^
    --kill-others

pause