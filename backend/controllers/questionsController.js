const { getAIExplanationFromDashScope } = require('../services/dashscopeService');
const axios = require('axios');
const multiDb = require('../config/multiDatabase');

// DashScope API URL (兼容 OpenAI 格式)
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// 判断是否为 PostgreSQL 模式（生产环境使用单一数据库）
const isPostgres = process.env.DATABASE_URL ? true : false;

// 获取数据库连接（根据 topic 自动路由）
const getDb = (topic) => {
  if (isPostgres) {
    // PostgreSQL 模式下使用原来的数据库配置
    return require('../config/database');
  }
  // SQLite 模式下使用多数据库路由
  return topic ? multiDb.getTopicDatabase(topic) : multiDb.getMainDatabase();
};

// 执行查询的辅助函数（处理同步/异步差异）
const runQuery = async (stmt, ...params) => {
  const result = stmt.run(...params);
  return result instanceof Promise ? await result : result;
};

const getQuery = async (stmt, ...params) => {
  const result = stmt.get(...params);
  return result instanceof Promise ? await result : result;
};

const allQuery = async (stmt, ...params) => {
  const result = stmt.all(...params);
  return result instanceof Promise ? await result : result;
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

// 定义题目大类分组
const CATEGORY_GROUPS = {
  '计算机类': [
    'Agent开发', 'Bash脚本', 'C++', 'CNN', 'C语言', 'DeepLearning', 
    'Go语言', 'HALCON', 'Java', 'KET', 'Linux系统', 'OpenCV', 
    'PyTorch', 'Python', 'QT开发', 'YOLO', '人工智能', '前端开发', 
    '图像处理', '大数据分析', '大模型应用开发', '机器学习', '设计模式',
    '通用', '阿里云ACA-AI', 'Python编程', '深度学习', '高等数学', '大模型', 
    '线性代数', '数据结构', 'Qt开发', 'Java', 'Linux系统', 'DeepLearning', 
    'Bash脚本', 'OpenCV', 'Go语言', 'HALCON', 'PyTorch', 'C语言', 
    'PROFINET工业以太网', '统计学', 'EtherNet/IP工业协议', 'Modbus通信协议', 
    'QT开发', '数据库'
  ],
  '小学类': [
    '小学英语', '小学数学', '小学语文'
  ],
  '初中类': [
    '初中数学', '初中英语', '初中语文'
  ],
  '高中类': [
    '高中数学', '高中英语', '高中语文'
  ]
};

// 获取所有题目（跨所有数据库）
const getAllQuestions = async (req, res) => {
  try {
    const { topic } = req.query;
    const db = getDb(topic);
    
    let sql = 'SELECT * FROM questions';
    const params = [];
    
    if (topic) {
      sql += ' WHERE topic = ?';
      params.push(topic);
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
      message: '获取题目失败',
      error: error.message
    });
  }
};

// 根据 ID 获取题目
const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { topic } = req.query;
    const db = getDb(topic);
    
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

