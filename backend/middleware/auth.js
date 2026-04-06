const jwt = require('jsonwebtoken');

// 可选认证中间件 - 用于需要识别用户但不强制登录的路由
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 如果 Authorization header 存在但不是 Bearer token 格式，跳过认证
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // 没有 Authorization header，跳过认证
  }

  const token = authHeader.substring(7); // 去掉 'Bearer ' 前缀

  // 检查是否是 API Key (DashScope API Key 以 sk- 开头)
  if (token.startsWith('sk-')) {
    return next(); // 这是 API Key，不是 JWT token，跳过认证
  }

  // 这是 JWT token，进行验证
  if (!token) {
    return res.status(401).json({ message: '未登录，请先登录' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token 无效或已过期' });
  }
};

// 强制认证中间件 - 用于必须登录才能访问的路由
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 检查 Authorization header 是否存在
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未登录，请先登录' });
  }

  const token = authHeader.substring(7); // 去掉 'Bearer ' 前缀

  // 检查是否是 API Key (DashScope API Key 以 sk- 开头)
  if (token.startsWith('sk-')) {
    return res.status(401).json({ message: '请使用用户登录token，而不是API Key' });
  }

  // 验证 JWT token
  if (!token) {
    return res.status(401).json({ message: '未登录，请先登录' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token 无效或已过期' });
  }
};

module.exports = authMiddleware;
module.exports.requireAuth = requireAuth;
