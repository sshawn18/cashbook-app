const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const result = {};
  for (const r of rows) result[r.key] = r.value;
  res.json({ businessName: '', currency: '₹', theme: 'dark', ...result });
});

router.put('/', (req, res) => {
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  for (const [key, value] of Object.entries(req.body)) upsert.run(key, String(value));
  res.json({ ok: true });
});

module.exports = router;
