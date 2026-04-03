const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/summary', (req, res) => {
  const { bookId } = req.query;
  if (!bookId) return res.status(400).json({ error: 'bookId required' });
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
  if (!book) return res.status(404).json({ error: 'book not found' });
  const inAmt  = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE book_id=? AND type='in'").get(bookId).s;
  const outAmt = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE book_id=? AND type='out'").get(bookId).s;
  res.json({ totalIn: inAmt, totalOut: outAmt, netBalance: book.opening_balance + inAmt - outAmt, openingBalance: book.opening_balance });
});

router.get('/cashflow', (req, res) => {
  const { bookId, from, to } = req.query;
  if (!bookId) return res.status(400).json({ error: 'bookId required' });
  let sql = "SELECT date, type, SUM(amount) as total FROM transactions WHERE book_id=?";
  const params = [bookId];
  if (from) { sql += ' AND date >= ?'; params.push(from); }
  if (to)   { sql += ' AND date <= ?'; params.push(to); }
  sql += ' GROUP BY date, type ORDER BY date ASC';
  const rows = db.prepare(sql).all(...params);
  const map = {};
  for (const r of rows) {
    if (!map[r.date]) map[r.date] = { date: r.date, in: 0, out: 0 };
    map[r.date][r.type] = r.total;
  }
  res.json(Object.values(map));
});

router.get('/categories', (req, res) => {
  const { bookId, from, to } = req.query;
  if (!bookId) return res.status(400).json({ error: 'bookId required' });
  let sql = `SELECT c.name, c.color, c.icon, t.type, SUM(t.amount) as total
    FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.book_id = ?`;
  const params = [bookId];
  if (from) { sql += ' AND t.date >= ?'; params.push(from); }
  if (to)   { sql += ' AND t.date <= ?'; params.push(to); }
  sql += ' GROUP BY t.category_id, t.type ORDER BY total DESC';
  res.json(db.prepare(sql).all(...params));
});

module.exports = router;
