# Cashbook

A mobile-first cash flow tracker for small businesses and freelancers. Record a cash entry in under 5 seconds. Supports multiple books, parties/ledger, categories, reports, and data backup.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS + React Query v5 |
| Backend | Express.js + better-sqlite3 (local) / pg/Neon (Vercel) |
| Auth | JWT (bcryptjs + jsonwebtoken) |
| Charts | Recharts |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | **Yes (production)** | PostgreSQL connection string (Neon/Supabase). If absent in production, the server will refuse to start. |
| `JWT_SECRET` | **Yes (production)** | Secret for signing JWTs. Must not be the dev default in production or the server will refuse to start. |
| `ALLOWED_ORIGINS` | Yes (production) | Comma-separated list of allowed CORS origins, e.g. `https://cashbook-app-one.vercel.app` |
| `BACKEND_PORT` | No | Local backend port (default: `3001`) |

## Local Setup

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Start both frontend and backend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

On first run, the database is created at `cashbook.db` with default tables and indexes.

## Deploy (Vercel)

1. Push to GitHub
2. Import the repo in Vercel
3. Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`
4. The serverless entry is `api/index.js` — Vercel will detect it automatically

## Money storage

Amounts are stored as **integer paise** (₹1 = 100 paise) to avoid floating-point errors. The frontend multiplies user input by 100 before sending to the API and divides by 100 for display.

## Security

- All routes except `/api/auth/register` and `/api/auth/login` require a valid Bearer token
- Every book/transaction/party operation verifies ownership against `req.user.id`
- Categories and settings are scoped per user
- Backup export returns only the calling user's data; import only replaces the calling user's data
- Auth endpoints are rate-limited to 10 requests/minute per IP
- `JWT_SECRET` must be changed from the dev default before production deployment
