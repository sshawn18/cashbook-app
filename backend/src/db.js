const path = require('path');

let _db = null;
let _isPostgres = false;

function getDb() {
  if (_db) return _db;
  if (process.env.DATABASE_URL) {
    const { Pool } = require('pg');
    _db = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    _isPostgres = true;
  } else {
    const Database = require('better-sqlite3');
    const dbPath = path.join(__dirname, '..', '..', 'cashbook.db');
    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}

// Unified async query interface
// Returns: { rows: [...], rowCount: N, lastID: N }
async function query(sql, params = []) {
  const db = getDb();
  const sqlUpper = sql.trim().toUpperCase();
  const isSelect = sqlUpper.startsWith('SELECT') || sqlUpper.includes('RETURNING');

  if (_isPostgres) {
    // Convert SQLite ? placeholders to PostgreSQL $1,$2,...
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    const result = await db.query(pgSql, params);
    return { rows: result.rows, rowCount: result.rowCount, lastID: result.rows[0]?.id };
  } else {
    // better-sqlite3 is synchronous — wrap for consistent API
    const stmt = db.prepare(sql);
    if (isSelect) {
      const rows = stmt.all(...params);
      return { rows, rowCount: rows.length, lastID: rows[0]?.id };
    } else {
      const info = stmt.run(...params);
      return { rows: [], rowCount: info.changes, lastID: info.lastInsertRowid };
    }
  }
}

// Execute DDL (CREATE TABLE etc) — for init
async function exec(sql) {
  const db = getDb();
  if (_isPostgres) {
    await db.query(sql);
  } else {
    db.exec(sql);
  }
}

module.exports = { query, exec, isPostgres: () => _isPostgres };
