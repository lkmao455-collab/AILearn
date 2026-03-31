@echo off
chcp 65001 >nul
title CV Learn - 停止服务

echo ========================================
echo   CV Learn 停止服务脚本
echo ========================================
echo.

echo [信息] 正在停止所有服务...
echo.

:: 终止 Node.js 进程
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] 已停止所有 Node.js 服务
) else (
    echo [!] 未找到运行中的 Node.js 服务
)

echo.
echo ========================================
echo   服务已停止
echo ========================================
echo.
echo 按任意键退出...
pause >nul
