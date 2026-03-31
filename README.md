# CV Learn - 机器视觉 AI 学习平台

基于 React + Express + SQLite + DashScope AI 的在线刷题系统，支持用户系统、数据持久化、AI 出题等功能。

## ✨ 核心功能

### 🎯 用户系统
- 用户注册 / 登录（JWT 认证）
- 密码加密存储（bcrypt）
- 用户状态持久化
- 访客模式支持

### 📚 刷题练习
- 题库：150+ 道机器视觉选择题
- 知识点分类：目标检测、CNN、OpenCV、图像处理等
- 难度分级：简单、中等、困难
- 实时判断答案正误
- 详细解析展示

### 🤖 AI 能力
- **AI 详细解析**：接入阿里云通义千问，生成个性化解析
- **AI 智能出题**：根据知识点和难度自动生成新题
- 支持 Markdown 格式渲染

### 📖 错题本
- 自动记录错题（后端存储）
- 按用户隔离数据
- 支持移除/清空错题
- 错题重做功能

### 📊 数据统计
- 实时答题统计（总数/正确/错误）
- 正确率计算
- 做题记录历史

### 🏆 排行榜
- 按正确数和正确率排名
- 查看个人排名
- TOP 50 用户榜单

## 🚀 快速开始

### 1. 配置环境变量

编辑 `backend/.env` 文件：

```env
PORT=3001
JWT_SECRET=your_jwt_secret_key_change_in_prod
DASHSCOPE_API_KEY=sk-your-api-key-here
```

### 2. 启动后端

```bash
cd backend
npm run dev
```

后端运行在：`http://localhost:3001`

### 3. 启动前端

```bash
cd frontend
npm run dev
```

前端运行在：`http://localhost:5173`

### 4. 配置 API Key

1. 访问前端页面，进入"设置"页面
2. 输入 DashScope API Key
3. 点击"保存配置"

### 5. 获取 DashScope API Key

1. 访问 https://dashscope.console.aliyun.com/
2. 登录/注册阿里云账号
3. 开通"模型服务"（通义千问）
4. 在"API-KEY 管理"创建新的 API Key

## 📁 项目结构

```
cv-learn/
├── backend/
│   ├── config/
│   │   └── database.js          # SQLite 数据库配置
│   ├── controllers/
│   │   ├── authController.js    # 用户认证
│   │   ├── questionsController.js # 题目管理
│   │   ├── wrongQuestionsController.js # 错题本
│   │   ├── aiController.js      # AI 出题
│   │   └── rankController.js    # 排行榜
│   ├── middleware/
│   │   ├── auth.js              # JWT 认证中间件
│   │   └── apiKey.js            # API Key 验证
│   ├── routes/
│   │   ├── auth.js
│   │   ├── questions.js
│   │   ├── wrongQuestions.js
│   │   ├── ai.js
│   │   └── rank.js
│   ├── services/
│   │   └── dashscopeService.js  # DashScope AI 服务
│   ├── data/
│   │   ├── questions.json       # 初始题库
│   │   └── cv_learn.db          # SQLite 数据库
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── quizApi.js       # API 调用封装
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── QuizCard.jsx
│   │   │   ├── CategoryFilter.jsx
│   │   │   └── WrongQuestionsBook.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx  # 认证上下文
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── QuizPage.jsx
│   │   │   ├── WrongQuestionsPage.jsx
│   │   │   ├── RankPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## 🔌 API 接口

### 用户认证

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/auth/register | 用户注册 | ❌ |
| POST | /api/auth/login | 用户登录 | ❌ |
| GET | /api/auth/profile | 获取用户信息 | ✅ |

### 题目相关

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/questions | 获取所有题目 | ❌ |
| GET | /api/questions/random | 获取随机题目 | ❌ |
| GET | /api/questions/categories | 获取分类列表 | ❌ |
| GET | /api/questions/filter | 筛选题目 | ❌ |
| POST | /api/questions/check | 检查答案 | ✅ |
| POST | /api/questions/ai-explain | AI 解析 | ✅ + API Key |
| POST | /api/questions/test-connection | 测试 API Key | ✅ + API Key |

### 错题本

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/wrong-questions | 获取错题列表 | ✅ |
| POST | /api/wrong-questions | 添加错题 | ✅ |
| DELETE | /api/wrong-questions/:id | 移除错题 | ✅ |
| DELETE | /api/wrong-questions/clear/all | 清空错题 | ✅ |

### AI 出题

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/ai/generate | AI 生成新题 | ✅ + API Key |

### 排行榜

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/rank | 获取排行榜 | ❌ |
| GET | /api/rank/my-rank | 获取我的排名 | ✅ |

## 🔒 安全特性

- 密码使用 bcrypt 加密存储
- JWT Token 认证（7 天有效期）
- 请求拦截器自动携带 Token
- Token 过期自动跳转登录
- API Key 本地存储，不上传服务器

## 🛠️ 技术栈

### 前端
- React 18 + Vite
- React Router（路由）
- TailwindCSS（样式）
- Axios（HTTP 请求）

### 后端
- Node.js + Express
- better-sqlite3（数据库）
- bcrypt（密码加密）
- jsonwebtoken（JWT 认证）
- axios（HTTP 请求）

### AI 服务
- 阿里云 DashScope（通义千问）

## 📝 数据库表结构

### users（用户表）
| 字段 | 类型 | 描述 |
|------|------|------|
| id | TEXT | 用户 ID（UUID） |
| username | TEXT | 用户名（唯一） |
| password | TEXT | 加密密码 |
| created_at | TEXT | 创建时间 |

### questions（题目表）
| 字段 | 类型 | 描述 |
|------|------|------|
| id | INTEGER | 题目 ID |
| topic | TEXT | 知识点 |
| subtopic | TEXT | 子知识点 |
| difficulty | TEXT | 难度 |
| question | TEXT | 题目内容 |
| options | TEXT | 选项（JSON） |
| answer | TEXT | 正确答案 |
| explanation | TEXT | 解析 |

### wrong_questions（错题表）
| 字段 | 类型 | 描述 |
|------|------|------|
| id | INTEGER | 记录 ID |
| user_id | TEXT | 用户 ID |
| question_id | INTEGER | 题目 ID |
| user_answer | TEXT | 用户答案 |
| created_at | TEXT | 创建时间 |

### question_records（做题记录表）
| 字段 | 类型 | 描述 |
|------|------|------|
| id | INTEGER | 记录 ID |
| user_id | TEXT | 用户 ID |
| question_id | INTEGER | 题目 ID |
| user_answer | TEXT | 用户答案 |
| is_correct | INTEGER | 是否正确 |
| timestamp | TEXT | 时间戳 |

### user_stats（用户统计表）
| 字段 | 类型 | 描述 |
|------|------|------|
| id | INTEGER | 记录 ID |
| user_id | TEXT | 用户 ID |
| total_count | INTEGER | 总题数 |
| correct_count | INTEGER | 正确数 |
| wrong_count | INTEGER | 错误数 |
| updated_at | TEXT | 更新时间 |

## 🐛 常见问题

### API Key 无效
- 检查 API Key 格式是否正确（以 sk- 开头）
- 确认阿里云账号已开通 DashScope 服务
- 检查 API Key 是否有余额

### 无法登录
- 检查后端是否启动（http://localhost:3001）
- 检查用户名密码是否正确
- 清除浏览器缓存后重试

### 数据库初始化失败
- 删除 `backend/data/cv_learn.db` 重新生成
- 检查文件权限

## 📄 License

MIT
