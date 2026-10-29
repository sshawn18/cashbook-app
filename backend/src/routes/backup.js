const express = require('express');
const { query, isPostgres } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// Export only the authenticated user's data
router.get('/export', async (req, res, next) => {
  try {
    const uid = req.user.id;

    const { rows: books } = await query('SELECT * FROM books WHERE user_id = ?', [uid]);
    const bookIds = books.map(b => b.id);

    let parties = [], transactions = [];
    if (bookIds.length > 0) {
      const ph = bookIds.map(() => '?').join(',');
      ({ rows: parties }      = await query(`SELECT * FROM parties      WHERE book_id IN (${ph})`, bookIds));
      ({ rows: transactions } = await query(`SELECT * FROM transactions WHERE book_id IN (${ph})`, bookIds));
    }

    const { rows: categories } = await query(
      'SELECT * FROM categories WHERE user_id = ?', [uid]
    );

    const settingKeys = ['businessName', 'currency', 'theme'].map(k => `u:${uid}:${k}`);
    const ph2 = settingKeys.map(() => '?').join(',');
    const { rows: rawSettings } = await query(`SELECT * FROM settings WHERE key IN (${ph2})`, settingKeys);
    const settings = rawSettings.map(r => ({ ...r, key: r.key.replace(`u:${uid}:`, '') }));

    res.setHeader('Content-Disposition', 'attachment; filename=cashbook-backup.json');
    res.json({ books, categories, parties, transactions, settings });
  } catch (e) { next(e); }
});

// Import — replaces only the authenticated user's data; other users are untouched
router.post('/import', async (req, res, next) => {
  // Validate required top-level arrays BEFORE touching any data
  const requiredArrays = ['books', 'categories', 'parties', 'transactions', 'settings'];
  for (const key of requiredArrays) {
    if (!Array.isArray(req.body[key])) {
      return res.status(400).json({ error: 'Invalid backup format' });
    }
  }

  const { books, categories, parties, transactions, settings } = req.body;
  const uid = req.user.id;
  try {
    // Delete user's existing data in FK-safe order
    await query('DELETE FROM transactions WHERE book_id IN (SELECT id FROM books WHERE user_id = ?)', [uid]);
    await query('DELETE FROM parties      WHERE book_id IN (SELECT id FROM books WHERE user_id = ?)', [uid]);
    await query('DELETE FROM books        WHERE user_id = ?', [uid]);
    await query('DELETE FROM categories   WHERE user_id = ?', [uid]);
    // Delete only this user's settings (prefixed keys)
    const settingKeys = ['businessName', 'currency', 'theme'].map(k => `u:${uid}:${k}`);
    for (const k of settingKeys) await query('DELETE FROM settings WHERE key = ?', [k]);

    // Re-insert books, building old_id → new_id map
    const bookIdMap = {};
    for (const b of books) {
      const { lastID } = await query(
        'INSERT INTO books (user_id, name, opening_balance, created_at, updated_at) VALUES (?,?,?,?,?) RETURNING id',
        [uid, b.name, b.opening_balance, b.created_at, b.updated_at]
      );
      bookIdMap[b.id] = lastID;
    }

    // Re-insert user's custom categories, building old_id → new_id map
    const catIdMap = {};
    for (const c of categories) {
      const { lastID } = await query(
        'INSERT INTO categories (name, type, color, icon, user_id) VALUES (?,?,?,?,?) RETURNING id',
        [c.name, c.type, c.color || '#6366f1', c.icon || '📦', uid]
      );
      catIdMap[c.id] = lastID;
    }

    // Re-insert parties using remapped book IDs
    const partyIdMap = {};
    for (const p of parties) {
      const newBookId = bookIdMap[p.book_id];
      if (!newBookId) continue; // skip orphaned parties
      const { lastID } = await query(
        'INSERT INTO parties (book_id, name, phone, type, opening_balance, created_at) VALUES (?,?,?,?,?,?) RETURNING id',
        [newBookId, p.name, p.phone || null, p.type || null, p.opening_balance, p.created_at]
      );
      partyIdMap[p.id] = lastID;
    }

    // Re-insert transactions using remapped IDs
    for (const t of transactions) {
      const newBookId = bookIdMap[t.book_id];
      if (!newBookId) continue; // skip orphaned transactions
      const newCatId   = t.category_id ? (catIdMap[t.category_id]   ?? null) : null;
      const newPartyId = t.party_id    ? (partyIdMap[t.party_id]    ?? null) : null;
      await query(
        'INSERT INTO transactions (book_id, type, amount, category_id, party_id, note, payment_mode, date, created_at) VALUES (?,?,?,?,?,?,?,?,?) RETURNING id',
        [newBookId, t.type, t.amount, newCatId, newPartyId, t.note || null, t.payment_mode || 'cash', t.date, t.created_at]
      );
    }

    // Re-insert settings with user prefix
    for (const s of settings) {
      const key = `u:${uid}:${s.key}`;
      await query(
        'INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value',
        [key, s.value]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
