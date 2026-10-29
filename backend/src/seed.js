const { query, exec, isPostgres } = require('./db');

async function seed() {
  // Create tables — use pg-compatible DDL when on PostgreSQL, sqlite-compatible otherwise
  if (isPostgres()) {
    await exec(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await exec(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        opening_balance NUMERIC DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    // Migrate: add user_id to existing books table if column missing
    await exec(`ALTER TABLE books ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`);

    await exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income','expense')),
        color TEXT DEFAULT '#6366f1',
        icon TEXT DEFAULT '📦',
        is_default INTEGER DEFAULT 0
      )
    `);

    await exec(`
      CREATE TABLE IF NOT EXISTS parties (
        id SERIAL PRIMARY KEY,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT,
        type TEXT CHECK(type IN ('customer','supplier')),
        opening_balance NUMERIC DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK(type IN ('in','out')),
        amount NUMERIC NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        party_id INTEGER REFERENCES parties(id),
        note TEXT,
        payment_mode TEXT DEFAULT 'cash' CHECK(payment_mode IN ('cash','upi','bank')),
        date TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);
  } else {
    await exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    await exec(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        opening_balance REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    await exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income','expense')),
        color TEXT DEFAULT '#6366f1',
        icon TEXT DEFAULT '📦',
        is_default INTEGER DEFAULT 0
      )
    `);

    await exec(`
      CREATE TABLE IF NOT EXISTS parties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT,
        type TEXT CHECK(type IN ('customer','supplier')),
        opening_balance REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    await exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK(type IN ('in','out')),
        amount REAL NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        party_id INTEGER REFERENCES parties(id),
        note TEXT,
        payment_mode TEXT DEFAULT 'cash' CHECK(payment_mode IN ('cash','upi','bank')),
        date TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    await exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    await exec(`
      CREATE TRIGGER IF NOT EXISTS books_updated_at
      AFTER UPDATE ON books
      BEGIN
        UPDATE books SET updated_at = datetime('now') WHERE id = NEW.id;
      END
    `);
  }

  // Migrations — idempotent schema changes applied on every startup
  if (isPostgres()) {
    await exec(`ALTER TABLE books       ADD COLUMN IF NOT EXISTS user_id   INTEGER REFERENCES users(id) ON DELETE CASCADE`);
    await exec(`ALTER TABLE categories  ADD COLUMN IF NOT EXISTS user_id   INTEGER REFERENCES users(id)`);
  } else {
    // SQLite does not support IF NOT EXISTS on ALTER TABLE — catch the duplicate-column error
    for (const sql of [
      `ALTER TABLE books      ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
      `ALTER TABLE categories ADD COLUMN user_id INTEGER REFERENCES users(id)`,
    ]) {
      try { await exec(sql); } catch (e) {
        if (!e.message.toLowerCase().includes('duplicate column')) throw e;
      }
    }
  }

  // ── Indexes ────────────────────────────────────────────────────────────────
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_txn_book_date ON transactions(book_id, date)',
    'CREATE INDEX IF NOT EXISTS idx_txn_party     ON transactions(party_id)',
    'CREATE INDEX IF NOT EXISTS idx_books_user    ON books(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_parties_book  ON parties(book_id)',
  ];

  if (isPostgres()) {
    for (const idx of indexes) await exec(idx);
  } else {
    for (const idx of indexes) {
      try { await exec(idx); } catch (e) {
        if (!e.message.includes('already exists')) throw e;
      }
    }
  }

  // ── Paise migration (one-time, gated by flag) ──────────────────────────────
  const { rows: migRows } = await query(
    "SELECT value FROM settings WHERE key = '__migration_paise_v1'"
  );
  if (migRows.length === 0) {
    await exec('UPDATE transactions SET amount = ROUND(amount * 100)');
    await exec('UPDATE books         SET opening_balance = ROUND(opening_balance * 100)');
    await exec('UPDATE parties       SET opening_balance = ROUND(opening_balance * 100)');
    await query(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value",
      ['__migration_paise_v1', '1']
    );
    console.log('Paise migration complete: amounts converted to integer paise');
  }
}

module.exports = seed;
