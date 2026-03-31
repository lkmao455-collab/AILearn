# CLAUDE.md

CV Learn - 机器视觉 AI 学习平台

## 快速启动

```bash
# Windows PowerShell
.\start.ps1

# 或手动启动
cd backend && npm run dev  # 后端端口 3001
cd frontend && npm run dev  # 前端端口 5173
```

## 项目架构

### 技术栈
- **前端**: React 18 + Vite + TailwindCSS + React Router
- **后端**: Node.js + Express + better-sqlite3
- **AI**: 阿里云 DashScope (通义千问)
- **认证**: JWT + bcrypt

### 目录结构
```
cv-learn/
├── backend/
│   ├── config/database.js      # SQLite 配置 + 表结构
│   ├── controllers/            # 业务逻辑
│   │   ├── authController.js   # 用户认证
│   │   ├── questionsController.js # 题目管理
│   │   ├── wrongQuestionsController.js # 错题本
│   │   ├── aiController.js     # AI 出题
│   │   └── rankController.js   # 排行榜
│   ├── middleware/
│   │   ├── auth.js             # JWT 认证
│   │   └── apiKey.js           # API Key 验证
│   ├── routes/                 # API 路由
│   ├── services/               # 外部服务
│   │   └── dashscopeService.js # DashScope AI
│   ├── data/
│   │   ├── questions.json      # 初始题库
│   │   └── cv_learn.db         # SQLite 数据库
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/quizApi.js      # API 调用封装
│   │   ├── contexts/AuthContext.jsx # 认证上下文
│   │   ├── components/         # 可复用组件
│   │   └── pages/              # 页面组件
│   └── index.html
└── start.ps1 / start.bat       # 启动脚本
```

## 数据库表

- **users**: 用户表 (id, username, password, created_at)
- **questions**: 题目表 (id, topic, difficulty, question, options, answer, explanation)
- **wrong_questions**: 错题表 (user_id, question_id, user_answer, created_at)
- **question_records**: 做题记录 (user_id, question_id, user_answer, is_correct, timestamp)
- **user_stats**: 用户统计 (user_id, total_count, correct_count, wrong_count)

## API 接口

### 认证
- POST /api/auth/register - 注册
- POST /api/auth/login - 登录
- GET /api/auth/profile - 用户信息 (需 JWT)

### 题目
- GET /api/questions - 所有题目
- GET /api/questions/random - 随机题目
- GET /api/questions/categories - 分类
- GET /api/questions/filter - 筛选
- POST /api/questions/check - 检查答案 (需 JWT)
- POST /api/questions/ai-explain - AI 解析 (需 API Key)

### 错题本
- GET /api/wrong-questions - 错题列表 (需 JWT)
- POST /api/wrong-questions - 添加错题 (需 JWT)
- DELETE /api/wrong-questions/:id - 移除错题 (需 JWT)

### AI 出题
- POST /api/ai/generate - AI 生成新题 (需 JWT + API Key)

### 排行榜
- GET /api/rank - 排行榜
- GET /api/rank/my-rank - 我的排名 (需 JWT)

## 开发规范

1. **密码加密**: 使用 bcrypt 加密存储
2. **认证**: JWT Token，有效期 7 天
3. **API Key**: 前端本地存储，不上传服务器
4. **数据库**: SQLite 文件位于 backend/data/cv_learn.db
5. **前端 API**: 统一使用 src/api/quizApi.js 封装

## 环境变量

编辑 `backend/.env`:
```env
PORT=3001
JWT_SECRET=your_secret_key
DASHSCOPE_API_KEY=sk-your-key
```
