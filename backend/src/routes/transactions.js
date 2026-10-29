const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const { buildTxnFilters } = require('../lib/txnFilters');
const router = express.Router();

router.use(auth);

// Verify book belongs to the requesting user
async function ownedBook(bookId, userId) {
  const { rows } = await query('SELECT id FROM books WHERE id = ? AND user_id = ?', [bookId, userId]);
  return rows.length > 0;
}

// Verify transaction belongs to the requesting user (via book ownership)
async function ownedTransaction(txnId, userId) {
  const { rows } = await query(
    'SELECT t.id FROM transactions t JOIN books b ON t.book_id = b.id WHERE t.id = ? AND b.user_id = ?',
    [txnId, userId]
  );
  return rows.length > 0;
}

// GET /api/transactions?bookId=&search=&type=&mode=&from=&to=&categoryId=&limit=&offset=
router.get('/', async (req, res, next) => {
  try {
    const { bookId } = req.query;
    if (!bookId) return res.status(400).json({ error: 'bookId required' });
    if (!await ownedBook(bookId, req.user.id)) return res.status(404).json({ error: 'not found' });

    // Pagination
    const limit  = Math.min(parseInt(req.query.limit,  10) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0,  0);

    const f = buildTxnFilters(req.query);
    let sql = `
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
             p.name as party_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN parties p ON t.party_id = p.id
      WHERE t.book_id = ?${f.sql}
    `;
    const params = [bookId, ...f.params];

    sql += ' ORDER BY t.date DESC, t.created_at DESC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    res.json({ data: rows, limit, offset, hasMore: rows.length === limit });
  } catch (e) { next(e); }
});

// POST /api/transactions
router.post('/', async (req, res, next) => {
  try {
    const { book_id, type, amount, category_id, party_id, note, payment_mode = 'cash', date } = req.body;
    if (!book_id || !type || amount === undefined || !date)
      return res.status(400).json({ error: 'book_id, type, amount, date required' });

    // Validation
    if (!['in', 'out'].includes(type))
      return res.status(400).json({ error: 'type: must be "in" or "out"' });
    if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0)
      return res.status(400).json({ error: 'amount: must be a positive number' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      return res.status(400).json({ error: 'date: must be YYYY-MM-DD' });
    if (payment_mode && !['cash', 'upi', 'bank'].includes(payment_mode))
      return res.status(400).json({ error: 'payment_mode: must be cash, upi, or bank' });

    if (!await ownedBook(book_id, req.user.id)) return res.status(404).json({ error: 'not found' });

    const { lastID } = await query(
      'INSERT INTO transactions (book_id, type, amount, category_id, party_id, note, payment_mode, date) VALUES (?,?,?,?,?,?,?,?) RETURNING id',
      [book_id, type, amount, category_id || null, party_id || null, note || null, payment_mode, date]
    );
    await query('UPDATE books SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [book_id]);
    const { rows } = await query('SELECT * FROM transactions WHERE id = ?', [lastID]);
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

// PUT /api/transactions/:id
router.put('/:id', async (req, res, next) => {
  try {
    if (!await ownedTransaction(req.params.id, req.user.id))
      return res.status(404).json({ error: 'not found' });

    // Build SET clause dynamically — only update fields present in req.body
    const allowed = ['type', 'amount', 'category_id', 'party_id', 'note', 'payment_mode', 'date'];
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
    await query(`UPDATE transactions SET ${sets.join(', ')} WHERE id = ?`, params);
    const { rows } = await query('SELECT * FROM transactions WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res, next) => {
  try {
    if (!await ownedTransaction(req.params.id, req.user.id))
      return res.status(404).json({ error: 'not found' });
    await query('DELETE FROM transactions WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
