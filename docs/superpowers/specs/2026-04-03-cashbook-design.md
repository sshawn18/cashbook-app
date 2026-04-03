# Cashbook App — Design Spec
**Date:** 2026-04-03
**Status:** Approved

---

## Overview

A full-featured mobile-first cash flow management web app for small business owners and freelancers in India. Inspired by cashbook.in. Supports multiple books, parties/ledger, categories, reports, and data backup. Runs locally via Express + SQLite, served as a React SPA.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, React Query v5 |
| Backend | Express.js, better-sqlite3 |
| Charts | Recharts |
| PDF Export | jspdf + jspdf-autotable |
| CSV Export | papaparse |
| Dev runner | concurrently |
| Fonts | DM Sans (Google Fonts) |

---

## Project Structure

```
cashbook-app/
├── frontend/
│   ├── src/
│   │   ├── components/       # Shared UI components
│   │   ├── pages/            # Route-level pages
│   │   ├── hooks/            # React Query hooks per resource
│   │   ├── context/          # ThemeContext, BookContext
│   │   ├── lib/              # api.js (fetch wrapper), utils.js
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js        # proxies /api → localhost:3001
├── backend/
│   ├── src/
│   │   ├── db.js             # better-sqlite3 setup + migrations
│   │   ├── seed.js           # default categories seeder
│   │   └── routes/           # books, transactions, parties, categories, reports, settings, backup
│   └── index.js              # Express entry point
├── package.json              # root — scripts: dev, build
└── .gitignore
```

---

## Visual Design

### Color Palette

| Token | Dark Mode | Light Mode |
|---|---|---|
| `--bg-primary` | `#0b0d1a` | `#ffffff` |
| `--bg-secondary` | `#151829` | `#f5f6ff` |
| `--bg-card` | `#151829` | `#ffffff` |
| `--border` | `#1e2340` | `#e8eaf6` |
| `--text-primary` | `#ffffff` | `#1e293b` |
| `--text-secondary` | `#6b7a9f` | `#9fa8da` |
| `--accent-blue` | `#1a237e` → `#1565c0` | same gradient |
| `--cash-in` | `#16a34a` | `#16a34a` |
| `--cash-out` | `#dc2626` | `#dc2626` |

### Typography
- Font: **DM Sans** (weights: 400, 500, 600, 700, 800)
- Balance figures: `font-weight: 800`, `letter-spacing: -1px`
- Labels: uppercase, `letter-spacing: 0.8px`, muted color

### Key UI Patterns
- **Balance hero card**: gradient deep navy (`#1a237e → #1565c0`), glassmorphism in/out pills
- **Transaction rows**: rounded card (`border-radius: 14px`), emoji category icon, payment mode chip, running balance
- **CASH IN / OUT buttons**: full-width gradient with colored drop shadow, sticky to bottom of ledger
- **Bottom navigation**: 4 tabs (Home, Ledger, Reports, More), active tab has blue underline dot
- **Slide-up sheets**: modal bottom sheets for add/edit flows
- **Theme toggle**: in Settings → persisted to `localStorage` + `settings` table

---

## Database Schema

