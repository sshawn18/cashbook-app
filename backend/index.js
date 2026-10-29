const express = require('express');
const cors = require('cors');
const seed = require('./src/seed');

const app = express();

// ── JWT_SECRET safety guard ───────────────────────────────────────────────────
const DEV_SECRET = 'cashbook_dev_secret_change_in_prod';
if (process.env.NODE_ENV === 'production' &&
    (process.env.JWT_SECRET || DEV_SECRET) === DEV_SECRET) {
  console.error('FATAL: JWT_SECRET must be changed from the default value in production.');
  process.exit(1);
}

// ── CORS ──────────────────────────────────────────────────────────────────────
const devOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean)
  : devOrigins;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, same-origin server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));

// ── In-memory rate limiter (no extra deps) ───────────────────────────────────
const rateLimitMap = new Map();
const RATE_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_MAX       = 10;

function rateLimit(req, res, next) {
  const ip  = req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateLimitMap.set(ip, entry);
  }
  entry.count++;
  if (entry.count > RATE_MAX) {
    return res.status(429).json({ error: 'Too many requests, please try again later' });
  }
  next();
}

// Purge stale entries every 5 minutes so the Map doesn't grow forever
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000).unref();

// ── Lazy DB init ──────────────────────────────────────────────────────────────
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

// ── Routes (rate-limit auth endpoints before mounting the router) ─────────────
app.use('/api/auth/login',    rateLimit);
app.use('/api/auth/register', rateLimit);

app.use('/api/auth',         require('./src/routes/auth'));
app.use('/api/books',        require('./src/routes/books'));
app.use('/api/transactions', require('./src/routes/transactions'));
app.use('/api/parties',      require('./src/routes/parties'));
app.use('/api/categories',   require('./src/routes/categories'));
app.use('/api/reports',      require('./src/routes/reports'));
app.use('/api/settings',     require('./src/routes/settings'));
app.use('/api/backup',       require('./src/routes/backup'));

// ── Generic error handler ─────────────────────────────────────────────────────
let reqId = 0;
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const rid = ++reqId;
  console.error(`[rid=${rid}]`, err);
  res.status(500).json({ error: 'Something went wrong', rid });
});

// ── Startup ───────────────────────────────────────────────────────────────────
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
