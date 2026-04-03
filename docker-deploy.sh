#!/bin/bash
# CV Learn Docker 部署脚本
# 使用方法: ./docker-deploy.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# 检查 Docker 和 Docker Compose
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker 未安装，请先安装 Docker"
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose 未安装，请先安装"
    fi
}

# 获取 Docker Compose 命令
get_compose_cmd() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    else
        echo "docker-compose"
    fi
}

info "开始 Docker 部署 CV Learn..."

# 1. 检查环境
check_docker
COMPOSE_CMD=$(get_compose_cmd)
info "使用命令: $COMPOSE_CMD"

# 2. 检查 .env 文件
if [ ! -f .env ]; then
    warn ".env 文件不存在，创建默认配置..."
    cat > .env << 'EOF'
# JWT 密钥（请修改为强密码）
JWT_SECRET=your-super-secret-key-change-this-in-production

# 阿里云 DashScope API Key（必填）
DASHSCOPE_API_KEY=sk-your-dashscope-api-key

# 服务器 IP 或域名（用于前端构建）
SERVER_IP=your-server-ip
EOF
    error "请编辑 .env 文件，填入正确的配置后再运行此脚本"
fi

# 3. 加载环境变量并更新 docker-compose
info "加载环境变量..."
export $(grep -v '^#' .env | xargs)

if [ -z "$SERVER_IP" ] || [ "$SERVER_IP" = "your-server-ip" ]; then
    # 自动获取 IP
    SERVER_IP=$(hostname -I | awk '{print $1}')
    info "自动检测到服务器 IP: $SERVER_IP"
    sed -i "s/your-server-ip/$SERVER_IP/g" docker-compose.yml
fi

# 4. 构建和启动
info "构建并启动容器..."
$COMPOSE_CMD down 2>/dev/null || true
$COMPOSE_CMD build --no-cache
$COMPOSE_CMD up -d

# 5. 等待服务启动
info "等待服务启动..."
sleep 5

# 6. 健康检查
info "进行健康检查..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    info "后端服务健康检查通过"
else
    warn "后端服务可能未完全启动，请稍后再试"
fi

# 7. 显示状态
info "部署完成！"
echo ""
echo "=============================================="
echo "CV Learn Docker 部署成功！"
echo "=============================================="
echo ""
echo "访问地址："
echo "  • 前端: http://$SERVER_IP"
echo "  • 后端 API: http://$SERVER_IP:3001/api"
echo ""
echo "常用命令："
echo "  $COMPOSE_CMD ps        # 查看容器状态"
echo "  $COMPOSE_CMD logs -f   # 查看实时日志"
echo "  $COMPOSE_CMD down      # 停止服务"
echo "  $COMPOSE_CMD restart   # 重启服务"
echo ""
echo "数据持久化："
echo "  • 数据库文件: ./backend/data/"
echo "=============================================="
