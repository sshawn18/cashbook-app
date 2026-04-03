const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY is_default DESC, name ASC').all());
});

router.post('/', (req, res) => {
  const { name, type, color = '#6366f1', icon = '📦' } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name and type required' });
  const r = db.prepare(
    'INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)'
  ).run(name, type, color, icon);
  res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(r.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!cat) return res.status(404).json({ error: 'not found' });
  if (cat.is_default) return res.status(403).json({ error: 'cannot edit default category' });
  const { name, color, icon } = req.body;
  db.prepare('UPDATE categories SET name=COALESCE(?,name), color=COALESCE(?,color), icon=COALESCE(?,icon) WHERE id=?')
    .run(name ?? null, color ?? null, icon ?? null, req.params.id);
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!cat) return res.status(404).json({ error: 'not found' });
  if (cat.is_default) return res.status(403).json({ error: 'cannot delete default category' });
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
