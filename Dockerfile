# CV Learn Backend - Dockerfile for Render
FROM node:20-slim

# 安装 Python（用于编译原生模块）
RUN apt-get update && apt-get install -y python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 只复制 package 文件（不复制 node_modules）
COPY backend/package*.json ./

# 删除可能存在的本地 node_modules（重要！）
RUN rm -rf node_modules package-lock.json

# 重新安装依赖（在容器内编译原生模块）
RUN npm install

# 复制后端代码（排除 node_modules）
COPY backend/ ./

# 再次确保没有错误的本地模块
RUN rm -rf node_modules/better-sqlite3/build/Release/*.node 2>/dev/null || true

# 重新编译 better-sqlite3
RUN npm rebuild better-sqlite3

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "server.js"]
