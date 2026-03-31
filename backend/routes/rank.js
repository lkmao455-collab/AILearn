const express = require('express');
const router = express.Router();
const rankController = require('../controllers/rankController');
const authMiddleware = require('../middleware/auth');

// GET /api/rank - 获取排行榜（公开）
router.get('/', rankController.getRanking);

// GET /api/rank/my-rank - 获取我的排名（需要登录）
router.get('/my-rank', authMiddleware, rankController.getUserRank);

module.exports = router;
