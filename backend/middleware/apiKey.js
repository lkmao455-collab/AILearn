/**
 * API Key 验证中间件
 * 验证用户是否提供了有效的 DashScope API Key
 * 支持三种方式传递 API Key：
 * 1. Authorization: Bearer <api-key>
 * 2. X-API-Key: <api-key>
 * 3. 请求体中的 apiKey 字段
 */

const apiKeyMiddleware = (req, res, next) => {
  // 方式1: 从 Authorization header 获取 (Bearer token)
  const authHeader = req.headers.authorization;
  // 方式2: 从 X-API-Key header 获取
  const xApiKey = req.headers['x-api-key'];
  // 方式3: 从请求体获取
  const bodyApiKey = req.body?.apiKey;

  let apiKey = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7); // 去掉 'Bearer ' 前缀
  } else if (xApiKey) {
    apiKey = xApiKey;
  } else if (bodyApiKey) {
    apiKey = bodyApiKey;
  }

  if (!apiKey || apiKey.trim() === '') {
    return res.status(400).json({
      success: false,
      message: '请在请求头中提供 API Key，格式：Authorization: Bearer <your-api-key> 或 X-API-Key: <your-api-key>'
    });
  }

  // 将 API Key 附加到请求对象，供后续使用
  req.apiKey = apiKey.trim();
  next();
};

module.exports = apiKeyMiddleware;
