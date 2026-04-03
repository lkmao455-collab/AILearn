@echo off
chcp 65001 >nul
echo ========================================
echo    📦 CV Learn 全栈构建脚本
echo ========================================
echo.

echo [1/3] 安装前端依赖...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo 前端依赖安装失败！
    pause
    exit /b 1
)

echo.
echo [2/3] 构建前端...
call npm run build
if %errorlevel% neq 0 (
    echo 前端构建失败！
    pause
    exit /b 1
)

echo.
echo [3/3] 安装后端依赖...
cd ..\backend
call npm install
if %errorlevel% neq 0 (
    echo 后端依赖安装失败！
    pause
    exit /b 1
)

echo.
echo ========================================
echo    ✅ 构建完成！
echo ========================================
echo.
echo 启动命令：
echo   cd backend ^&^& npm start
echo.
echo 或者直接双击 start.bat
echo.
pause