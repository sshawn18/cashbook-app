const db = require('./db');

function seed() {
  const count = db.prepare('SELECT COUNT(*) as c FROM categories').get();
  if (count.c > 0) return;

  const defaults = [
    { name: 'Sales',         type: 'income',  color: '#16a34a', icon: '💼' },
    { name: 'Purchase',      type: 'expense', color: '#dc2626', icon: '🛒' },
    { name: 'Salary',        type: 'expense', color: '#9333ea', icon: '👨‍💼' },
    { name: 'Rent',          type: 'expense', color: '#ea580c', icon: '🏢' },
    { name: 'Utilities',     type: 'expense', color: '#0891b2', icon: '⚡' },
    { name: 'Transport',     type: 'expense', color: '#65a30d', icon: '🚗' },
    { name: 'Miscellaneous', type: 'expense', color: '#6366f1', icon: '📦' },
  ];

  const insert = db.prepare(
    'INSERT INTO categories (name, type, color, icon, is_default) VALUES (?, ?, ?, ?, 1)'
  );
  for (const cat of defaults) insert.run(cat.name, cat.type, cat.color, cat.icon);
  console.log('Seeded default categories');
}

module.exports = seed;
