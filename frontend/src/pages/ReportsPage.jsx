import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useBooks } from '../hooks/useBooks'
import { useCashflow, useCategoryReport } from '../hooks/useReports'
import { useSummary, useTransactions } from '../hooks/useTransactions'
import { fmtCurrency } from '../lib/utils'
import Papa from 'papaparse'

const RANGES = ['Today', 'Week', 'Month', '3 Months']

function getDateRange(r) {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  const to = fmt(now)
  if (r === 'Today') return { from: to, to }
  if (r === 'Week') { const d = new Date(now); d.setDate(d.getDate()-7); return { from: fmt(d), to } }
  if (r === 'Month') { const d = new Date(now); d.setMonth(d.getMonth()-1); return { from: fmt(d), to } }
  const d = new Date(now); d.setMonth(d.getMonth()-3); return { from: fmt(d), to }
}

export default function ReportsPage() {
  const { data: books = [] } = useBooks()
  const [activeBookId, setActiveBookId] = useState(null)
  const [range, setRange] = useState('Month')

  const bookId = activeBookId || books[0]?.id
  const { from, to } = getDateRange(range)

  const { data: cashflow = [] } = useCashflow(bookId, from, to)
  const { data: catData = [] } = useCategoryReport(bookId, from, to)
  const { data: summary } = useSummary(bookId)
  const { data: txns = [] } = useTransactions(bookId, { from, to })

  const expenseCats = catData.filter(c => c.type === 'out' && c.total > 0)

  const exportCSV = () => {
    const csv = Papa.unparse(
      txns.map(t => ({
        date: t.date,
        type: t.type,
        amount: t.amount,
        category: t.category_name || '',
        party: t.party_name || '',
        note: t.note || '',
        payment_mode: t.payment_mode,
      }))
    )
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `cashbook-${books.find(b => b.id === bookId)?.name || 'export'}-${range.toLowerCase()}.csv`
    a.click()
  }

  return (
    <div className="px-4 pt-10 pb-4" style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <h1 className="text-2xl font-extrabold mb-4" style={{ color: 'var(--text-primary)' }}>Reports</h1>

      {/* Book selector */}
      {books.length > 1 && (
        <select
          value={bookId || ''}
          onChange={e => setActiveBookId(Number(e.target.value))}
          className="w-full rounded-xl px-4 py-3 mb-4 text-sm outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          {books.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}

      {/* Date range chips */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
        {RANGES.map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
            style={{
              background: range === r ? 'var(--accent)' : 'var(--chip-bg)',
              color: range === r ? '#fff' : 'var(--chip-text)',
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Summary row */}
      {summary && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            ['Total In',  summary.totalIn,     'var(--cash-in)'],
            ['Total Out', summary.totalOut,    'var(--cash-out)'],
            ['Net',       summary.netBalance,  summary.netBalance >= 0 ? 'var(--cash-in)' : 'var(--cash-out)'],
          ].map(([label, val, color]) => (
            <div key={label} className="rounded-2xl p-3 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
              <p className="font-bold text-sm" style={{ color }}>{fmtCurrency(val)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Bar chart */}
      <div className="rounded-2xl p-4 mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Cash Flow</p>
        {cashflow.length === 0 ? (
          <p className="text-center text-xs py-8" style={{ color: 'var(--text-muted)' }}>No data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={cashflow} barSize={8} barGap={2}>
              <XAxis dataKey="date" tick={{ fontSize: 8, fill: 'var(--text-secondary)' }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 8, fill: 'var(--text-secondary)' }} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={(v, n) => [fmtCurrency(v), n === 'in' ? 'Cash In' : 'Cash Out']} />
              <Bar dataKey="in"  fill="#16a34a" radius={[4,4,0,0]} name="in" />
              <Bar dataKey="out" fill="#dc2626" radius={[4,4,0,0]} name="out" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie chart */}
      {expenseCats.length > 0 && (
        <div className="rounded-2xl p-4 mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Expenses by Category</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={expenseCats}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                fontSize={9}
              >
                {expenseCats.map((c, i) => (
                  <Cell key={i} fill={c.color || '#6366f1'} />
                ))}
              </Pie>
              <Tooltip formatter={v => fmtCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Export */}
      <button
        onClick={exportCSV}
        className="w-full py-3 rounded-xl font-bold text-white mb-3"
        style={{ background: 'var(--accent-gradient)' }}
      >
        📥 Export CSV
      </button>
    </div>
  )
}
