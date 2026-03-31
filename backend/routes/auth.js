const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/register - 用户注册
router.post('/register', authController.register);

// POST /api/auth/login - 用户登录
router.post('/login', authController.login);

// GET /api/auth/profile - 获取用户信息（需要登录）
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
