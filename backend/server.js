require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const questionsRouter = require('./routes/questions');
const authRouter = require('./routes/auth');
const wrongQuestionsRouter = require('./routes/wrongQuestions');
const aiRouter = require('./routes/ai');
const rankRouter = require('./routes/rank');

const { initQuestions } = require('./controllers/questionsController');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 配置
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://cv-learn-frontend.onrender.com',
      'https://ailearn-8p3f.onrender.com',
      'https://ailearn-frontend.onrender.com',
      process.env.FRONTEND_URL,
    ].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // 允许无来源的请求（如移动端或curl）
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true
}));

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 路由
app.use('/api/questions', questionsRouter);
app.use('/api/auth', authRouter);
app.use('/api/wrong-questions', wrongQuestionsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/rank', rankRouter);

// 根路径 - 返回 API 信息
app.get('/', (req, res) => {
  res.json({
    name: 'CV Learn API',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      questions: '/api/questions',
      auth: '/api/auth',
      wrongQuestions: '/api/wrong-questions',
      ai: '/api/ai',
      rank: '/api/rank'
    }
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CV Learn Server is running', timestamp: new Date().toISOString() });
});

// 初始化数据库和题库（异步）
(async () => {
  try {
    await initQuestions();
    console.log('✅ 数据库初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
  }
})();

// 启动服务器 - 绑定到 0.0.0.0 以支持 Render 等云平台
app.listen(PORT, '0.0.0.0', () => {
  const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║           🚀 CV Learn Server 已启动                      ║');
  console.log('║                                                          ║');
  console.log(`║  🌐 访问地址：${baseUrl.padEnd(52 - baseUrl.length, ' ')} ║`);
  console.log(`║  📚 API 端点：${(baseUrl + '/api').padEnd(52 - baseUrl.length - 4, ' ')} ║`);
  console.log('║                                                          ║');
  console.log('║  主要接口：                                               ║');
  console.log('║  • POST /api/auth/register  - 用户注册                   ║');
  console.log('║  • POST /api/auth/login     - 用户登录                   ║');
  console.log('║  • GET  /api/questions      - 获取所有题目               ║');
  console.log('║  • GET  /api/wrong-questions - 获取错题本                ║');
  console.log('║  • POST /api/ai/generate    - AI 生成新题                 ║');
  console.log('║  • GET  /api/rank           - 获取排行榜                 ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
});

// 生产环境：托管前端静态文件
if (process.env.NODE_ENV === 'production') {
  // 设置静态文件目录
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // 所有非API请求都返回前端页面
  app.get('*', (req, res) => {
    // 如果是API请求，返回404
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    // 否则返回前端页面
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

module.exports = app;
