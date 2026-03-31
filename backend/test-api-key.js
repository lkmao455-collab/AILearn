/**
 * API Key 连接测试脚本
 * 用于测试 DashScope API Key 是否有效
 */

require('dotenv').config();
const axios = require('axios');

// DashScope API URL (兼容 OpenAI 格式)
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

/**
 * 测试 API Key 连接
 * @param {string} apiKey - DashScope API Key
 * @returns {Promise<object>} 测试结果
 */
async function testApiKeyConnection(apiKey) {
  try {
    console.log('正在测试 API Key 连接...');
    console.log('API Key 前缀:', apiKey.substring(0, 10) + '...');

    const response = await axios.post(
      `${DASHSCOPE_API_URL}/chat/completions`,
      {
        model: 'qwen3.5-plus',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.7,
        max_tokens: 10
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    console.log('\n✅ 连接测试成功！');
    console.log('API Key 有效');
    console.log('响应模型:', response.data.model);
    console.log('响应时间:', new Date().toISOString());

    return {
      success: true,
      message: '连接测试成功！API Key 有效',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('\n❌ 连接测试失败！');

    if (error.response) {
      const status = error.response.status;
      console.log('HTTP 状态码:', status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));

      let message = '';
      if (status === 401) message = 'API Key 无效';
      else if (status === 429) message = '请求频率超限';
      else if (status === 400) message = '请求参数错误';
      else if (status === 500) message = 'DashScope 服务暂时不可用';
      else message = `DashScope API 错误 (${status})`;

      return {
        success: false,
        message,
        status,
        error: error.response.data
      };
    } else if (error.code === 'ECONNABORTED') {
      console.log('错误: 请求超时');
      return {
        success: false,
        message: '请求超时'
      };
    } else {
      console.log('错误:', error.message);
      return {
        success: false,
        message: `网络错误：${error.message}`
      };
    }
  }
}

/**
 * 主函数
 */
async function main() {
  // 优先使用命令行参数，其次使用环境变量
  const apiKey = process.argv[2] || process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    console.error('错误: 请提供 API Key');
    console.log('用法: node test-api-key.js <api-key>');
    console.log('或设置环境变量: DASHSCOPE_API_KEY=<api-key>');
    process.exit(1);
  }

  // 检查是否使用了默认的占位符 API Key
  if (apiKey === 'sk-your-api-key-here') {
    console.error('错误: 请配置有效的 API Key');
    console.log('当前 .env 文件中的 API Key 是默认占位符');
    console.log('用法: node test-api-key.js <api-key>');
    process.exit(1);
  }

  const result = await testApiKeyConnection(apiKey);

  // 输出测试结果
  console.log('\n========================================');
  console.log('测试结果:');
  console.log('========================================');
  console.log('成功:', result.success);
  console.log('消息:', result.message);
  console.log('时间:', result.timestamp);
  console.log('========================================');

  // 退出时根据测试结果设置退出码
  process.exit(result.success ? 0 : 1);
}

// 执行主函数
main().catch(console.error);