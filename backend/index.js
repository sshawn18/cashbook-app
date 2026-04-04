const express = require('express');
const cors = require('cors');
const seed = require('./src/seed');

const app = express();
app.use(cors());
app.use(express.json());

// Lazy init: run seed once before the first request is handled
let initialized = false;
async function init() {
  if (!initialized) {
    await seed();
    initialized = true;
  }
}

// Must be registered BEFORE routes so it runs first
app.use(async (req, res, next) => {
  try { await init(); next(); } catch (e) { next(e); }
});

app.use('/api/auth',         require('./src/routes/auth'));
app.use('/api/books',        require('./src/routes/books'));
app.use('/api/transactions', require('./src/routes/transactions'));
app.use('/api/parties',      require('./src/routes/parties'));
app.use('/api/categories',   require('./src/routes/categories'));
app.use('/api/reports',      require('./src/routes/reports'));
app.use('/api/settings',     require('./src/routes/settings'));
app.use('/api/backup',       require('./src/routes/backup'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.BACKEND_PORT ?? 3001;
if (require.main === module) {
  init().then(() =>
    app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`))
  ).catch(err => {
    console.error('Failed to initialize DB:', err);
    process.exit(1);
  });
}

module.exports = app;
