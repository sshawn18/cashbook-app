const express = require('express');
const { query, exec, isPostgres } = require('../db');
const router = express.Router();

router.get('/export', async (req, res, next) => {
  try {
    const [books, categories, parties, transactions, settings] = await Promise.all([
      query('SELECT * FROM books'),
      query('SELECT * FROM categories'),
      query('SELECT * FROM parties'),
      query('SELECT * FROM transactions'),
      query('SELECT * FROM settings'),
    ]);
    const data = {
      books:        books.rows,
      categories:   categories.rows,
      parties:      parties.rows,
      transactions: transactions.rows,
      settings:     settings.rows,
    };
    res.setHeader('Content-Disposition', 'attachment; filename=cashbook-backup.json');
    res.json(data);
  } catch (e) { next(e); }
});

router.post('/import', async (req, res, next) => {
  const { books, categories, parties, transactions, settings } = req.body;
  try {
    if (isPostgres()) {
      // Use PostgreSQL transaction via client from pool
      const { Pool } = require('pg');
      // Re-use the singleton pool from db.js by importing getDb indirectly
      const { query: q } = require('../db');
      // Run deletes and inserts sequentially (pool handles concurrency)
      await q('DELETE FROM transactions');
      await q('DELETE FROM parties');
      await q('DELETE FROM categories');
      await q('DELETE FROM books');
      await q('DELETE FROM settings');

      for (const b of (books || []))
        await q('INSERT INTO books (id,name,opening_balance,created_at,updated_at) VALUES (?,?,?,?,?)',
          [b.id, b.name, b.opening_balance, b.created_at, b.updated_at]);
      for (const c of (categories || []))
        await q('INSERT INTO categories (id,name,type,color,icon,is_default) VALUES (?,?,?,?,?,?)',
          [c.id, c.name, c.type, c.color, c.icon, c.is_default]);
      for (const p of (parties || []))
        await q('INSERT INTO parties (id,book_id,name,phone,type,opening_balance,created_at) VALUES (?,?,?,?,?,?,?)',
          [p.id, p.book_id, p.name, p.phone, p.type, p.opening_balance, p.created_at]);
      for (const t of (transactions || []))
        await q('INSERT INTO transactions (id,book_id,type,amount,category_id,party_id,note,payment_mode,date,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
          [t.id, t.book_id, t.type, t.amount, t.category_id, t.party_id, t.note, t.payment_mode, t.date, t.created_at]);
      for (const s of (settings || []))
        await q('INSERT INTO settings (key,value) VALUES (?,?)', [s.key, s.value]);

      // Reset sequences so future inserts don't conflict with imported IDs
      await q("SELECT setval('books_id_seq', COALESCE((SELECT MAX(id) FROM books), 0) + 1, false)");
      await q("SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 0) + 1, false)");
      await q("SELECT setval('parties_id_seq', COALESCE((SELECT MAX(id) FROM parties), 0) + 1, false)");
      await q("SELECT setval('transactions_id_seq', COALESCE((SELECT MAX(id) FROM transactions), 0) + 1, false)");
    } else {
      // SQLite: use better-sqlite3 transaction directly
      const path = require('path');
      const Database = require('better-sqlite3');
      const dbPath = path.join(__dirname, '..', '..', '..', 'cashbook.db');
      const db = new Database(dbPath);
      const importAll = db.transaction(() => {
        db.prepare('DELETE FROM transactions').run();
        db.prepare('DELETE FROM parties').run();
        db.prepare('DELETE FROM categories').run();
        db.prepare('DELETE FROM books').run();
        db.prepare('DELETE FROM settings').run();

        for (const b of (books || []))
          db.prepare('INSERT INTO books (id,name,opening_balance,created_at,updated_at) VALUES (?,?,?,?,?)').run(b.id, b.name, b.opening_balance, b.created_at, b.updated_at);
        for (const c of (categories || []))
          db.prepare('INSERT INTO categories (id,name,type,color,icon,is_default) VALUES (?,?,?,?,?,?)').run(c.id, c.name, c.type, c.color, c.icon, c.is_default);
        for (const p of (parties || []))
          db.prepare('INSERT INTO parties (id,book_id,name,phone,type,opening_balance,created_at) VALUES (?,?,?,?,?,?,?)').run(p.id, p.book_id, p.name, p.phone, p.type, p.opening_balance, p.created_at);
        for (const t of (transactions || []))
          db.prepare('INSERT INTO transactions (id,book_id,type,amount,category_id,party_id,note,payment_mode,date,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(t.id, t.book_id, t.type, t.amount, t.category_id, t.party_id, t.note, t.payment_mode, t.date, t.created_at);
        for (const s of (settings || []))
          db.prepare('INSERT INTO settings (key,value) VALUES (?,?)').run(s.key, s.value);
      });
      importAll();
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Import failed: ' + err.message });
  }
});

module.exports = router;
