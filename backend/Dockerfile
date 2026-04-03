# 后端 Dockerfile
FROM node:18-alpine

# 安装必要的系统依赖（用于 better-sqlite3 编译）
RUN apk add --no-cache python3 make g++ curl

# 设置工作目录
WORKDIR /app

# 复制 package.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 确保数据目录存在
RUN mkdir -p /app/data /app/logs

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# 启动命令
CMD ["node", "server.js"]
