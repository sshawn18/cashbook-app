const express = require('express');
const { query } = require('../db');
const router = express.Router();

// GET /api/books — includes computed net_balance
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT b.*,
        b.opening_balance +
        COALESCE(SUM(CASE WHEN t.type='in' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.type='out' THEN t.amount ELSE 0 END), 0) AS net_balance
      FROM books b
      LEFT JOIN transactions t ON t.book_id = b.id
      GROUP BY b.id, b.name, b.opening_balance, b.created_at, b.updated_at
      ORDER BY b.created_at DESC
    `);
    res.json(rows);
  } catch (e) { next(e); }
});

// POST /api/books
router.post('/', async (req, res, next) => {
  try {
    const { name, opening_balance = 0 } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const { lastID } = await query(
      'INSERT INTO books (name, opening_balance) VALUES (?, ?) RETURNING id',
      [name, opening_balance]
    );
    const { rows } = await query('SELECT * FROM books WHERE id = ?', [lastID]);
    const book = rows[0];
    res.status(201).json({ ...book, net_balance: book.opening_balance });
  } catch (e) { next(e); }
});

// PUT /api/books/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { rows: existing } = await query('SELECT id FROM books WHERE id = ?', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'book not found' });
    const { name, opening_balance } = req.body;
    await query(
      'UPDATE books SET name = COALESCE(?, name), opening_balance = COALESCE(?, opening_balance), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name ?? null, opening_balance ?? null, req.params.id]
    );
    const { rows } = await query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// DELETE /api/books/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM books WHERE id = ?', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'book not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
