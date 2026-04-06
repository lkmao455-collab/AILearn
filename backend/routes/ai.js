const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const apiKeyMiddleware = require('../middleware/apiKey');
const { requireAuth } = require('../middleware/auth');

// POST /api/ai/generate - AI 生成新题（需要登录）
router.post('/generate', requireAuth, apiKeyMiddleware, aiController.generateQuestion);

module.exports = router;
