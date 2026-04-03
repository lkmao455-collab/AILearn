# CV Learn Backend - Dockerfile for Render
FROM node:20-alpine

# 安装构建工具（用于编译原生模块）
RUN apk add --no-cache python3 make g++

# 设置工作目录
WORKDIR /app

# 复制后端文件
COPY backend/package*.json ./

# 安装所有依赖（包括 devDependencies，因为需要编译 better-sqlite3）
RUN npm ci

# 复制后端代码
COPY backend/ ./

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "server.js"]
