const axios = require('axios');
const ModelManager = require('../utils/modelManager');

const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// 默认模型（当没有模型列表时使用）
const DEFAULT_MODEL = 'qwen3.5-plus';

// 模型管理器缓存（每个API Key一个实例）
const modelManagerCache = new Map();

/**
 * 获取或创建模型管理器
 * @param {string} apiKey - DashScope API Key
 * @returns {Promise<ModelManager>} 模型管理器实例
 */
async function getModelManager(apiKey) {
  const cacheKey = apiKey.substring(0, 10);
  
  if (modelManagerCache.has(cacheKey)) {
    const manager = modelManagerCache.get(cacheKey);
    // 检查是否还有可用模型
    const stats = manager.getStats();
    if (stats.availableModelsCount > 0) {
      return manager;
    }
    // 如果没有可用模型了，重置并重新初始化
    modelManagerCache.delete(cacheKey);
  }
  
  const manager = new ModelManager(apiKey, {
    batchSize: 10,
    maxRetriesPerModel: 1,
    timeout: 60000
  });
  
  try {
    await manager.initialize();
    modelManagerCache.set(cacheKey, manager);
    return manager;
  } catch (error) {
    console.warn('模型管理器初始化失败，将使用默认模型:', error.message);
    return null;
  }
}

/**
 * 调用 DashScope API 获取 AI 解析（支持多模型切换）
 * @param {string} apiKey - DashScope API Key
 * @param {object} questionData - 题目数据
 * @returns {Promise<string>} AI 生成的解析内容
 */
async function getAIExplanationFromDashScope(apiKey, questionData) {
  const { question, options, correctAnswer, topic, subtopic } = questionData;

  // 构建选项字符串
  const optionsStr = options.map((opt, i) => {
    const label = ['A', 'B', 'C', 'D'][i];
    return `${label}. ${opt}`;
  }).join('\n');

  // 构建 Prompt
  const prompt = `你是一位机器视觉专家，请详细讲解以下选择题，并帮助初学者理解：

📚 **题目内容**
${question}

📝 **选项**
${optionsStr}

✅ **正确答案**：${correctAnswer}

📌 **知识点分类**：${topic} - ${subtopic || '基础概念'}

请按照以下要求详细解析：
1. 用通俗易懂的语言解释核心概念，让零基础的学习者也能理解
2. 举一个现实世界中的实际例子帮助理解这个知识点
3. 补充相关的扩展知识点，帮助学习者建立知识体系
4. 如果有涉及公式或算法原理，简单说明其含义
5. 逐一分析每个选项，解释为什么正确选项是对的，其他选项为什么错
6. 给出学习建议，告诉初学者如何深入掌握这个知识点

请用清晰的 Markdown 格式回答，适当使用 emoji 让内容更生动。`;

  // 验证 API Key
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    throw new Error('API Key 无效或为空');
  }

  // 获取模型管理器
  const modelManager = await getModelManager(apiKey);
  
  const messages = [
    {
      role: 'system',
      content: '你是一位专业的机器视觉和深度学习教育专家，擅长用通俗易懂的方式讲解复杂的技术概念。你的回答应该准确、清晰、有条理，并且对初学者友好。'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  try {
    if (modelManager) {
      // 使用模型管理器（多模型切换）
      console.log('使用模型管理器调用 DashScope API（支持多模型切换）');
      const result = await modelManager.callWithFallback(messages, {
        maxTotalAttempts: 50
      });
      
      if (result.success && result.response) {
        const aiResponse = result.response.choices?.[0]?.message?.content;
        if (aiResponse) {
          console.log(`✓ AI 解析成功，使用模型: ${result.model}，尝试次数: ${result.attempts}`);
          return aiResponse;
        }
      }
      throw new Error('API 返回格式异常');
    } else {
      // 回退到默认模型
      console.log('使用默认模型调用 DashScope API:', DEFAULT_MODEL);
      
      const response = await axios.post(
        `${DASHSCOPE_API_URL}/chat/completions`,
        {
          model: DEFAULT_MODEL,
          messages: messages,
          temperature: 0.5,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      console.log('DashScope 响应: 已生成解析');

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const aiResponse = response.data.choices[0]?.message?.content;
        if (aiResponse) {
          return aiResponse;
        }
      }
      throw new Error('API 返回格式异常：' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error('AI 解析失败:', error.message);
    
    if (error.response) {
      // API 返回错误状态
      const status = error.response.status;
      if (status === 401) {
        throw new Error('API Key 无效，请检查设置');
      } else if (status === 429) {
        throw new Error('请求频率超限，请稍后再试');
      } else if (status === 400) {
        throw new Error('请求参数错误');
      } else if (status === 500) {
        throw new Error('DashScope 服务暂时不可用');
      } else {
        throw new Error(`DashScope API 错误 (${status})`);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('请求超时，请重试');
    } else if (error.message.includes('所有模型都已失败')) {
      throw new Error('所有可用模型都已失败，请稍后重试或检查 API Key');
    } else {
      throw new Error(error.message || '网络错误，请检查网络连接');
    }
  }
}

module.exports = {
  getAIExplanationFromDashScope
};
