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

// 获取排行榜
const getRanking = async (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT
        u.id,
        u.username,
        s.total_count,
        s.correct_count,
        s.wrong_count,
        CASE
          WHEN s.total_count > 0 THEN ROUND(s.correct_count * 100.0 / s.total_count, 2)
          ELSE 0
        END as accuracy,
        u.created_at
      FROM user_stats s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.correct_count DESC, accuracy DESC, s.total_count DESC
      LIMIT 50
    `);
    const rankings = await allQuery(stmt);

    // 添加排名
    const rankedData = rankings.map((item, index) => ({
      rank: index + 1,
      userId: item.id,
      username: item.username,
      totalCount: item.total_count,
      correctCount: item.correct_count,
      wrongCount: item.wrong_count,
      accuracy: item.accuracy,
      createdAt: item.created_at
    }));

    res.json({
      success: true,
      data: rankedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取排行榜失败',
      error: error.message
    });
  }
};

// 获取当前用户排名
const getUserRank = async (req, res) => {
  try {
    const userId = req.userId;

    const userStatsStmt = db.prepare(`
      SELECT
        s.total_count,
        s.correct_count,
        s.wrong_count,
        CASE
          WHEN s.total_count > 0 THEN ROUND(s.correct_count * 100.0 / s.total_count, 2)
          ELSE 0
        END as accuracy
      FROM user_stats s
      WHERE s.user_id = ?
    `);
    const userStats = await getQuery(userStatsStmt, userId);

    if (!userStats) {
      return res.json({
        success: true,
        data: {
          rank: null,
          totalCount: 0,
          correctCount: 0,
          wrongCount: 0,
          accuracy: 0
        }
      });
    }

    // 计算排名
    const allUsersStmt = db.prepare(`
      SELECT
        u.id as user_id,
        s.correct_count,
        CASE
          WHEN s.total_count > 0 THEN ROUND(s.correct_count * 100.0 / s.total_count, 2)
          ELSE 0
        END as accuracy,
        s.total_count
      FROM user_stats s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.correct_count DESC, accuracy DESC, s.total_count DESC
    `);
    const allUsers = await allQuery(allUsersStmt);

    const rank = allUsers.findIndex(u => u.user_id === userId) + 1;

    res.json({
      success: true,
      data: {
        rank,
        totalCount: userStats.total_count,
        correctCount: userStats.correct_count,
        wrongCount: userStats.wrong_count,
        accuracy: userStats.accuracy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取排名失败',
      error: error.message
    });
  }
};

module.exports = {
  getRanking,
  getUserRank
};
