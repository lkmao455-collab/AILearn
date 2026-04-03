# CV Learn - Render 部署指南

## 快速部署步骤

### 1. 准备代码
确保代码已推送到 GitHub/GitLab 仓库。

### 2. 修改前端 API 地址
部署前需要修改 `frontend/src/api/quizApi.js` 中的 `API_BASE_URL`：

```javascript
// 开发环境
const API_BASE_URL = 'http://localhost:3001/api'

// 生产环境（部署时使用）
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
```

### 3. 在 Render 上部署

#### 方法一：使用 Blueprint（推荐）
1. 访问 https://dashboard.render.com/
2. 点击 "New" -> "Blueprint"
3. 选择你的 GitHub/GitLab 仓库
4. Render 会自动读取 `render.yaml` 配置
5. 点击 "Apply" 部署

#### 方法二：手动部署

**后端服务：**
1. 点击 "New" -> "Web Service"
2. 选择你的仓库
3. 配置：
   - Name: `cv-learn-backend`
   - Region: `Singapore` (离你最近)
   - Branch: `main`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `backend`
4. 添加环境变量：
   - `JWT_SECRET`: 随机字符串（用于JWT签名）
   - `DASHSCOPE_API_KEY`: 你的阿里云DashScope API密钥
5. 点击 "Create Web Service"

**前端静态站点：**
1. 点击 "New" -> "Static Site"
2. 选择你的仓库
3. 配置：
   - Name: `cv-learn-frontend`
   - Branch: `main`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. 点击 "Create Static Site"

### 4. 配置环境变量（重要）

**⚠️ 注意：代码中不包含任何 API 密钥，你需要在 Render 后台手动设置**

部署完成后，在 Render Dashboard 中找到 `cv-learn-backend` 服务：

1. 点击 "Environment" 标签
2. 添加以下环境变量：
   - `DASHSCOPE_API_KEY`: 你的阿里云 DashScope API 密钥
     - 获取地址：https://dashscope.aliyun.com/
   - `JWT_SECRET`: 随机字符串（可选，不设置会自动生成）
部署后，需要修改后端 `backend/server.js` 中的 CORS 配置：

```javascript
// 开发环境
app.use(cors());

// 生产环境
const allowedOrigins = [
  'https://cv-learn-frontend.onrender.com',  // 你的前端域名
  'http://localhost:5173',  // 本地开发
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

### 5. ⚠️ 重要提示

**数据持久化问题：**
- Render 免费套餐的文件系统是 **ephemeral**（临时性的）
- 每次部署或重启后，SQLite 数据库会重置
- 如果需要持久化数据，建议：
  1. 使用 Render 的 PostgreSQL 免费套餐
  2. 定期备份数据库文件
  3. 升级到付费套餐使用持久化磁盘

**休眠问题：**
- 免费套餐在 15 分钟无请求后会进入休眠
- 第一次访问会有冷启动延迟（约 5-30 秒）

**API Key：**
- 前端代码在构建时会嵌入 API URL
- 确保后端服务先部署完成，再部署前端

## 访问地址

部署完成后，你可以通过以下地址访问：
- 前端：https://cv-learn-frontend.onrender.com
- 后端：https://cv-learn-backend.onrender.com

## 更新部署

只需推送代码到仓库，Render 会自动重新部署。

```bash
git add .
git commit -m "update for deploy"
git push origin main
```
