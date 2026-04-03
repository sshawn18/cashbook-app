const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/transactions?bookId=&search=&type=&mode=&from=&to=&categoryId=
router.get('/', (req, res) => {
  const { bookId, search, type, mode, from, to, categoryId } = req.query;
  if (!bookId) return res.status(400).json({ error: 'bookId required' });

  let sql = `
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
           p.name as party_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN parties p ON t.party_id = p.id
    WHERE t.book_id = ?
  `;
  const params = [bookId];

  if (search) { sql += ' AND (t.note LIKE ? OR p.name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (type)   { sql += ' AND t.type = ?'; params.push(type); }
  if (mode)   { sql += ' AND t.payment_mode = ?'; params.push(mode); }
  if (from)   { sql += ' AND t.date >= ?'; params.push(from); }
  if (to)     { sql += ' AND t.date <= ?'; params.push(to); }
  if (categoryId) { sql += ' AND t.category_id = ?'; params.push(categoryId); }

  sql += ' ORDER BY t.date DESC, t.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// POST /api/transactions
router.post('/', (req, res) => {
  const { book_id, type, amount, category_id, party_id, note, payment_mode = 'cash', date } = req.body;
  if (!book_id || !type || !amount || !date) return res.status(400).json({ error: 'book_id, type, amount, date required' });
  const r = db.prepare(
    'INSERT INTO transactions (book_id, type, amount, category_id, party_id, note, payment_mode, date) VALUES (?,?,?,?,?,?,?,?)'
  ).run(book_id, type, amount, category_id || null, party_id || null, note || null, payment_mode, date);
  db.prepare("UPDATE books SET updated_at = datetime('now') WHERE id = ?").run(book_id);
  res.status(201).json(db.prepare('SELECT * FROM transactions WHERE id = ?').get(r.lastInsertRowid));
});

// PUT /api/transactions/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM transactions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'transaction not found' });
  const { type, amount, category_id, party_id, note, payment_mode, date } = req.body;
  db.prepare(`UPDATE transactions SET
    type=COALESCE(?,type), amount=COALESCE(?,amount),
    category_id=COALESCE(?,category_id), party_id=COALESCE(?,party_id),
    note=COALESCE(?,note), payment_mode=COALESCE(?,payment_mode), date=COALESCE(?,date)
    WHERE id=?`).run(type ?? null, amount ?? null, category_id ?? null, party_id ?? null, note ?? null, payment_mode ?? null, date ?? null, req.params.id);
  res.json(db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id));
});

// DELETE /api/transactions/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'transaction not found' });
  res.json({ ok: true });
});

module.exports = router;
