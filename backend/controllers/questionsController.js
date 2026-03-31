const db = require('../config/database');
const { getAIExplanationFromDashScope } = require('../services/dashscopeService');
const axios = require('axios');

// DashScope API URL (兼容 OpenAI 格式)
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// 初始化题库（从 JSON 文件导入）
const initQuestions = () => {
  try {
    const questionsData = require('../data/questions.json');

    // 检查是否已存在题目
    const existingCount = db.prepare('SELECT COUNT(*) as count FROM questions').get();
    if (existingCount.count > 0) {
      console.log(`数据库中已有 ${existingCount.count} 道题目`);
      return;
    }

    // 批量插入题目
    const insert = db.prepare(`
      INSERT INTO questions (id, topic, subtopic, difficulty, question, options, answer, explanation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((questions) => {
      for (const q of questions) {
        insert.run(
          q.id,
          q.topic,
          q.subtopic || null,
          q.difficulty,
          q.question,
          JSON.stringify(q.options),
          q.answer,
          q.explanation
        );
      }
    });

    transaction(questionsData);
    console.log(`成功初始化 ${questionsData.length} 道题目到数据库`);
  } catch (error) {
    console.error('初始化题库失败:', error);
  }
};

// 获取所有题目
const getAllQuestions = (req, res) => {
  try {
    const questions = db.prepare('SELECT * FROM questions').all();

    res.json({
      success: true,
      data: questions.map(q => ({
        ...q,
        options: JSON.parse(q.options)
      })),
      total: questions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取题目失败',
      error: error.message
    });
  }
};

// 根据 ID 获取题目
const getQuestionById = (req, res) => {
  try {
    const { id } = req.params;
    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    res.json({
      success: true,
      data: {
        ...question,
        options: JSON.parse(question.options)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取题目失败',
      error: error.message
    });
  }
};

// 获取随机题目
const getRandomQuestion = (req, res) => {
  try {
    const question = db.prepare('SELECT * FROM questions ORDER BY RANDOM() LIMIT 1').get();

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '没有找到题目'
      });
    }

    res.json({
      success: true,
      data: {
        ...question,
        options: JSON.parse(question.options)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取随机题目失败',
      error: error.message
    });
  }
};

// 检查答案
const checkAnswer = (req, res) => {
  try {
    const { questionId, userAnswer } = req.body;
    const userId = req.userId;

    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    // 标准化答案比较：去除空格，转大写
    const normalizedUserAnswer = String(userAnswer).trim().toUpperCase();
    const normalizedCorrectAnswer = String(question.answer).trim().toUpperCase();
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

    console.log(`[checkAnswer] 题目ID: ${questionId}, 用户答案: ${userAnswer} (标准化: ${normalizedUserAnswer}), 正确答案: ${question.answer} (标准化: ${normalizedCorrectAnswer}), 是否正确: ${isCorrect}`);

    // 如果提供了 userId，记录做题记录
    if (userId && userId !== 'guest') {
      // 插入做题记录
      db.prepare(`
        INSERT INTO question_records (user_id, question_id, user_answer, is_correct)
        VALUES (?, ?, ?, ?)
      `).run(userId, questionId, userAnswer, isCorrect ? 1 : 0);

      // 更新用户统计
      db.prepare(`
        INSERT INTO user_stats (user_id, total_count, correct_count, wrong_count)
        VALUES (?, 1, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          total_count = total_count + 1,
          correct_count = correct_count + ?,
          wrong_count = wrong_count + ?,
          updated_at = datetime('now')
      `).run(userId, isCorrect ? 1 : 0, isCorrect ? 0 : 1, isCorrect ? 1 : 0, isCorrect ? 0 : 1);

      // 如果答错，自动添加到错题本
      if (!isCorrect) {
        db.prepare(`
          INSERT OR IGNORE INTO wrong_questions (user_id, question_id, user_answer)
          VALUES (?, ?, ?)
        `).run(userId, questionId, userAnswer);
      }
    }

    res.json({
      success: true,
      data: {
        isCorrect,
        correctAnswer: question.answer,
        explanation: question.explanation,
        question: question.question
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '检查答案失败',
      error: error.message
    });
  }
};

// AI 详细解析
const aiExplain = async (req, res) => {
  try {
    const { questionId } = req.body;
    const apiKey = req.apiKey;

    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    const aiExplanation = await getAIExplanationFromDashScope(apiKey, {
      question: question.question,
      options: JSON.parse(question.options),
      correctAnswer: question.answer,
      topic: question.topic,
      subtopic: question.subtopic
    });

    res.json({
      success: true,
      data: {
        questionId,
        aiExplanation,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'AI 解析失败',
      error: error.message
    });
  }
};

// 测试 API Key 连接
const testConnection = async (req, res) => {
  try {
    const apiKey = req.apiKey;

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

    res.json({
      success: true,
      message: '连接测试成功！API Key 有效',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      let message = '';

      if (status === 401) message = 'API Key 无效';
      else if (status === 429) message = '请求频率超限';
      else if (status === 400) message = '请求参数错误';
      else if (status === 500) message = 'DashScope 服务暂时不可用';
      else message = `DashScope API 错误 (${status})`;

      res.status(400).json({ success: false, message });
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({ success: false, message: '请求超时' });
    } else {
      res.status(500).json({ success: false, message: `网络错误：${error.message}` });
    }
  }
};

// 获取所有分类
const getCategories = (req, res) => {
  try {
    const { topic } = req.query;
    console.log('[getCategories] 收到请求, req.query:', req.query);
    console.log('[getCategories] topic 值:', topic, '类型:', typeof topic);

    const topics = db.prepare(`
      SELECT topic, COUNT(*) as count FROM questions GROUP BY topic
    `).all();

    const subtopics = db.prepare(`
      SELECT DISTINCT subtopic FROM questions WHERE subtopic IS NOT NULL
    `).all().map(s => s.subtopic);

    // 如果有指定 topic，则只统计该 topic 下的难度分布
    let difficulties;
    if (topic) {
      difficulties = db.prepare(`
        SELECT difficulty, COUNT(*) as count FROM questions WHERE topic = ? GROUP BY difficulty
      `).all(topic).map(d => ({
        name: d.difficulty,
        label: d.difficulty === 'easy' ? '简单' : d.difficulty === 'medium' ? '中等' : '困难',
        count: d.count
      }));
    } else {
      difficulties = db.prepare(`
        SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty
      `).all().map(d => ({
        name: d.difficulty,
        label: d.difficulty === 'easy' ? '简单' : d.difficulty === 'medium' ? '中等' : '困难',
        count: d.count
      }));
    }

    const total = db.prepare('SELECT COUNT(*) as count FROM questions').get().count;

    res.json({
      success: true,
      data: { topics, subtopics, difficulties, total }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取分类失败',
      error: error.message
    });
  }
};

// 根据分类筛选题目
const getQuestionsByCategory = (req, res) => {
  try {
    const { topic, difficulty } = req.query;

    let sql = 'SELECT * FROM questions WHERE 1=1';
    if (topic) sql += ` AND topic = '${topic}'`;
    if (difficulty) sql += ` AND difficulty = '${difficulty}'`;

    const questions = db.prepare(sql).all();

    res.json({
      success: true,
      data: questions.map(q => ({ ...q, options: JSON.parse(q.options) })),
      total: questions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '筛选题目失败',
      error: error.message
    });
  }
};

module.exports = {
  initQuestions,
  getAllQuestions,
  getQuestionById,
  getRandomQuestion,
  checkAnswer,
  aiExplain,
  testConnection,
  getCategories,
  getQuestionsByCategory
};
