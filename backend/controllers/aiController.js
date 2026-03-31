const db = require('../config/database');
const axios = require('axios');

// DashScope API URL (兼容 OpenAI 格式)
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// AI 生成新题
const generateQuestion = async (req, res) => {
  try {
    const { topic, difficulty, count = 1 } = req.body;
    const apiKey = req.apiKey;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: '请先配置 DashScope API Key'
      });
    }

    const diffLabel = difficulty === 'easy' ? '简单的' : difficulty === 'medium' ? '中等难度的' : '困难的';
    const topicName = topic || '机器视觉';
    const questionCount = Math.min(Math.max(parseInt(count) || 1, 1), 10);

    const prompt = questionCount === 1 
      ? '你是一位机器视觉领域的专家教师。请生成一道' + diffLabel + '关于"' + topicName + '"的选择题。\n\n' +
        '要求：\n' +
        '1. 题目内容专业、准确\n' +
        '2. 4 个选项（A/B/C/D），只有一个正确答案\n' +
        '3. 提供详细解析\n\n' +
        '请严格按照以下 JSON 格式返回（不要包含其他内容）：\n' +
        '{\n' +
        '  "question": "题目内容",\n' +
        '  "options": ["A. 选项内容", "B. 选项内容", "C. 选项内容", "D. 选项内容"],\n' +
        '  "answer": "正确答案（A/B/C/D）",\n' +
        '  "explanation": "详细解析"\n' +
        '}'
      : '你是一位机器视觉领域的专家教师。请生成' + questionCount + '道' + diffLabel + '关于"' + topicName + '"的选择题。\n\n' +
        '要求：\n' +
        '1. 每道题目内容专业、准确\n' +
        '2. 每道题有 4 个选项（A/B/C/D），只有一个正确答案\n' +
        '3. 每道题提供详细解析\n' +
        '4. 题目之间要有区分度，覆盖不同知识点\n\n' +
        '请严格按照以下 JSON 格式返回（不要包含其他内容）：\n' +
        '{\n' +
        '  "questions": [\n' +
        '    {\n' +
        '      "question": "题目内容",\n' +
        '      "options": ["A. 选项内容", "B. 选项内容", "C. 选项内容", "D. 选项内容"],\n' +
        '      "answer": "正确答案（A/B/C/D）",\n' +
        '      "explanation": "详细解析"\n' +
        '    }\n' +
        '  ]\n' +
        '}';

    const response = await axios.post(
      `${DASHSCOPE_API_URL}/chat/completions`,
      {
        model: 'qwen3.5-plus',
        messages: [
          { role: 'system', content: '你是一位专业的机器视觉教师，擅长出高质量的选择题。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: questionCount === 1 ? 1000 : 2000 + questionCount * 500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const aiContent = response.data.choices[0].message.content;

    // 尝试解析 AI 返回的 JSON
    let generatedData;
    try {
      // 提取 JSON 内容（可能包含在 markdown 中）
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedData = JSON.parse(jsonMatch[0]);
      } else {
        generatedData = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error('解析 AI 返回的 JSON 失败:', parseError);
      return res.status(500).json({
        success: false,
        message: 'AI 生成的内容格式有误，请重试'
      });
    }

    // 处理单题或多题
    const questions = questionCount === 1 ? [generatedData] : generatedData.questions;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'AI 生成的题目格式不完整'
      });
    }

    // 验证每道题的格式
    for (const q of questions) {
      if (!q.question || !q.options || !q.answer || !q.explanation) {
        return res.status(500).json({
          success: false,
          message: 'AI 生成的题目格式不完整'
        });
      }
    }

    // 生成新的题目 ID
    const maxId = db.prepare('SELECT MAX(id) as maxId FROM questions').get().maxId || 0;
    const savedQuestions = [];

    // 保存所有题目到数据库
    for (let i = 0; i < questions.length; i++) {
      const newId = maxId + i + 1;
      const q = questions[i];
      
      db.prepare(`
        INSERT INTO questions (id, topic, subtopic, difficulty, question, options, answer, explanation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newId,
        topic || '综合',
        'AI 生成',
        difficulty || 'medium',
        q.question,
        JSON.stringify(q.options),
        q.answer,
        q.explanation
      );

      savedQuestions.push({
        id: newId,
        ...q,
        topic: topic || '综合',
        difficulty: difficulty || 'medium'
      });
    }

    // 返回第一道题作为当前题目，同时返回所有生成的题目
    res.json({
      success: true,
      message: `AI 出题成功，共生成 ${savedQuestions.length} 道题目`,
      data: {
        ...savedQuestions[0],
        allQuestions: savedQuestions
      }
    });
  } catch (error) {
    console.error('AI 出题失败:', error);

    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'API Key 无效'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'AI 出题失败，请稍后重试'
    });
  }
};

module.exports = {
  generateQuestion
};