// 获取随机题目（支持按 topic 筛选）
const getRandomQuestion = async (req, res) => {
  try {
    const { topic, difficulty } = req.query;
    const db = getDb(topic);
    
    let sql = 'SELECT * FROM questions WHERE 1=1';
    const params = [];
    
    if (topic) {
      sql += ' AND topic = ?';
      params.push(topic);
    }
    if (difficulty) {
      sql += ' AND difficulty = ?';
      params.push(difficulty);
    }
    
    sql += ` ORDER BY ${getRandomSQL()} LIMIT 1`;
    
    const stmt = db.prepare(sql);
    const question = await getQuery(stmt, ...params);

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
    const { questionId, userAnswer, topic } = req.body;
    const userId = req.userId;
    
    // 获取题目（优先从指定 topic 数据库）
    const db = getDb(topic);
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

    // 如果提供了 userId，记录做题记录（使用主数据库）
    if (userId && userId !== 'guest') {
      const mainDb = multiDb.getMainDatabase();
      
      // 插入做题记录
      const recordStmt = mainDb.prepare(`
        INSERT INTO question_records (user_id, question_id, user_answer, is_correct)
        VALUES (?, ?, ?, ?)
      `);
      await runQuery(recordStmt, userId, questionId, userAnswer, isCorrect ? 1 : 0);

      // 更新用户统计
      const correctIncrement = isCorrect ? 1 : 0;
      const wrongIncrement = isCorrect ? 0 : 1;
      const statsSQL = getUpsertStatsSQL();
      const statsStmt = mainDb.prepare(statsSQL);
      await runQuery(statsStmt, userId, correctIncrement, wrongIncrement, correctIncrement, wrongIncrement);

      // 如果答错，自动添加到错题本
      if (!isCorrect) {
        if (isPostgres) {
          const wrongStmt = mainDb.prepare(`
            INSERT INTO wrong_questions (user_id, question_id, user_answer)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, question_id) DO NOTHING
          `);
          await runQuery(wrongStmt, userId, questionId, userAnswer);
        } else {
          const wrongStmt = mainDb.prepare(`
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
    const { questionId, topic } = req.body;
    const apiKey = req.apiKey;
    
    const db = getDb(topic);
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

// 获取所有分类（支持多数据库统计）
const getCategories = async (req, res) => {
  try {
    const { topic } = req.query;
    console.log('[getCategories] 收到请求, topic:', topic);

    let topics = [];
    let difficulties = [];
    let total = 0;

    if (isPostgres) {
      // PostgreSQL 模式：使用原逻辑
      const db = require('../config/database');
      const topicsStmt = db.prepare('SELECT topic, COUNT(*) as count FROM questions GROUP BY topic');
      topics = await allQuery(topicsStmt);
      
      const diffStmt = db.prepare('SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty');
      const diffResult = await allQuery(diffStmt);
      difficulties = diffResult.map(d => ({
        name: d.difficulty,
        label: d.difficulty === 'easy' ? '简单' : d.difficulty === 'medium' ? '中等' : '困难',
        count: d.count
      }));
      
      const totalStmt = db.prepare('SELECT COUNT(*) as count FROM questions');
      const totalResult = await getQuery(totalStmt);
      total = totalResult.count;
    } else {
      // SQLite 多数据库模式
      const topicStats = multiDb.getAllTopicsStats();
      topics = topicStats.map(t => ({ topic: t.topic, count: t.count }));
      total = topics.reduce((sum, t) => sum + t.count, 0);
      
      // 获取难度分布（从主数据库或指定 topic）
      if (topic) {
        const db = getDb(topic);
        const diffStmt = db.prepare('SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty');
        const diffResult = await allQuery(diffStmt);
        difficulties = diffResult.map(d => ({
          name: d.difficulty,
          label: d.difficulty === 'easy' ? '简单' : d.difficulty === 'medium' ? '中等' : '困难',
          count: d.count
        }));
      } else {
        // 汇总所有数据库的难度分布
        const difficultyMap = {};
        for (const t of topicStats.slice(0, 5)) { // 只查前5个最大的数据库
          try {
            const db = getDb(t.topic);
            const diffStmt = db.prepare('SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty');
            const diffResult = await allQuery(diffStmt);
            diffResult.forEach(d => {
              difficultyMap[d.difficulty] = (difficultyMap[d.difficulty] || 0) + d.count;
            });
          } catch (e) {
            console.warn(`[getCategories] 获取 ${t.topic} 难度分布失败:`, e.message);
          }
        }
        difficulties = Object.entries(difficultyMap).map(([diff, count]) => ({
          name: diff,
          label: diff === 'easy' ? '简单' : diff === 'medium' ? '中等' : '困难',
          count
        }));
      }
    }

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
        difficulties, 
        total 
      }
    });
  } catch (error) {
    console.error('[getCategories] 错误:', error);
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
    const db = getDb(topic);

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

// 初始化题库（检查多数据库系统）
const initQuestions = async () => {
  try {
    // 获取所有可用的 topic 数据库
    const availableTopics = multiDb.getAvailableTopics();
    let totalQuestions = 0;
    
    for (const topic of availableTopics) {
      const topicInfo = multiDb.getTopicInfo(topic);
      if (topicInfo) {
        totalQuestions += topicInfo.count;
      }
    }
    
    console.log(`[initQuestions] 多数据库系统已加载 ${availableTopics.length} 个 topic，共 ${totalQuestions} 道题目`);
    
    // 如果主数据库还有题目数据，可以选择清理（可选）
    // 这里我们只检查，不自动清理，避免误删数据
    const db = multiDb.getMainDatabase();
    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM questions');
    const existingCount = await getQuery(checkStmt);
    
    if (existingCount && existingCount.count > 0) {
      console.log(`[initQuestions] 注意：主数据库中仍有 ${existingCount.count} 道题目，建议迁移到 topic 数据库`);
    }
  } catch (error) {
    console.error('[initQuestions] 初始化题库失败:', error);
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
