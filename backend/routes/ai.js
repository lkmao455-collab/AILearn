const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const apiKeyMiddleware = require('../middleware/apiKey');
const authMiddleware = require('../middleware/auth');

// POST /api/ai/generate - AI 生成新题
router.post('/generate', authMiddleware, apiKeyMiddleware, aiController.generateQuestion);

module.exports = router;
