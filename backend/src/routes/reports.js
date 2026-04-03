const express = require('express');
const { query } = require('../db');
const router = express.Router();

router.get('/summary', async (req, res, next) => {
  try {
    const { bookId } = req.query;
    if (!bookId) return res.status(400).json({ error: 'bookId required' });
    const { rows: bookRows } = await query('SELECT * FROM books WHERE id = ?', [bookId]);
    const book = bookRows[0];
    if (!book) return res.status(404).json({ error: 'book not found' });
    const { rows: inRows } = await query(
      "SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE book_id=? AND type='in'",
      [bookId]
    );
    const { rows: outRows } = await query(
      "SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE book_id=? AND type='out'",
      [bookId]
    );
    const inAmt  = parseFloat(inRows[0].s)  || 0;
    const outAmt = parseFloat(outRows[0].s) || 0;
    res.json({
      totalIn: inAmt,
      totalOut: outAmt,
      netBalance: parseFloat(book.opening_balance) + inAmt - outAmt,
      openingBalance: book.opening_balance
    });
  } catch (e) { next(e); }
});

router.get('/cashflow', async (req, res, next) => {
  try {
    const { bookId, from, to } = req.query;
    if (!bookId) return res.status(400).json({ error: 'bookId required' });
    let sql = 'SELECT date, type, SUM(amount) as total FROM transactions WHERE book_id=?';
    const params = [bookId];
    if (from) { sql += ' AND date >= ?'; params.push(from); }
    if (to)   { sql += ' AND date <= ?'; params.push(to); }
    sql += ' GROUP BY date, type ORDER BY date ASC';
    const { rows } = await query(sql, params);
    const map = {};
    for (const r of rows) {
      if (!map[r.date]) map[r.date] = { date: r.date, in: 0, out: 0 };
      map[r.date][r.type] = parseFloat(r.total) || 0;
    }
    res.json(Object.values(map));
  } catch (e) { next(e); }
});

router.get('/categories', async (req, res, next) => {
  try {
    const { bookId, from, to } = req.query;
    if (!bookId) return res.status(400).json({ error: 'bookId required' });
    let sql = `SELECT c.name, c.color, c.icon, t.type, SUM(t.amount) as total
      FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.book_id = ?`;
    const params = [bookId];
    if (from) { sql += ' AND t.date >= ?'; params.push(from); }
    if (to)   { sql += ' AND t.date <= ?'; params.push(to); }
    sql += ' GROUP BY t.category_id, t.type, c.name, c.color, c.icon ORDER BY total DESC';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;
