const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM categories WHERE user_id IS NULL OR user_id = ? ORDER BY is_default DESC, name ASC',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, type, color = '#6366f1', icon = '📦' } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type required' });
    const { lastID } = await query(
      'INSERT INTO categories (name, type, color, icon, user_id) VALUES (?, ?, ?, ?, ?) RETURNING id',
      [name, type, color, icon, req.user.id]
    );
    const { rows } = await query('SELECT * FROM categories WHERE id = ?', [lastID]);
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { rows: catRows } = await query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    const cat = catRows[0];
    if (!cat) return res.status(404).json({ error: 'not found' });
    if (cat.is_default || cat.user_id === null) return res.status(403).json({ error: 'cannot edit default category' });
    if (Number(cat.user_id) !== Number(req.user.id)) return res.status(403).json({ error: 'forbidden' });

    const { name, color, icon } = req.body;
    await query(
      'UPDATE categories SET name=COALESCE(?,name), color=COALESCE(?,color), icon=COALESCE(?,icon) WHERE id=?',
      [name ?? null, color ?? null, icon ?? null, req.params.id]
    );
    const { rows } = await query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rows: catRows } = await query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    const cat = catRows[0];
    if (!cat) return res.status(404).json({ error: 'not found' });
    if (cat.is_default || cat.user_id === null) return res.status(403).json({ error: 'cannot delete default category' });
    if (Number(cat.user_id) !== Number(req.user.id)) return res.status(403).json({ error: 'forbidden' });

    await query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
