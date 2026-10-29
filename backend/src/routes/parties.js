const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

async function ownedBook(bookId, userId) {
  const { rows } = await query('SELECT id FROM books WHERE id = ? AND user_id = ?', [bookId, userId]);
  return rows.length > 0;
}

async function ownedParty(partyId, userId) {
  const { rows } = await query(
    'SELECT p.id FROM parties p JOIN books b ON p.book_id = b.id WHERE p.id = ? AND b.user_id = ?',
    [partyId, userId]
  );
  return rows.length > 0;
}

router.get('/', async (req, res, next) => {
  try {
    const { bookId } = req.query;
    if (!bookId) return res.status(400).json({ error: 'bookId required' });
    if (!await ownedBook(bookId, req.user.id)) return res.status(404).json({ error: 'not found' });

    const { rows } = await query(`
      SELECT p.*,
        COALESCE(SUM(CASE WHEN t.type='in' THEN t.amount ELSE 0 END), 0) AS total_in,
        COALESCE(SUM(CASE WHEN t.type='out' THEN t.amount ELSE 0 END), 0) AS total_out,
        p.opening_balance +
        COALESCE(SUM(CASE WHEN t.type='in' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.type='out' THEN t.amount ELSE 0 END), 0) AS balance
      FROM parties p
      LEFT JOIN transactions t ON t.party_id = p.id
      WHERE p.book_id = ?
      GROUP BY p.id, p.book_id, p.name, p.phone, p.type, p.opening_balance, p.created_at
      ORDER BY p.name ASC
    `, [bookId]);
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { book_id, name, phone, type, opening_balance = 0 } = req.body;
    if (!book_id || !name) return res.status(400).json({ error: 'book_id and name required' });
    if (!await ownedBook(book_id, req.user.id)) return res.status(404).json({ error: 'not found' });

    const { lastID } = await query(
      'INSERT INTO parties (book_id, name, phone, type, opening_balance) VALUES (?,?,?,?,?) RETURNING id',
      [book_id, name, phone || null, type || null, opening_balance]
    );
    const { rows } = await query('SELECT * FROM parties WHERE id = ?', [lastID]);
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!await ownedParty(req.params.id, req.user.id))
      return res.status(404).json({ error: 'not found' });

    // Build SET clause dynamically — only update fields present in req.body
    const allowed = ['name', 'phone', 'type', 'opening_balance'];
    const sets   = [];
    const params = [];
    for (const key of allowed) {
      if (key in req.body) {
        sets.push(`${key} = ?`);
        params.push(req.body[key]);
      }
    }
    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    await query(`UPDATE parties SET ${sets.join(', ')} WHERE id = ?`, params);
    const { rows } = await query('SELECT * FROM parties WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!await ownedParty(req.params.id, req.user.id))
      return res.status(404).json({ error: 'not found' });
    await query('DELETE FROM parties WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/:id/transactions', async (req, res, next) => {
  try {
    if (!await ownedParty(req.params.id, req.user.id))
      return res.status(404).json({ error: 'not found' });
    const { rows } = await query(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.party_id = ?
      ORDER BY t.date DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;
