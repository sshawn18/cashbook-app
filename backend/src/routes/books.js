const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/books — includes computed net_balance
router.get('/', (req, res) => {
  const books = db.prepare(`
    SELECT b.*,
      b.opening_balance +
      COALESCE(SUM(CASE WHEN t.type='in' THEN t.amount ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN t.type='out' THEN t.amount ELSE 0 END), 0) AS net_balance
    FROM books b
    LEFT JOIN transactions t ON t.book_id = b.id
    GROUP BY b.id
    ORDER BY b.created_at DESC
  `).all();
  res.json(books);
});

// POST /api/books
router.post('/', (req, res) => {
  const { name, opening_balance = 0 } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const result = db.prepare(
    'INSERT INTO books (name, opening_balance) VALUES (?, ?)'
  ).run(name, opening_balance);
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...book, net_balance: book.opening_balance });
});

// PUT /api/books/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM books WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'book not found' });
  const { name, opening_balance } = req.body;
  db.prepare(
    "UPDATE books SET name = COALESCE(?, name), opening_balance = COALESCE(?, opening_balance) WHERE id = ?"
  ).run(name ?? null, opening_balance ?? null, req.params.id);
  res.json(db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id));
});

// DELETE /api/books/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'book not found' });
  res.json({ ok: true });
});

module.exports = router;
