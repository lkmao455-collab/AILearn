# CV Learn - 机器视觉 AI 学习刷题平台

基于 React + Vite + Node.js + Express 构建的机器视觉知识学习平台。

## 功能特点

- 📚 200+ 道机器视觉精选题目
- 🤖 AI 智能解析
- 📕 错题本功能
- 📊 实时统计正确率
- 🎨 现代化 UI 设计

## 技术栈

### 前端
- React 18
- Vite 5
- TailwindCSS 3
- React Router 6
- Axios

### 后端
- Node.js
- Express 4
- CORS

## 快速开始

### 1. 启动后端

```bash
cd backend
npm install
node server.js
```

后端服务将在 http://localhost:3001 启动

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端服务将在 http://localhost:5173 启动

## API 接口

- `GET /api/questions` - 获取所有题目
- `GET /api/questions/random` - 获取随机题目
- `POST /api/questions/check` - 检查答案
- `POST /api/questions/ai-explain` - 获取 AI 解析

## 项目结构

```
project-root/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── backend/
    ├── controllers/
    ├── routes/
    ├── data/
    ├── server.js
    └── package.json
```
