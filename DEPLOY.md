# CV Learn 部署指南

本文档介绍如何将 CV Learn 部署到远程服务器。

## 部署方式选择

| 方式 | 适合场景 | 难度 | 维护成本 |
|------|----------|------|----------|
| **Docker 部署** | 有 Docker 经验，追求简单 | ⭐⭐ | 低 |
| **VPS 手动部署** | 需要精细控制，无 Docker | ⭐⭐⭐ | 中 |
| **云托管平台** | 快速验证，不想管服务器 | ⭐ | 最低 |

---

## 方案一：Docker 部署（推荐）

### 1. 服务器准备

购买云服务器（推荐）：
- 阿里云轻量应用服务器
- 腾讯云轻量应用服务器
- 最低配置：1核2G，CentOS/Ubuntu

### 2. 安装 Docker

```bash
# CentOS/RHEL
curl -fsSL https://get.docker.com | sh
sudo systemctl start docker
sudo systemctl enable docker

# Ubuntu
curl -fsSL https://get.docker.com | sh
sudo systemctl start docker
sudo systemctl enable docker
```

### 3. 上传代码

```bash
# 本地打包上传
tar -czvf cv-learn.tar.gz cv-learn/
# 使用 scp 或宝塔面板上传到服务器

# 或在服务器上直接克隆
git clone <你的仓库地址>
```

### 4. 部署

```bash
cd cv-learn

# 复制环境变量配置
cp .env.example .env

# 编辑 .env 文件，填入必要的配置
nano .env
# 必填项：
# - JWT_SECRET: 随机字符串
# - DASHSCOPE_API_KEY: 阿里云 API Key

# 运行部署脚本
chmod +x docker-deploy.sh
./docker-deploy.sh
```

### 5. 访问

部署完成后，通过服务器 IP 访问：
- 前端：`http://服务器IP`
- 后端 API：`http://服务器IP:3001/api`

---

## 方案二：VPS 手动部署

### 1. 环境准备

```bash
# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 安装 Nginx
sudo apt-get install -y nginx
```

### 2. 部署

```bash
cd cv-learn
chmod +x deploy.sh
./deploy.sh
```

脚本会自动：
- 安装依赖
- 构建前端
- 配置 Nginx
- 启动后端服务

### 3. 配置开机自启

```bash
pm2 startup systemd
pm2 save
```

---

## 方案三：Railway / Render（云托管）

### Railway

1. 推送代码到 GitHub
2. 登录 [railway.app](https://railway.app)
3. 新建 Project → Deploy from GitHub repo
4. 添加环境变量：
   - `JWT_SECRET`
   - `DASHSCOPE_API_KEY`
5. 自动部署，获得域名

### Render

1. 推送代码到 GitHub
2. 登录 [render.com](https://render.com)
3. New Web Service → Connect GitHub repo
4. 配置：
   - Build Command: `npm ci && npm run build`
   - Start Command: `node server.js`
5. 添加环境变量
6. 部署完成

---

## 常见问题

### Q: 如何获取 DASHSCOPE_API_KEY？

1. 访问 [阿里云 DashScope](https://dashscope.aliyun.com/)
2. 注册并开通服务
3. 创建 API Key
4. 复制到 `.env` 文件

### Q: 如何配置 HTTPS？

使用 Nginx + Certbot：

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期已配置
```

### Q: 数据库在哪里？

- Docker 部署：`./backend/data/cv_learn.db`
- VPS 部署：`./backend/data/cv_learn.db`

建议定期备份此文件。

### Q: 如何更新代码？

**Docker：**
```bash
git pull
docker-compose down
docker-compose up --build -d
```

**VPS：**
```bash
git pull
pm2 restart cv-learn-backend
cd frontend && npm run build
```

### Q: 如何查看日志？

**Docker：**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

**VPS：**
```bash
pm2 logs
pm2 logs cv-learn-backend
```

---

## 安全建议

1. **修改默认 JWT_SECRET**：使用随机生成的强密钥
2. **保护 API Key**：不要提交到代码仓库
3. **防火墙配置**：只开放 80/443/3001 端口
4. **定期备份**：备份数据库文件
5. **使用 HTTPS**：生产环境必须配置 SSL

---

## 性能优化

### 启用 Gzip 压缩

Nginx 配置添加：
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml;
```

### 使用 CDN

静态资源可配置 CDN 加速。

### 数据库优化

SQLite 适合中小型应用，用户量大时考虑迁移到 MySQL/PostgreSQL。
