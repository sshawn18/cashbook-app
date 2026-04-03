const express = require('express');
const { query } = require('../db');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM settings');
    const result = {};
    for (const r of rows) result[r.key] = r.value;
    res.json({ businessName: '', currency: '₹', theme: 'dark', ...result });
  } catch (e) { next(e); }
});

router.put('/', async (req, res, next) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await query(
        'INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value',
        [key, String(value)]
      );
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
