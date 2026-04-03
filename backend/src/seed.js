const { query, exec, isPostgres } = require('./db');

async function seed() {
  // Create tables — use pg-compatible DDL when on PostgreSQL, sqlite-compatible otherwise
  if (isPostgres()) {
    await exec(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        opening_balance NUMERIC DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

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
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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

  // Seed default categories if none exist
  const { rows } = await query('SELECT COUNT(*) as count FROM categories');
  const count = parseInt(rows[0].count, 10);
  if (count === 0) {
    const defaults = [
      { name: 'Sales',         type: 'income',  color: '#16a34a', icon: '💼' },
      { name: 'Purchase',      type: 'expense', color: '#dc2626', icon: '🛒' },
      { name: 'Salary',        type: 'expense', color: '#9333ea', icon: '👨‍💼' },
      { name: 'Rent',          type: 'expense', color: '#ea580c', icon: '🏢' },
      { name: 'Utilities',     type: 'expense', color: '#0891b2', icon: '⚡' },
      { name: 'Transport',     type: 'expense', color: '#65a30d', icon: '🚗' },
      { name: 'Miscellaneous', type: 'expense', color: '#6366f1', icon: '📦' },
    ];
    for (const cat of defaults) {
      await query(
        'INSERT INTO categories (name, type, color, icon, is_default) VALUES (?, ?, ?, ?, 1)',
        [cat.name, cat.type, cat.color, cat.icon]
      );
    }
    console.log('Seeded default categories');
  }
}

module.exports = seed;
