const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const { bookId } = req.query;
  if (!bookId) return res.status(400).json({ error: 'bookId required' });
  const parties = db.prepare(`
    SELECT p.*,
      COALESCE(SUM(CASE WHEN t.type='in' THEN t.amount ELSE 0 END), 0) AS total_in,
      COALESCE(SUM(CASE WHEN t.type='out' THEN t.amount ELSE 0 END), 0) AS total_out,
      p.opening_balance +
      COALESCE(SUM(CASE WHEN t.type='in' THEN t.amount ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN t.type='out' THEN t.amount ELSE 0 END), 0) AS balance
    FROM parties p
    LEFT JOIN transactions t ON t.party_id = p.id
    WHERE p.book_id = ?
    GROUP BY p.id
    ORDER BY p.name ASC
  `).all(bookId);
  res.json(parties);
});

router.post('/', (req, res) => {
  const { book_id, name, phone, type, opening_balance = 0 } = req.body;
  if (!book_id || !name) return res.status(400).json({ error: 'book_id and name required' });
  const r = db.prepare(
    'INSERT INTO parties (book_id, name, phone, type, opening_balance) VALUES (?,?,?,?,?)'
  ).run(book_id, name, phone || null, type || null, opening_balance);
  res.status(201).json(db.prepare('SELECT * FROM parties WHERE id = ?').get(r.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM parties WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'party not found' });
  const { name, phone, type, opening_balance } = req.body;
  db.prepare('UPDATE parties SET name=COALESCE(?,name), phone=COALESCE(?,phone), type=COALESCE(?,type), opening_balance=COALESCE(?,opening_balance) WHERE id=?')
    .run(name ?? null, phone ?? null, type ?? null, opening_balance ?? null, req.params.id);
  res.json(db.prepare('SELECT * FROM parties WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM parties WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'party not found' });
  res.json({ ok: true });
});

router.get('/:id/transactions', (req, res) => {
  res.json(db.prepare(`
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.party_id = ?
    ORDER BY t.date DESC
  `).all(req.params.id));
});

module.exports = router;
