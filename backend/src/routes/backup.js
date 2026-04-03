const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/export', (req, res) => {
  const data = {
    books: db.prepare('SELECT * FROM books').all(),
    categories: db.prepare('SELECT * FROM categories').all(),
    parties: db.prepare('SELECT * FROM parties').all(),
    transactions: db.prepare('SELECT * FROM transactions').all(),
    settings: db.prepare('SELECT * FROM settings').all(),
  };
  res.setHeader('Content-Disposition', 'attachment; filename=cashbook-backup.json');
  res.json(data);
});

router.post('/import', (req, res) => {
  const { books, categories, parties, transactions, settings } = req.body;
  const importAll = db.transaction(() => {
    db.prepare('DELETE FROM transactions').run();
    db.prepare('DELETE FROM parties').run();
    db.prepare('DELETE FROM categories').run();
    db.prepare('DELETE FROM books').run();
    db.prepare('DELETE FROM settings').run();

    for (const b of (books || [])) db.prepare('INSERT INTO books (id,name,opening_balance,created_at,updated_at) VALUES (?,?,?,?,?)').run(b.id,b.name,b.opening_balance,b.created_at,b.updated_at);
    for (const c of (categories || [])) db.prepare('INSERT INTO categories (id,name,type,color,icon,is_default) VALUES (?,?,?,?,?,?)').run(c.id,c.name,c.type,c.color,c.icon,c.is_default);
    for (const p of (parties || [])) db.prepare('INSERT INTO parties (id,book_id,name,phone,type,opening_balance,created_at) VALUES (?,?,?,?,?,?,?)').run(p.id,p.book_id,p.name,p.phone,p.type,p.opening_balance,p.created_at);
    for (const t of (transactions || [])) db.prepare('INSERT INTO transactions (id,book_id,type,amount,category_id,party_id,note,payment_mode,date,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(t.id,t.book_id,t.type,t.amount,t.category_id,t.party_id,t.note,t.payment_mode,t.date,t.created_at);
    for (const s of (settings || [])) db.prepare('INSERT INTO settings (key,value) VALUES (?,?)').run(s.key,s.value);
  });
  try {
    importAll();
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Import failed: ' + err.message });
  }
});

module.exports = router;
