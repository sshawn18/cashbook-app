const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

const KNOWN_KEYS = ['businessName', 'currency', 'theme'];
const pk = (userId, key) => `u:${userId}:${key}`;

router.get('/', async (req, res, next) => {
  try {
    const uid = req.user.id;
    const keys = KNOWN_KEYS.map(k => pk(uid, k));
    const placeholders = keys.map(() => '?').join(',');
    const { rows } = await query(`SELECT * FROM settings WHERE key IN (${placeholders})`, keys);
    const result = { businessName: '', currency: '₹', theme: 'dark' };
    for (const r of rows) {
      const stripped = r.key.replace(`u:${uid}:`, '');
      if (stripped in result) result[stripped] = r.value;
    }
    res.json(result);
  } catch (e) { next(e); }
});

router.put('/', async (req, res, next) => {
  try {
    const uid = req.user.id;
    for (const [key, value] of Object.entries(req.body)) {
      if (!KNOWN_KEYS.includes(key)) continue;
      await query(
        'INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value',
        [pk(uid, key), String(value)]
      );
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
