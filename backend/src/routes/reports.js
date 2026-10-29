const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const { buildTxnFilters } = require('../lib/txnFilters');
const router = express.Router();

router.use(auth);

async function ownedBook(bookId, userId) {
  const { rows } = await query('SELECT id FROM books WHERE id = ? AND user_id = ?', [bookId, userId]);
  return rows.length > 0;
}

router.get('/summary', async (req, res, next) => {
  try {
    const { bookId } = req.query;
    if (!bookId) return res.status(400).json({ error: 'bookId required' });
    if (!await ownedBook(bookId, req.user.id)) return res.status(403).json({ error: 'forbidden' });

    const { rows: bookRows } = await query('SELECT * FROM books WHERE id = ?', [bookId]);
    const book = bookRows[0];

    // Optional filters: totals then cover only the matching entries (opening balance excluded)
    const f = buildTxnFilters(req.query);
    const { rows } = await query(
      `SELECT t.type, COALESCE(SUM(t.amount),0) as s, COUNT(*) as n
       FROM transactions t LEFT JOIN parties p ON t.party_id = p.id
       WHERE t.book_id = ?${f.sql} GROUP BY t.type`,
      [bookId, ...f.params]
    );
    const sum = (ty) => parseFloat(rows.find(r => r.type === ty)?.s) || 0;
    const cnt = rows.reduce((a, r) => a + (parseInt(r.n, 10) || 0), 0);
    const inAmt  = sum('in');
    const outAmt = sum('out');
    const opening = parseFloat(book.opening_balance) || 0;
    res.json({
      totalIn: inAmt,
      totalOut: outAmt,
      netBalance: (f.active ? 0 : opening) + inAmt - outAmt,
      openingBalance: book.opening_balance,
      count: cnt,
      filtered: f.active,
    });
  } catch (e) { next(e); }
});

router.get('/cashflow', async (req, res, next) => {
  try {
    const { bookId, from, to } = req.query;
    if (!bookId) return res.status(400).json({ error: 'bookId required' });
    if (!await ownedBook(bookId, req.user.id)) return res.status(403).json({ error: 'forbidden' });

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
    if (!await ownedBook(bookId, req.user.id)) return res.status(403).json({ error: 'forbidden' });

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
