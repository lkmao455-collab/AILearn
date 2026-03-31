const axios = require('axios');

const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// 默认模型（直接使用，避免额外的 API 调用延迟）
const DEFAULT_MODEL = 'qwen3.5-plus';

/**
 * 调用 DashScope API 获取 AI 解析
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

  try {
    // 验证 API Key
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      throw new Error('API Key 无效或为空');
    }

    // 使用默认模型（避免额外的 API 调用延迟）
    const model = DEFAULT_MODEL;

    console.log('调用 DashScope API:', {
      url: DASHSCOPE_API_URL,
      model: model,
      apiKeyPrefix: apiKey.substring(0, 10) + '...'
    });

    const response = await axios.post(
      `${DASHSCOPE_API_URL}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的机器视觉和深度学习教育专家，擅长用通俗易懂的方式讲解复杂的技术概念。你的回答应该准确、清晰、有条理，并且对初学者友好。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
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

    // 解析响应
    console.log('DashScope 响应: 已生成解析');

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const aiResponse = response.data.choices[0]?.message?.content;
      if (aiResponse) {
        return aiResponse;
      }
    }

    throw new Error('API 返回格式异常：' + JSON.stringify(response.data));

  } catch (error) {
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
    } else {
      throw new Error('网络错误，请检查网络连接');
    }
  }
}

module.exports = {
  getAIExplanationFromDashScope
};
