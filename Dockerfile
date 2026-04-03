# CV Learn Backend - Dockerfile for Render (多阶段构建)

# 阶段 1: 编译阶段
FROM node:20-slim AS builder

# 安装编译工具
RUN apt-get update && apt-get install -y python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制并安装依赖
COPY backend/package*.json ./
RUN npm ci

# 复制代码
COPY backend/ ./

# 阶段 2: 运行阶段 (更小的镜像)
FROM node:20-slim

WORKDIR /app

# 只复制编译后的 node_modules 和代码
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/ ./

# 创建数据目录
RUN mkdir -p data

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "server.js"]
