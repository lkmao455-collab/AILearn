const db = require('../config/database');
const { getAIExplanationFromDashScope } = require('../services/dashscopeService');
const axios = require('axios');

// DashScope API URL (兼容 OpenAI 格式)
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// 判断是否为 PostgreSQL 模式
const isPostgres = require('../config/database').isPostgres;

// 执行查询的辅助函数（处理同步/异步差异）
const runQuery = async (stmt, ...params) => {
  if (isPostgres) {
    return await stmt.run(...params);
  } else {
    return stmt.run(...params);
  }
};

const getQuery = async (stmt, ...params) => {
  if (isPostgres) {
    return await stmt.get(...params);
  } else {
    return stmt.get(...params);
  }
};

const allQuery = async (stmt, ...params) => {
  if (isPostgres) {
    return await stmt.all(...params);
  } else {
    return stmt.all(...params);
  }
};

// 获取插入语句（处理 SQLite/PostgreSQL 差异）
const getInsertQuestionSQL = () => {
  if (isPostgres) {
    return `
      INSERT INTO questions (id, topic, subtopic, difficulty, question, options, answer, explanation)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO NOTHING
    `;
  }
  return `
    INSERT INTO questions (id, topic, subtopic, difficulty, question, options, answer, explanation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
};

// 获取 upsert 用户统计的 SQL
const getUpsertStatsSQL = () => {
  if (isPostgres) {
    return `
      INSERT INTO user_stats (user_id, total_count, correct_count, wrong_count, updated_at)
      VALUES ($1, 1, $2, $3, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        total_count = user_stats.total_count + 1,
        correct_count = user_stats.correct_count + EXCLUDED.correct_count,
        wrong_count = user_stats.wrong_count + EXCLUDED.wrong_count,
        updated_at = NOW()
    `;
  }
  return `
    INSERT INTO user_stats (user_id, total_count, correct_count, wrong_count)
    VALUES (?, 1, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      total_count = total_count + 1,
      correct_count = correct_count + ?,
      wrong_count = wrong_count + ?,
      updated_at = datetime('now')
  `;
};

// 获取随机排序 SQL
const getRandomSQL = () => {
  return isPostgres ? 'RANDOM()' : 'RANDOM()';
};

// 初始化题库（从 JSON 文件导入）
const initQuestions = async () => {
  try {
    const questionsData = require('../data/questions.json');

    // 检查是否已存在题目
    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM questions');
    const existingCount = await getQuery(checkStmt);

    if (existingCount && existingCount.count > 0) {
      console.log(`数据库中已有 ${existingCount.count} 道题目`);
      return;
    }

    // 批量插入题目
    const insertSQL = getInsertQuestionSQL();
    const insertStmt = db.prepare(insertSQL);

    let insertedCount = 0;
    for (const q of questionsData) {
      try {
        await runQuery(
          insertStmt,
          q.id,
          q.topic,
          q.subtopic || null,
          q.difficulty,
          q.question,
          JSON.stringify(q.options),
          q.answer,
          q.explanation
        );
        insertedCount++;
      } catch (err) {
        // 忽略重复插入错误
        if (!err.message?.includes('unique constraint') && !err.message?.includes('UNIQUE')) {
          console.error(`插入题目失败 (ID: ${q.id}):`, err.message);
        }
      }
    }

    console.log(`成功初始化 ${insertedCount} 道题目到数据库`);
  } catch (error) {
    console.error('初始化题库失败:', error);
  }
};

// 获取所有题目
const getAllQuestions = async (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM questions');
    const questions = await allQuery(stmt);

    res.json({
      success: true,
      data: questions.map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
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
const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM questions WHERE id = ?');
    const question = await getQuery(stmt, id);

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
        options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options
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
const getRandomQuestion = async (req, res) => {
  try {
    const randomSQL = `SELECT * FROM questions ORDER BY ${getRandomSQL()} LIMIT 1`;
    const stmt = db.prepare(randomSQL);
    const question = await getQuery(stmt);

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
        options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options
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
const checkAnswer = async (req, res) => {
  try {
    const { questionId, userAnswer } = req.body;
    const userId = req.userId;

    const stmt = db.prepare('SELECT * FROM questions WHERE id = ?');
    const question = await getQuery(stmt, questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    // 标准化答案比较
    const extractAnswerLetter = (answer) => {
      const str = String(answer).trim().toUpperCase();
      const match = str.match(/^[A-D]/);
      return match ? match[0] : str;
    };
    const normalizedUserAnswer = extractAnswerLetter(userAnswer);
    const normalizedCorrectAnswer = extractAnswerLetter(question.answer);
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

    console.log(`[checkAnswer] 题目ID: ${questionId}, 用户答案: ${userAnswer} (标准化: ${normalizedUserAnswer}), 正确答案: ${question.answer} (标准化: ${normalizedCorrectAnswer}), 是否正确: ${isCorrect}`);

    // 如果提供了 userId，记录做题记录
    if (userId && userId !== 'guest') {
      // 插入做题记录
      const recordStmt = db.prepare(`
        INSERT INTO question_records (user_id, question_id, user_answer, is_correct)
        VALUES (?, ?, ?, ?)
      `);
      await runQuery(recordStmt, userId, questionId, userAnswer, isCorrect ? 1 : 0);

      // 更新用户统计
      const correctIncrement = isCorrect ? 1 : 0;
      const wrongIncrement = isCorrect ? 0 : 1;
      const statsSQL = getUpsertStatsSQL();
      const statsStmt = db.prepare(statsSQL);
      await runQuery(statsStmt, userId, correctIncrement, wrongIncrement, correctIncrement, wrongIncrement);

      // 如果答错，自动添加到错题本
      if (!isCorrect) {
        if (isPostgres) {
          const wrongStmt = db.prepare(`
            INSERT INTO wrong_questions (user_id, question_id, user_answer)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, question_id) DO NOTHING
          `);
          await runQuery(wrongStmt, userId, questionId, userAnswer);
        } else {
          const wrongStmt = db.prepare(`
            INSERT OR IGNORE INTO wrong_questions (user_id, question_id, user_answer)
            VALUES (?, ?, ?)
          `);
          await runQuery(wrongStmt, userId, questionId, userAnswer);
        }
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

    const stmt = db.prepare('SELECT * FROM questions WHERE id = ?');
    const question = await getQuery(stmt, questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    const options = typeof question.options === 'string'
      ? JSON.parse(question.options)
      : question.options;

    const aiExplanation = await getAIExplanationFromDashScope(apiKey, {
      question: question.question,
      options: options,
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

// 定义题目大类分组
const CATEGORY_GROUPS = {
  '计算机类': [
    'Agent开发', 'Bash脚本', 'C++', 'CNN', 'C语言', 'DeepLearning', 
    'Go语言', 'HALCON', 'Java', 'KET', 'Linux系统', 'OpenCV', 
    'PyTorch', 'Python', 'QT开发', 'YOLO', '人工智能', '前端开发', 
    '图像处理', '大数据分析', '大模型应用开发', '机器学习', '设计模式',
    '通用', '阿里云ACA-AI'
  ],
  '小学类': [
    '小学英语'
  ],
  '初中类': [
    '初中数学', '初中英语'
  ],
  '高中类': [
    '高中数学', '高中英语'
  ]
};

// 获取所有分类
const getCategories = async (req, res) => {
  try {
    const { topic } = req.query;
    console.log('[getCategories] 收到请求, req.query:', req.query);
    console.log('[getCategories] topic 值:', topic, '类型:', typeof topic);

    const topicsStmt = db.prepare(`
      SELECT topic, COUNT(*) as count FROM questions GROUP BY topic
    `);
    const topics = await allQuery(topicsStmt);

    const subtopicsStmt = db.prepare(`
      SELECT DISTINCT subtopic FROM questions WHERE subtopic IS NOT NULL
    `);
    const subtopicsResult = await allQuery(subtopicsStmt);
    const subtopics = subtopicsResult.map(s => s.subtopic).filter(Boolean);

    // 如果有指定 topic，则只统计该 topic 下的难度分布
    let difficulties;
    if (topic) {
      const diffStmt = db.prepare(`
        SELECT difficulty, COUNT(*) as count FROM questions WHERE topic = ? GROUP BY difficulty
      `);
      const diffResult = await allQuery(diffStmt, topic);
      difficulties = diffResult.map(d => ({
        name: d.difficulty,
        label: d.difficulty === 'easy' ? '简单' : d.difficulty === 'medium' ? '中等' : '困难',
        count: d.count
      }));
    } else {
      const diffStmt = db.prepare(`
        SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty
      `);
      const diffResult = await allQuery(diffStmt);
      difficulties = diffResult.map(d => ({
        name: d.difficulty,
        label: d.difficulty === 'easy' ? '简单' : d.difficulty === 'medium' ? '中等' : '困难',
        count: d.count
      }));
    }

    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM questions');
    const totalResult = await getQuery(totalStmt);
    const total = totalResult.count;

    // 按大类分组组织 topics
    const groupedTopics = {};
    const otherTopics = [];

    // 初始化分组
    Object.keys(CATEGORY_GROUPS).forEach(group => {
      groupedTopics[group] = [];
    });

    // 将 topics 分配到对应分组
    topics.forEach(t => {
      let assigned = false;
      for (const [group, groupTopics] of Object.entries(CATEGORY_GROUPS)) {
        if (groupTopics.includes(t.topic)) {
          groupedTopics[group].push(t);
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        otherTopics.push(t);
      }
    });

    // 如果有未分类的 topic，添加到"其他"分组
    if (otherTopics.length > 0) {
      groupedTopics['其他'] = otherTopics;
    }

    res.json({
      success: true,
      data: { 
        topics, 
        groupedTopics,
        subtopics, 
        difficulties, 
        total 
      }
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
const getQuestionsByCategory = async (req, res) => {
  try {
    const { topic, difficulty } = req.query;

    let sql = 'SELECT * FROM questions WHERE 1=1';
    const params = [];

    if (topic) {
      sql += ` AND topic = ?`;
      params.push(topic);
    }
    if (difficulty) {
      sql += ` AND difficulty = ?`;
      params.push(difficulty);
    }

    const stmt = db.prepare(sql);
    const questions = await allQuery(stmt, ...params);

    res.json({
      success: true,
      data: questions.map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      })),
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
