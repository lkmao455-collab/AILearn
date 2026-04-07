/**
 * 多数据库管理模块
 * 
 * 功能：
 * 1. 动态加载和管理多个 topic 数据库
 * 2. 根据 topic 自动路由到对应的数据库
 * 3. 支持主数据库（用户数据）和 topic 数据库（题目数据）的分离
 * 4. 提供统一的查询接口
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 配置
const DATA_DIR = path.join(__dirname, '..', 'data');
const TOPICS_DIR = path.join(DATA_DIR, 'topics');
const MAPPING_FILE = path.join(DATA_DIR, 'topic-mapping.json');

// 数据库连接池
const dbPool = new Map();
let topicMapping = null;
let mainDb = null;

/**
 * 初始化多数据库系统
 */
const initMultiDatabase = () => {
  console.log('[MultiDB] 初始化多数据库系统...');
  
  // 加载 topic 映射
  if (fs.existsSync(MAPPING_FILE)) {
    topicMapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
    console.log(`[MultiDB] 加载了 ${Object.keys(topicMapping.topics).length} 个 topic 映射`);
  } else {
    console.warn('[MultiDB] 未找到 topic 映射文件，将使用主数据库');
    topicMapping = { topics: {} };
  }
  
  console.log('[MultiDB] 多数据库系统初始化完成');
};

/**
 * 获取主数据库连接（用户数据）
 */
const getMainDatabase = () => {
  if (!mainDb) {
    const mainDbPath = path.join(DATA_DIR, 'cv_learn.db');
    mainDb = new Database(mainDbPath);
    mainDb.pragma('journal_mode = WAL');
    mainDb.pragma('foreign_keys = ON');
    console.log(`[MultiDB] 主数据库连接: ${mainDbPath}`);
  }
  return mainDb;
};

/**
 * 获取 topic 对应的数据库连接
 * @param {string} topic - topic 名称
 * @returns {Database|null} - 数据库连接
 */
const getTopicDatabase = (topic) => {
  // 如果没有 topic 或 topic 映射不存在，返回主数据库
  if (!topic || !topicMapping || !topicMapping.topics[topic]) {
    return getMainDatabase();
  }
  
  // 检查是否已连接
  if (dbPool.has(topic)) {
    return dbPool.get(topic);
  }
  
  // 创建新连接
  const topicInfo = topicMapping.topics[topic];
  // path 是相对 backend 目录的路径（如 "data/topics/xxx.db"）
  const dbPath = path.join(__dirname, '..', topicInfo.path);
  
  if (!fs.existsSync(dbPath)) {
    console.warn(`[MultiDB] Topic 数据库不存在: ${dbPath}，使用主数据库`);
    return getMainDatabase();
  }
  
  try {
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    dbPool.set(topic, db);
    console.log(`[MultiDB] 已加载 topic 数据库: ${topic} (${topicInfo.count} 题)`);
    return db;
  } catch (error) {
    console.error(`[MultiDB] 加载 topic 数据库失败: ${topic}`, error);
    return getMainDatabase();
  }
};

/**
 * 获取所有可用的 topics
 * @returns {string[]} - topic 列表
 */
const getAvailableTopics = () => {
  if (!topicMapping) {
    initMultiDatabase();
  }
  return Object.keys(topicMapping.topics || {});
};

/**
 * 获取 topic 信息
 * @param {string} topic - topic 名称
 * @returns {object|null} - topic 信息
 */
const getTopicInfo = (topic) => {
  if (!topicMapping || !topicMapping.topics[topic]) {
    return null;
  }
  return topicMapping.topics[topic];
};

/**
 * 获取所有 topic 的统计信息
 * @returns {object[]} - topic 统计列表
 */
const getAllTopicsStats = () => {
  if (!topicMapping) {
    initMultiDatabase();
  }
  
  return Object.entries(topicMapping.topics || {}).map(([topic, info]) => ({
    topic,
    count: info.count,
    fileName: info.fileName
  })).sort((a, b) => b.count - a.count);
};

/**
 * 执行查询（自动路由到正确的数据库）
 * @param {string} topic - topic 名称（可选）
 * @param {string} sql - SQL 语句
 * @param {array} params - 查询参数
 * @returns {any} - 查询结果
 */
const query = (topic, sql, ...params) => {
  const db = topic ? getTopicDatabase(topic) : getMainDatabase();
  const stmt = db.prepare(sql);
  return stmt.all(...params);
};

/**
 * 执行查询（返回单个结果）
 * @param {string} topic - topic 名称（可选）
 * @param {string} sql - SQL 语句
 * @param {array} params - 查询参数
 * @returns {any} - 查询结果
 */
const queryOne = (topic, sql, ...params) => {
  const db = topic ? getTopicDatabase(topic) : getMainDatabase();
  const stmt = db.prepare(sql);
  return stmt.get(...params);
};

/**
 * 执行更新操作
 * @param {string} topic - topic 名称（可选）
 * @param {string} sql - SQL 语句
 * @param {array} params - 查询参数
 * @returns {object} - 执行结果
 */
const run = (topic, sql, ...params) => {
  const db = topic ? getTopicDatabase(topic) : getMainDatabase();
  const stmt = db.prepare(sql);
  return stmt.run(...params);
};

/**
 * 关闭所有数据库连接
 */
const closeAll = () => {
  console.log('[MultiDB] 关闭所有数据库连接...');
  
  // 关闭所有 topic 数据库
  for (const [topic, db] of dbPool.entries()) {
    try {
      db.close();
      console.log(`[MultiDB] 已关闭: ${topic}`);
    } catch (error) {
      console.error(`[MultiDB] 关闭失败: ${topic}`, error);
    }
  }
  dbPool.clear();
  
  // 关闭主数据库
  if (mainDb) {
    try {
      mainDb.close();
      console.log('[MultiDB] 主数据库已关闭');
    } catch (error) {
      console.error('[MultiDB] 主数据库关闭失败', error);
    }
    mainDb = null;
  }
  
  console.log('[MultiDB] 所有数据库连接已关闭');
};

// 初始化
initMultiDatabase();

module.exports = {
  getMainDatabase,
  getTopicDatabase,
  getAvailableTopics,
  getTopicInfo,
  getAllTopicsStats,
  query,
  queryOne,
  run,
  closeAll,
  topicMapping
};
