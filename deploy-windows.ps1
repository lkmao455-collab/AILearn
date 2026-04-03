# CV Learn Windows 快速部署脚本
# 使用方法：以管理员身份运行 PowerShell，执行：.\deploy-windows.ps1

param(
    [string]$ServerIP = "",
    [switch]$SkipFrontend = $false
)

# 设置错误处理
$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Green
Write-Host "  CV Learn Windows 部署脚本" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# 获取服务器 IP
if ([string]::IsNullOrEmpty($ServerIP)) {
    $ServerIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress
    if ([string]::IsNullOrEmpty($ServerIP)) {
        $ServerIP = "localhost"
    }
}

Write-Host "服务器 IP: $ServerIP" -ForegroundColor Cyan

# 检查 Node.js
try {
    $nodeVersion = node -v
    Write-Host "Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "错误: 未检测到 Node.js，请先安装 Node.js 18+" -ForegroundColor Red
    Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 检查 PM2
try {
    $pm2Version = pm2 -v
    Write-Host "PM2 版本: $pm2Version" -ForegroundColor Green
} catch {
    Write-Host "安装 PM2..." -ForegroundColor Yellow
    npm install -g pm2
}

# 部署后端
Write-Host "`n[1/3] 部署后端服务..." -ForegroundColor Yellow
Set-Location -Path "backend"

# 安装依赖
Write-Host "安装后端依赖..." -ForegroundColor Cyan
npm install

# 创建 .env 文件（如果不存在）
if (-not (Test-Path ".env")) {
    Write-Host "创建 .env 文件..." -ForegroundColor Cyan
    $jwtSecret = -join ((1..32) | ForEach-Object { Get-Random -Maximum 256 } | ForEach-Object { "{0:X2}" -f $_ })
    @"
PORT=3001
JWT_SECRET=$jwtSecret
DASHSCOPE_API_KEY=your-dashscope-api-key
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "请编辑 backend/.env 文件，填入正确的 DASHSCOPE_API_KEY" -ForegroundColor Red
}

# 确保数据目录存在
if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
}

# 启动后端
Write-Host "启动后端服务..." -ForegroundColor Cyan
pm2 delete cv-learn-backend 2>$null
pm2 start server.js --name cv-learn-backend

Set-Location -Path ".."

# 部署前端
if (-not $SkipFrontend) {
    Write-Host "`n[2/3] 部署前端..." -ForegroundColor Yellow
    Set-Location -Path "frontend"

    # 安装依赖
    Write-Host "安装前端依赖..." -ForegroundColor Cyan
    npm install

    # 构建前端
    Write-Host "构建前端..." -ForegroundColor Cyan
    $env:VITE_API_BASE_URL = "http://$ServerIP`:3001/api"
    npm run build

    # 使用 serve 启动前端（如果没有安装）
    try {
        serve -v | Out-Null
    } catch {
        Write-Host "安装 serve..." -ForegroundColor Cyan
        npm install -g serve
    }

    # 启动前端
    Write-Host "启动前端服务..." -ForegroundColor Cyan
    pm2 delete cv-learn-frontend 2>$null
    pm2 start serve --name cv-learn-frontend -- -s dist -l 80

    Set-Location -Path ".."
}

# 保存 PM2 配置
Write-Host "`n[3/3] 保存 PM2 配置..." -ForegroundColor Yellow
pm2 save

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "  部署完成！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "访问地址：" -ForegroundColor Cyan
Write-Host "  前端: http://$ServerIP" -ForegroundColor White
Write-Host "  API: http://$ServerIP`:3001/api" -ForegroundColor White
Write-Host ""
Write-Host "常用命令：" -ForegroundColor Cyan
Write-Host "  pm2 status        - 查看服务状态" -ForegroundColor White
Write-Host "  pm2 logs          - 查看日志" -ForegroundColor White
Write-Host "  pm2 restart all   - 重启所有服务" -ForegroundColor White
Write-Host "  pm2 stop all      - 停止所有服务" -ForegroundColor White
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
