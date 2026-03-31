require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const questionsRouter = require('./routes/questions');
const authRouter = require('./routes/auth');
const wrongQuestionsRouter = require('./routes/wrongQuestions');
const aiRouter = require('./routes/ai');
const rankRouter = require('./routes/rank');

const { initQuestions } = require('./controllers/questionsController');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());

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

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CV Learn Server is running', timestamp: new Date().toISOString() });
});

// 初始化数据库和题库
try {
  initQuestions();
  console.log('✅ 数据库初始化完成');
} catch (error) {
  console.error('❌ 数据库初始化失败:', error);
}

// 启动服务器
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║           🚀 CV Learn Server 已启动                      ║');
  console.log('║                                                          ║');
  console.log(`║  🌐 本地访问：http://localhost:${PORT}                      ║`);
  console.log(`║  📚 API 端点：http://localhost:${PORT}/api                   ║`);
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

module.exports = app;
