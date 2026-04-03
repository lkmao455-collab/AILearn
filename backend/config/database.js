const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 判断使用哪种数据库
const isPostgres = process.env.DATABASE_URL ? true : false;

let db;
let query;

if (isPostgres) {
  // PostgreSQL 模式（生产环境）
  console.log('[Database] Using PostgreSQL');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  // 封装兼容 SQLite 的查询接口
  db = {
    prepare: (sql) => {
      // 转换 SQLite 语法到 PostgreSQL
      const pgSql = sql
        .replace(/\?/g, (match, index) => `$${index + 1}`)  // ? 转为 $1, $2...
        .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
        .replace(/datetime\('now'\)/gi, 'NOW()')
        .replace(/TEXT DEFAULT \(datetime\('now'\)\)/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

      return {
        run: async (...params) => {
          try {
            const result = await pool.query(pgSql, params);
            return { changes: result.rowCount, lastInsertRowid: result.rows[0]?.id };
          } catch (err) {
            console.error('[PostgreSQL] Error:', err);
            throw err;
          }
        },
        get: async (...params) => {
          try {
            const result = await pool.query(pgSql, params);
            return result.rows[0] || null;
          } catch (err) {
            console.error('[PostgreSQL] Error:', err);
            throw err;
          }
        },
        all: async (...params) => {
          try {
            const result = await pool.query(pgSql, params);
            return result.rows;
          } catch (err) {
            console.error('[PostgreSQL] Error:', err);
            throw err;
          }
        }
      };
    },
    exec: async (sql) => {
      // 转换 SQLite DDL 到 PostgreSQL
      const pgSql = sql
        .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
        .replace(/INTEGER PRIMARY KEY/gi, 'SERIAL PRIMARY KEY')
        .replace(/datetime\('now'\)/gi, 'NOW()')
        .replace(/TEXT DEFAULT \(datetime\('now'\)\)/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
        .replace(/PRAGMA.*;/gi, '');  // 移除 SQLite 特有的 PRAGMA

      if (!pgSql.trim()) return;

      try {
        await pool.query(pgSql);
      } catch (err) {
        console.error('[PostgreSQL] Exec Error:', err);
        // 忽略 "already exists" 错误
        if (!err.message.includes('already exists')) {
          throw err;
        }
      }
    },
    // 用于事务
    transaction: (fn) => fn,
    close: () => pool.end()
  };

  // 初始化 PostgreSQL 表
  const initPostgresTables = async () => {
    try {
      // 用户表
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 题目表
      await pool.query(`
        CREATE TABLE IF NOT EXISTS questions (
          id SERIAL PRIMARY KEY,
          topic TEXT NOT NULL,
          subtopic TEXT,
          difficulty TEXT NOT NULL,
          question TEXT NOT NULL,
          options TEXT NOT NULL,
          answer TEXT NOT NULL,
          explanation TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 错题表
      await pool.query(`
        CREATE TABLE IF NOT EXISTS wrong_questions (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
          user_answer TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, question_id)
        )
      `);

      // 做题记录表
      await pool.query(`
        CREATE TABLE IF NOT EXISTS question_records (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
          user_answer TEXT NOT NULL,
          is_correct INTEGER NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 用户统计表
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_stats (
          id SERIAL PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          total_count INTEGER DEFAULT 0,
          correct_count INTEGER DEFAULT 0,
          wrong_count INTEGER DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('[Database] PostgreSQL tables initialized');
    } catch (err) {
      console.error('[Database] Failed to initialize PostgreSQL tables:', err);
      throw err;
    }
  };

  // 立即执行初始化
  initPostgresTables();

  // 导出 pool 用于直接查询
  db.pool = pool;

} else {
  // SQLite 模式（本地开发）
  console.log('[Database] Using SQLite');

  const getDatabasePath = () => {
    if (process.env.DB_PATH) {
      return process.env.DB_PATH;
    }

    const possiblePaths = [
      path.join(__dirname, '..'),
      path.join(__dirname, '..', '..'),
      process.cwd(),
      path.join(process.cwd(), '..'),
    ];

    for (const basePath of possiblePaths) {
      const dataDir = path.join(basePath, 'backend', 'data');
      if (fs.existsSync(dataDir)) {
        return path.join(dataDir, 'cv_learn.db');
      }
    }

    return path.join(__dirname, '..', 'data', 'cv_learn.db');
  };

  const dbPath = getDatabasePath();
  const dataDir = path.dirname(dbPath);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`[Database] Created data directory: ${dataDir}`);
  }

  console.log(`[Database] SQLite path: ${dbPath}`);

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 初始化 SQLite 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY,
      topic TEXT NOT NULL,
      subtopic TEXT,
      difficulty TEXT NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS wrong_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      question_id INTEGER NOT NULL,
      user_answer TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      UNIQUE(user_id, question_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS question_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      question_id INTEGER NOT NULL,
      user_answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      total_count INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      wrong_count INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

module.exports = db;
module.exports.isPostgres = isPostgres;
