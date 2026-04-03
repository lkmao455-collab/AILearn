# CV Learn Backend - Dockerfile for Render
FROM node:20-slim

# 安装 Python（用于编译原生模块）
RUN apt-get update && apt-get install -y python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制后端文件
COPY backend/package*.json ./

# 安装所有依赖
RUN npm ci

# 复制后端代码
COPY backend/ ./

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "server.js"]
