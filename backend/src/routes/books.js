const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/books — includes computed net_balance
router.get('/', (req, res) => {
  const books = db.prepare('SELECT * FROM books ORDER BY created_at DESC').all();
  const withBalance = books.map(b => {
    const inAmt  = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE book_id=? AND type='in'").get(b.id).s;
    const outAmt = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE book_id=? AND type='out'").get(b.id).s;
    return { ...b, net_balance: b.opening_balance + inAmt - outAmt };
  });
  res.json(withBalance);
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
  const { name, opening_balance } = req.body;
  db.prepare(
    "UPDATE books SET name = COALESCE(?, name), opening_balance = COALESCE(?, opening_balance) WHERE id = ?"
  ).run(name ?? null, opening_balance ?? null, req.params.id);
  res.json(db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id));
});

// DELETE /api/books/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
