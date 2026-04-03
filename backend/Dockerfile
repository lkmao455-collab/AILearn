# CV Learn Backend - Dockerfile for Render
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制后端代码
COPY . .

# Render 会自动设置 PORT 环境变量
# 应用会监听 process.env.PORT 或默认 3001
EXPOSE 3001

# 启动命令
CMD ["node", "server.js"]
