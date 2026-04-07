const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const isPostgres = require('../config/database').isPostgres;

// 查询辅助函数
const getQuery = async (stmt, ...params) => {
  const result = stmt.get(...params);
  return result instanceof Promise ? await result : result;
};

const runQuery = async (stmt, ...params) => {
  const result = stmt.run(...params);
  return result instanceof Promise ? await result : result;
};

// 用户注册
const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: '密码长度至少为 6 位' });
    }

    // 检查用户名是否已存在
    const existingUserStmt = db.prepare('SELECT id FROM users WHERE username = ?');
    const existingUser = await getQuery(existingUserStmt, username);
    if (existingUser) {
      return res.status(409).json({ message: '用户名已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // 插入新用户
    const insertUserStmt = db.prepare(`
      INSERT INTO users (id, username, password) VALUES (?, ?, ?)
    `);
    await runQuery(insertUserStmt, userId, username, hashedPassword);

    // 初始化用户统计
    const insertStatsStmt = db.prepare(`
      INSERT INTO user_stats (user_id, total_count, correct_count, wrong_count)
      VALUES (?, 0, 0, 0)
    `);
    await runQuery(insertStatsStmt, userId);

    res.status(201).json({
      message: '注册成功',
      user: { id: userId, username }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ message: '注册失败，请稍后重试' });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    // 查找用户
    const userStmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = await getQuery(userStmt, username);
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '登录失败，请稍后重试' });
  }
};

// 获取当前用户信息
const getProfile = async (req, res) => {
  try {
    const userStmt = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?');
    const user = await getQuery(userStmt, req.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 获取用户统计
    const statsStmt = db.prepare('SELECT * FROM user_stats WHERE user_id = ?');
    const stats = await getQuery(statsStmt, req.userId);

    res.json({
      user,
      stats: stats || { total_count: 0, correct_count: 0, wrong_count: 0 }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ message: '获取用户信息失败' });
  }
};

module.exports = {
  register,
  login,
  getProfile
};
