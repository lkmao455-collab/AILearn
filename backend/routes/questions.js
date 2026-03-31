const express = require('express');
const router = express.Router();
const questionsController = require('../controllers/questionsController');
const apiAuth = require('../middleware/apiAuth');

// GET /api/questions - 获取所有题目
router.get('/', questionsController.getAllQuestions);

// GET /api/questions/random - 获取随机题目
router.get('/random', questionsController.getRandomQuestion);

// GET /api/questions/categories - 获取分类列表
router.get('/categories', questionsController.getCategories);

// GET /api/questions/filter - 根据分类筛选题目
router.get('/filter', questionsController.getQuestionsByCategory);

// GET /api/questions/:id - 根据 ID 获取题目
router.get('/:id', questionsController.getQuestionById);

// POST /api/questions/check - 检查答案
router.post('/check', questionsController.checkAnswer);

// POST /api/questions/ai-explain - AI 详细解析（需要 API Key）
router.post('/ai-explain', apiAuth, questionsController.aiExplain);

// POST /api/questions/test-connection - 测试 API Key 连接（需要 API Key）
router.post('/test-connection', apiAuth, questionsController.testConnection);

module.exports = router;
