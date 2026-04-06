const express = require('express');
const router = express.Router();
const wrongQuestionsController = require('../controllers/wrongQuestionsController');
const { requireAuth } = require('../middleware/auth');

// 所有路由都需要登录认证
router.use(requireAuth);

// GET /api/wrong-questions - 获取错题列表
router.get('/', wrongQuestionsController.getWrongQuestions);

// POST /api/wrong-questions - 添加错题
router.post('/', wrongQuestionsController.addWrongQuestion);

// DELETE /api/wrong-questions/:questionId - 移除错题
router.delete('/:questionId', wrongQuestionsController.removeWrongQuestion);

// DELETE /api/wrong-questions/clear/all - 清空所有错题
router.delete('/clear/all', wrongQuestionsController.clearWrongQuestions);

module.exports = router;
