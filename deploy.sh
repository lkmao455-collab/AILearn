#!/bin/bash
# CV Learn 部署脚本 - VPS 手动部署方案
# 使用方法: ./deploy.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
BACKEND_PORT=3001
FRONTEND_PORT=80

# 打印信息函数
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        error "$1 未安装，请先安装"
    fi
}

# 获取服务器 IP
get_server_ip() {
    hostname -I | awk '{print $1}'
}

info "开始部署 CV Learn..."

# 1. 检查环境
info "检查环境..."
check_command node
check_command npm
check_command git

# 检查 Node.js 版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js 版本需要 >= 18，当前版本: $(node -v)"
fi

info "Node.js 版本: $(node -v)"
info "NPM 版本: $(npm -v)"

# 2. 安装 PM2（如果未安装）
if ! command -v pm2 &> /dev/null; then
    info "安装 PM2..."
    npm install -g pm2
fi

# 3. 部署后端
info "部署后端服务..."
cd backend

# 安装依赖
info "安装后端依赖..."
npm ci --production

# 创建 .env 文件（如果不存在）
if [ ! -f .env ]; then
    warn "后端 .env 文件不存在，创建默认配置..."
    cat > .env << EOF
PORT=3001
JWT_SECRET=$(openssl rand -hex 32)
DASHSCOPE_API_KEY=your-dashscope-api-key
EOF
    warn "请编辑 backend/.env 文件，填入正确的 DASHSCOPE_API_KEY"
fi

# 确保数据目录存在
mkdir -p data

# 使用 PM2 启动后端
info "启动后端服务..."
pm2 delete cv-learn-backend 2>/dev/null || true
pm2 start server.js --name cv-learn-backend -- --port $BACKEND_PORT

cd ..

# 4. 部署前端
info "部署前端..."
cd frontend

# 安装依赖
info "安装前端依赖..."
npm ci

# 获取服务器 IP
SERVER_IP=$(get_server_ip)
info "检测到服务器 IP: $SERVER_IP"

# 设置 API 地址并构建
info "构建前端..."
export VITE_API_BASE_URL=http://$SERVER_IP:$BACKEND_PORT/api
npm run build

# 检查是否安装了 Nginx
if command -v nginx &> /dev/null; then
    info "配置 Nginx..."

    # 创建 Nginx 配置
    sudo tee /etc/nginx/sites-available/cv-learn << EOF
server {
    listen $FRONTEND_PORT;
    server_name _;

    root $(pwd)/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    # 启用站点
    sudo ln -sf /etc/nginx/sites-available/cv-learn /etc/nginx/sites-enabled/cv-learn
    sudo rm -f /etc/nginx/sites-enabled/default

    # 测试并重载 Nginx
    sudo nginx -t && sudo systemctl reload nginx

    info "Nginx 配置完成"
else
    warn "Nginx 未安装，跳过 Nginx 配置"
    warn "你可以使用 'npm run preview' 预览前端，或使用 Python 启动静态服务器："
    warn "  cd frontend/dist && python3 -m http.server 8080"
fi

cd ..

# 5. 保存 PM2 配置
info "保存 PM2 配置..."
pm2 save

# 6. 显示部署信息
info "部署完成！"
echo ""
echo "=============================================="
echo "CV Learn 已成功部署！"
echo "=============================================="
echo ""
echo "访问地址："
echo "  • 前端: http://$SERVER_IP"
echo "  • 后端 API: http://$SERVER_IP:$BACKEND_PORT/api"
echo ""
echo "常用命令："
echo "  pm2 status           # 查看服务状态"
echo "  pm2 logs             # 查看日志"
echo "  pm2 restart all      # 重启所有服务"
echo "  pm2 stop all         # 停止所有服务"
echo ""
echo "如需配置开机自启，请运行："
echo "  pm2 startup systemd"
echo "  pm2 save"
echo ""
echo "=============================================="
