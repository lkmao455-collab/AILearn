/**
 * Topic 数据库工具模块
 * 
 * 功能：
 * 1. 根据 topic 名称获取对应的数据库连接
 * 2. 将生成的题目保存到对应 topic 的数据库
 * 3. 自动创建不存在的 topic 数据库
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据库目录
const DATA_DIR = path.join(__dirname, '..', 'data');
const TOPICS_DIR = path.join(DATA_DIR, 'topics');
const MAPPING_FILE = path.join(DATA_DIR, 'topic-mapping.json');

// 确保 topics 目录存在
if (!fs.existsSync(TOPICS_DIR)) {
  fs.mkdirSync(TOPICS_DIR, { recursive: true });
}

/**
 * 加载 topic 映射
 */
const loadTopicMapping = () => {
  if (fs.existsSync(MAPPING_FILE)) {
    return JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  }
  return { topics: {}, version: '1.0', createdAt: new Date().toISOString() };
};

/**
 * 保存 topic 映射
 */
const saveTopicMapping = (mapping) => {
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2), 'utf8');
};

/**
 * 获取 topic 数据库文件路径
 */
const getTopicDbPath = (topic) => {
  // 将 topic 名称转换为合法的文件名
  const safeFileName = topic.replace(/[\\/:*?"<>|]/g, '_');
  return path.join(TOPICS_DIR, `${safeFileName}.db`);
};

/**
 * 初始化 topic 数据库（创建表结构）
 */
const initTopicDatabase = (dbPath) => {
  const db = new Database(dbPath);
  
  // 启用 WAL 模式
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  
  // 创建 questions 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      subtopic TEXT,
      difficulty TEXT NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      answer TEXT NOT NULL,
      explanation TEXT,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_topic ON questions(topic);
    CREATE INDEX IF NOT EXISTS idx_subtopic ON questions(subtopic);
    CREATE INDEX IF NOT EXISTS idx_difficulty ON questions(difficulty);
  `);
  
  return db;
};

/**
 * 获取或创建 topic 数据库
 * @param {string} topic - topic 名称
 * @returns {Database} - 数据库连接
 */
const getOrCreateTopicDatabase = (topic) => {
  const dbPath = getTopicDbPath(topic);
  
  // 如果数据库不存在，创建并初始化
  if (!fs.existsSync(dbPath)) {
    console.log(`[TopicDB] 创建新的 topic 数据库: ${topic}`);
    const db = initTopicDatabase(dbPath);
    
    // 更新映射文件
    const mapping = loadTopicMapping();
    const safeFileName = topic.replace(/[\\/:*?"<>|]/g, '_');
    mapping.topics[topic] = {
      fileName: `${safeFileName}.db`,
      count: 0,
      path: `data/topics/${safeFileName}.db`
    };
    saveTopicMapping(mapping);
    
    return db;
  }
  
  // 已存在，直接连接
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
};

/**
 * 将题目保存到对应 topic 的数据库
 * @param {string} topic - topic 名称
 * @param {object} question - 题目数据
 * @returns {object} - 保存结果 { success: boolean, id: number, error?: string }
 */
const saveQuestionToTopicDb = (topic, question) => {
  try {
    const db = getOrCreateTopicDatabase(topic);
    
    const stmt = db.prepare(`
      INSERT INTO questions (topic, subtopic, difficulty, question, options, answer, explanation)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      topic,
      question.subtopic || null,
      question.difficulty,
      question.question,
      JSON.stringify(question.options),
      question.answer,
      question.explanation || ''
    );
    
    // 更新映射文件中的计数
    const mapping = loadTopicMapping();
    if (mapping.topics[topic]) {
      mapping.topics[topic].count = (mapping.topics[topic].count || 0) + 1;
      saveTopicMapping(mapping);
    }
    
    return {
      success: true,
      id: result.lastInsertRowid
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 批量保存题目到对应 topic 的数据库
 * @param {string} topic - topic 名称
 * @param {array} questions - 题目数据数组
 * @returns {object} - 保存结果 { success: number, failed: number, errors: array }
 */
const batchSaveQuestionsToTopicDb = (topic, questions) => {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  try {
    const db = getOrCreateTopicDatabase(topic);
    
    const stmt = db.prepare(`
      INSERT INTO questions (topic, subtopic, difficulty, question, options, answer, explanation)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    // 使用事务批量插入
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        try {
          stmt.run(
            topic,
            item.subtopic || null,
            item.difficulty,
            item.question,
            JSON.stringify(item.options),
            item.answer,
            item.explanation || ''
          );
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({ question: item.question?.substring(0, 50), error: error.message });
        }
      }
    });
    
    insertMany(questions);
    
    // 更新映射文件中的计数
    const mapping = loadTopicMapping();
    if (mapping.topics[topic]) {
      mapping.topics[topic].count = (mapping.topics[topic].count || 0) + results.success;
      saveTopicMapping(mapping);
    }
    
    return results;
  } catch (error) {
    return {
      success: results.success,
      failed: questions.length - results.success,
      errors: [...results.errors, { error: error.message }]
    };
  }
};

/**
 * 获取 topic 数据库的当前题目数量
 * @param {string} topic - topic 名称
 * @returns {number} - 题目数量
 */
const getTopicQuestionCount = (topic) => {
  try {
    const dbPath = getTopicDbPath(topic);
    if (!fs.existsSync(dbPath)) {
      return 0;
    }
    
    const db = new Database(dbPath);
    const result = db.prepare('SELECT COUNT(*) as count FROM questions').get();
    db.close();
    return result.count;
  } catch (error) {
    console.error(`[TopicDB] 获取 ${topic} 题目数量失败:`, error.message);
    return 0;
  }
};

module.exports = {
  getOrCreateTopicDatabase,
  saveQuestionToTopicDb,
  batchSaveQuestionsToTopicDb,
  getTopicQuestionCount,
  loadTopicMapping,
  saveTopicMapping,
  getTopicDbPath
};
