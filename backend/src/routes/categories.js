const express = require('express');
const { query } = require('../db');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM categories ORDER BY is_default DESC, name ASC');
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, type, color = '#6366f1', icon = '📦' } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type required' });
    const { lastID } = await query(
      'INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?) RETURNING id',
      [name, type, color, icon]
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
    if (cat.is_default) return res.status(403).json({ error: 'cannot edit default category' });
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
    if (cat.is_default) return res.status(403).json({ error: 'cannot delete default category' });
    await query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
