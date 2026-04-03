const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const { bookId } = req.query;
  if (!bookId) return res.status(400).json({ error: 'bookId required' });
  const parties = db.prepare('SELECT * FROM parties WHERE book_id = ? ORDER BY name').all(bookId);
  const withBalance = parties.map(p => {
    const inAmt  = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE party_id=? AND type='in'").get(p.id).s;
    const outAmt = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE party_id=? AND type='out'").get(p.id).s;
    return { ...p, total_in: inAmt, total_out: outAmt, balance: p.opening_balance + inAmt - outAmt };
  });
  res.json(withBalance);
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
  const { name, phone, type, opening_balance } = req.body;
  db.prepare('UPDATE parties SET name=COALESCE(?,name), phone=COALESCE(?,phone), type=COALESCE(?,type), opening_balance=COALESCE(?,opening_balance) WHERE id=?')
    .run(name ?? null, phone ?? null, type ?? null, opening_balance ?? null, req.params.id);
  res.json(db.prepare('SELECT * FROM parties WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM parties WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/:id/transactions', (req, res) => {
  res.json(db.prepare('SELECT * FROM transactions WHERE party_id = ? ORDER BY date DESC').all(req.params.id));
});

module.exports = router;
