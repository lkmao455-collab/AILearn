# CV Learn Backend

机器视觉 AI 学习平台后端服务

## 启动方式

```bash
npm install
node server.js
```

## API 接口

- `GET /api/health` - 健康检查
- `GET /api/questions` - 获取所有题目
- `GET /api/questions/random` - 获取随机题目
- `POST /api/questions/check` - 检查答案
- `POST /api/questions/ai-explain` - 获取 AI 解析
