# CV Learn Backend - Dockerfile for Render
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制后端文件
COPY backend/package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制后端代码
COPY backend/ ./

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "server.js"]
