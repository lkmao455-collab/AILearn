const db = require('../config/database');

// 获取排行榜
const getRanking = (req, res) => {
  try {
    const rankings = db.prepare(`
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
    `).all();

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
const getUserRank = (req, res) => {
  try {
    const userId = req.userId;

    const userStats = db.prepare(`
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
    `).get(userId);

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
    const allUsers = db.prepare(`
      SELECT user_id, correct_count,
        CASE
          WHEN (SELECT total_count FROM user_stats WHERE user_id = us.user_id) > 0
          THEN ROUND((SELECT correct_count FROM user_stats WHERE user_id = us.user_id) * 100.0 / (SELECT total_count FROM user_stats WHERE user_id = us.user_id), 2)
          ELSE 0
        END as accuracy
      FROM user_stats us
      ORDER BY correct_count DESC, accuracy DESC, total_count DESC
    `).all();

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