```sql
CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  opening_balance REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income','expense')),
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT '📦',
  is_default INTEGER DEFAULT 0
);

CREATE TABLE parties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  type TEXT CHECK(type IN ('customer','supplier')),
  opening_balance REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('in','out')),
  amount REAL NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  party_id INTEGER REFERENCES parties(id),
  note TEXT,
  payment_mode TEXT DEFAULT 'cash' CHECK(payment_mode IN ('cash','upi','bank')),
  date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

### Default Categories (seeded on first run)
| Name | Type | Icon |
|---|---|---|
| Sales | income | 💼 |
| Purchase | expense | 🛒 |
| Salary | expense | 👨‍💼 |
| Rent | expense | 🏢 |
| Utilities | expense | ⚡ |
| Transport | expense | 🚗 |
| Miscellaneous | expense | 📦 |

---

## API Routes

### Books
```
GET    /api/books                    — list all books
POST   /api/books                    — create book { name, opening_balance }
PUT    /api/books/:id                — update book
DELETE /api/books/:id                — delete book + cascade
```

### Transactions
```
GET    /api/books/:bookId/transactions   — list (supports ?search, ?category, ?type, ?mode, ?from, ?to)
POST   /api/books/:bookId/transactions   — create entry
PUT    /api/transactions/:id             — update entry
DELETE /api/transactions/:id             — delete entry
```

### Parties
```
GET    /api/books/:bookId/parties    — list parties with outstanding balance
POST   /api/books/:bookId/parties    — create party
PUT    /api/parties/:id              — update party
DELETE /api/parties/:id              — delete party
GET    /api/parties/:id/transactions — party transaction history
```

### Categories
```
GET    /api/categories               — list all categories
POST   /api/categories               — create custom category
PUT    /api/categories/:id           — update (non-default only)
DELETE /api/categories/:id           — delete (non-default only)
```

### Reports
```
GET    /api/books/:bookId/reports/summary    — { totalIn, totalOut, netBalance, openingBalance }
GET    /api/books/:bookId/reports/cashflow   — daily grouped [ { date, in, out } ] (supports ?from, ?to)
GET    /api/books/:bookId/reports/categories — category-wise breakdown [ { category, total } ]
```

### Settings & Backup
```
GET    /api/settings                 — { businessName, currency, theme, ... }
PUT    /api/settings                 — update one or more keys
GET    /api/backup/export            — full JSON dump of all data
POST   /api/backup/import            — restore from JSON dump
```

---

## Screens

### 1. Home (Book List)
- Header: "My Cashbooks" + theme toggle icon
- Scrollable list of books — each shows name, net balance (colored), last updated
- FAB: "+ ADD NEW BOOK" (bottom right)
- Empty state: illustration + "Create your first cashbook"
- Onboarding modal on first launch (no books exist): business name field + first book name + opening balance

### 2. Ledger (Inside a Book)
- Header: book name + "← back", filter icon, PDF export icon
- **Summary card**: Net Balance, Total In (green), Total Out (red), "VIEW REPORTS →" link
- Filter chips: Select Date, Entry Type (In/Out/All), Payment Mode
- Transaction list — grouped by date (sticky date headers), newest first
  - Each row: [emoji icon] [name + payment chip + time] [amount + running balance]
  - Tap row to edit; tap the ••• menu on a row to delete
- Sticky bottom: CASH IN (green) + CASH OUT (red) buttons

### 3. Add/Edit Transaction (bottom sheet)
- Amount input (large, numpad-friendly)
- Type toggle: IN / OUT
- Category selector (scrollable chips)
- Party selector (optional, searchable)
- Payment mode: Cash / UPI / Bank
- Note field
- Date picker (defaults to today)
- Save button

### 4. Reports
- Book selector dropdown (if multiple books)
- Date range: Today / Week / Month / Custom
- **Bar chart**: daily cash in vs out (Recharts BarChart)
- **Pie chart**: category-wise expense breakdown
- **Summary row**: total in, total out, net
- Export: CSV (papaparse) + PDF (jspdf-autotable)

### 5. More Tab
- **Parties** — list with outstanding balance, add/edit/view history
- **Categories** — list, add custom, cannot delete defaults
- **Settings** — business name, currency (₹), theme toggle (dark/light), opening balance edit
- **Backup & Restore** — Export JSON, Import JSON

### 6. Search (per-book)
- Search icon in Ledger header — scoped to the currently open book
- Searches across: note text, party name, amount
- Results shown inline replacing the transaction list; clear to return to full list

---

## State Management

- **Server state**: React Query (`useQuery`, `useMutation`) per resource
  - Query keys: `['books']`, `['transactions', bookId, filters]`, `['parties', bookId]`, etc.
  - Mutations invalidate relevant query keys on success
- **UI state**: React `useState` / `useReducer` — modals open/close, filter values, active book
- **Theme**: `ThemeContext` — reads from `localStorage` on mount, writes on toggle, applies `data-theme` attribute to `<html>`
- **Active book**: `BookContext` or URL param (`/book/:bookId/ledger`)

---

## Startup Behavior

1. `npm run dev` → `concurrently` starts backend (port 3001) + frontend (port 5173)
2. Backend on first run: runs schema migrations + seeds default categories if `categories` table is empty
3. Frontend on first load: checks `GET /api/books` — if empty, shows onboarding modal
4. Vite dev config proxies `/api` → `http://localhost:3001`

---

## Error Handling

- Express: global error middleware returns `{ error: message }` JSON with appropriate status codes
- React Query: `onError` callbacks show toast notifications (react-hot-toast)
- Input validation: backend validates required fields and enums before DB write

---

## Verification Plan

1. Run `npm run dev` — both servers start without errors
2. Onboarding modal appears on first load
3. Create a book → appears in book list
4. Add Cash In entry → balance updates, transaction appears in ledger
5. Add Cash Out entry → balance decreases, shows in red
6. Filter by date range → only matching transactions shown
7. Reports page shows correct bar chart and category pie
8. Export CSV → downloads valid file
9. Theme toggle → switches dark/light, persists on reload
10. Party ledger → correct outstanding balance shown
11. Backup export → JSON file downloads; import restores all data
