const list = (v) => String(v).split(',').map(s => s.trim()).filter(Boolean);

// Builds " AND ..." SQL for optional transaction filters. Table alias `t` is expected.
// categoryId / mode accept comma-separated lists. Returns { sql, params, active }.
function buildTxnFilters(q) {
  const { search, type, mode, from, to, categoryId } = q;
  let sql = '';
  const params = [];
  let active = false;

  if (search) { sql += ' AND (t.note LIKE ? OR p.name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); active = true; }
  if (type === 'in' || type === 'out') { sql += ' AND t.type = ?'; params.push(type); active = true; }
  if (mode) {
    const m = list(mode);
    if (m.length) { sql += ` AND t.payment_mode IN (${m.map(() => '?').join(',')})`; params.push(...m); active = true; }
  }
  if (from) { sql += ' AND t.date >= ?'; params.push(from); active = true; }
  if (to)   { sql += ' AND t.date <= ?'; params.push(to);   active = true; }
  if (categoryId) {
    const c = list(categoryId);
    if (c.length) { sql += ` AND t.category_id IN (${c.map(() => '?').join(',')})`; params.push(...c); active = true; }
  }
  return { sql, params, active };
}

module.exports = { buildTxnFilters };
