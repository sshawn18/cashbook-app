const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'cashbook_dev_secret_change_in_prod';

const DEFAULT_CATEGORIES = [
  { name: 'Sales',         type: 'income',  color: '#16a34a', icon: '💼' },
  { name: 'Purchase',      type: 'expense', color: '#dc2626', icon: '🛒' },
  { name: 'Salary',        type: 'expense', color: '#9333ea', icon: '👨‍💼' },
  { name: 'Rent',          type: 'expense', color: '#ea580c', icon: '🏢' },
  { name: 'Utilities',     type: 'expense', color: '#0891b2', icon: '⚡' },
  { name: 'Transport',     type: 'expense', color: '#65a30d', icon: '🚗' },
  { name: 'Miscellaneous', type: 'expense', color: '#6366f1', icon: '📦' },
];

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const { rows: existing } = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const { lastID } = await query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?) RETURNING id',
      [name, email.toLowerCase(), hash]
    );
    const token = jwt.sign({ id: lastID, email: email.toLowerCase(), name }, JWT_SECRET, { expiresIn: '30d' });

    // Seed default categories for the new user
    for (const cat of DEFAULT_CATEGORIES) {
      await query(
        'INSERT INTO categories (name, type, color, icon, user_id) VALUES (?, ?, ?, ?, ?) RETURNING id',
        [cat.name, cat.type, cat.color, cat.icon, lastID]
      );
    }

    res.status(201).json({ token, user: { id: lastID, name, email: email.toLowerCase() } });
  } catch (e) { next(e); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { rows } = await query('SELECT id, name, email, password_hash FROM users WHERE email = ?', [email.toLowerCase()]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) { next(e); }
});

// GET /api/auth/me  (protected)
router.get('/me', require('../middleware/auth'), async (req, res, next) => {
  try {
    const { rows } = await query('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

module.exports = router;
