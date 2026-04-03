const db = require('../config/database');

const isPostgres = require('../config/database').isPostgres;

// 查询辅助函数
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

const runQuery = async (stmt, ...params) => {
  if (isPostgres) {
    return await stmt.run(...params);
  } else {
    return stmt.run(...params);
  }
};

// 获取用户的错题列表
const getWrongQuestions = async (req, res) => {
  try {
    const userId = req.userId;

    const stmt = db.prepare(`
      SELECT wq.*, q.topic, q.subtopic, q.difficulty, q.question, q.options, q.answer, q.explanation
      FROM wrong_questions wq
      JOIN questions q ON wq.question_id = q.id
      WHERE wq.user_id = ?
      ORDER BY wq.created_at DESC
    `);
    const wrongQuestions = await allQuery(stmt, userId);

    res.json({
      success: true,
      data: wrongQuestions.map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取错题失败',
      error: error.message
    });
  }
};

// 添加错题
const addWrongQuestion = async (req, res) => {
  try {
    const userId = req.userId;
    const { questionId, userAnswer } = req.body;

    if (!questionId || !userAnswer) {
      return res.status(400).json({
        success: false,
        message: '题目 ID 和答案不能为空'
      });
    }

    // 检查题目是否存在
    const questionStmt = db.prepare('SELECT id FROM questions WHERE id = ?');
    const question = await getQuery(questionStmt, questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    // 检查是否已经存在
    const existsStmt = db.prepare('SELECT id FROM wrong_questions WHERE user_id = ? AND question_id = ?');
    const exists = await getQuery(existsStmt, userId, questionId);
    if (exists) {
      return res.status(409).json({
        success: false,
        message: '该题目已在错题本中'
      });
    }

    // 插入错题
    const insertStmt = db.prepare(`
      INSERT INTO wrong_questions (user_id, question_id, user_answer)
      VALUES (?, ?, ?)
    `);
    await runQuery(insertStmt, userId, questionId, userAnswer);

    res.json({
      success: true,
      message: '已添加到错题本'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加错题失败',
      error: error.message
    });
  }
};

// 移除错题
const removeWrongQuestion = async (req, res) => {
  try {
    const userId = req.userId;
    const { questionId } = req.params;

    const stmt = db.prepare(`
      DELETE FROM wrong_questions WHERE user_id = ? AND question_id = ?
    `);
    const result = await runQuery(stmt, userId, questionId);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '错题不存在'
      });
    }

    res.json({
      success: true,
      message: '已移除错题'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '移除错题失败',
      error: error.message
    });
  }
};

// 清空所有错题
const clearWrongQuestions = async (req, res) => {
  try {
    const userId = req.userId;

    const stmt = db.prepare('DELETE FROM wrong_questions WHERE user_id = ?');
    await runQuery(stmt, userId);

    res.json({
      success: true,
      message: '已清空所有错题'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '清空错题失败',
      error: error.message
    });
  }
};

module.exports = {
  getWrongQuestions,
  addWrongQuestion,
  removeWrongQuestion,
  clearWrongQuestions
};
