import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBooks } from '../hooks/useBooks'
import { useTransactions, useSummary, useDeleteTransaction } from '../hooks/useTransactions'
import { fmtCurrency, fmtDate, groupByDate } from '../lib/utils'
import AddTransactionSheet from '../modals/AddTransactionSheet'

export default function LedgerPage() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const { data: books = [] } = useBooks()
  const book = books.find(b => String(b.id) === bookId)

  const [filters, setFilters] = useState({})
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetType, setSheetType] = useState('in')
  const [editTxn, setEditTxn] = useState(null)

  const activeFilters = { ...filters, ...(search ? { search } : {}) }
  const { data: txns = [], isLoading } = useTransactions(bookId, activeFilters)
  const { data: summary } = useSummary(bookId)
  const deleteTxn = useDeleteTransaction(bookId)

  const grouped = groupByDate(txns)

  const openAdd = (type) => { setSheetType(type); setEditTxn(null); setSheetOpen(true) }
  const openEdit = (txn) => { setEditTxn(txn); setSheetType(txn.type); setSheetOpen(true) }

  const setType = (t) => setFilters(f => ({ ...f, type: t === 'all' ? undefined : t }))
  const setMode = (m) => setFilters(f => ({ ...f, payment_mode: f.payment_mode === m ? undefined : m }))

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-3" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate('/')} className="text-2xl" style={{ color: 'var(--text-primary)' }}>←</button>
          <div className="text-center">
            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              {book?.name || '...'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Cashbook</p>
          </div>
          <button onClick={() => setShowSearch(s => !s)} className="text-xl">🔍</button>
        </div>

        {showSearch && (
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search entries..."
            autoFocus
            className="w-full rounded-xl px-4 py-2 text-sm mb-3 outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        )}

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[['all','All'],['in','↑ Cash In'],['out','↓ Cash Out']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setType(val)}
              className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{
                background: (filters.type === val || (!filters.type && val === 'all')) ? 'var(--accent)' : 'var(--chip-bg)',
                color: (filters.type === val || (!filters.type && val === 'all')) ? '#fff' : 'var(--chip-text)',
              }}
            >
              {label}
            </button>
          ))}
          {['cash','upi','bank'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap uppercase"
              style={{
                background: filters.payment_mode === m ? 'var(--accent)' : 'var(--chip-bg)',
                color: filters.payment_mode === m ? '#fff' : 'var(--chip-text)',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Summary card */}
      {summary && (
        <div className="mx-4 mb-3 rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Net Balance</span>
            <span
              className="text-xl font-extrabold"
              style={{ color: summary.netBalance >= 0 ? 'var(--cash-in)' : 'var(--cash-out)' }}
            >
              {summary.netBalance < 0 ? '-' : ''}{fmtCurrency(summary.netBalance)}
            </span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Total In (+)</span>
            <span className="font-bold" style={{ color: 'var(--cash-in)' }}>{fmtCurrency(summary.totalIn)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span style={{ color: 'var(--text-secondary)' }}>Total Out (-)</span>
            <span className="font-bold" style={{ color: 'var(--cash-out)' }}>{fmtCurrency(summary.totalOut)}</span>
          </div>
          <button
            onClick={() => navigate('/reports')}
            className="mt-3 text-xs font-bold tracking-widest"
            style={{ color: 'var(--accent)' }}
          >
            VIEW REPORTS →
          </button>
        </div>
      )}

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-4">
        {isLoading && <p className="text-center py-10" style={{ color: 'var(--text-secondary)' }}>Loading...</p>}
        {!isLoading && txns.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-2">
            <span className="text-5xl">📭</span>
            <p style={{ color: 'var(--text-secondary)' }}>No entries yet</p>
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              Tap CASH IN or CASH OUT below to add your first entry
            </p>
          </div>
        )}
        {grouped.map(([date, rows]) => (
          <div key={date}>
            <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {fmtDate(date)}
            </p>
            <div className="space-y-2">
              {rows.map(txn => (
                <div
                  key={txn.id}
                  onClick={() => openEdit(txn)}
                  className="flex items-center justify-between p-3 rounded-2xl cursor-pointer active:scale-[0.99] transition-transform"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{
                        background: txn.type === 'in'
                          ? 'rgba(22,163,74,0.12)'
                          : 'rgba(220,38,38,0.12)',
                      }}
                    >
                      {txn.category_icon || (txn.type === 'in' ? '💰' : '💸')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {txn.note || txn.category_name || (txn.type === 'in' ? 'Cash In' : 'Cash Out')}
                      </p>
                      <div className="flex gap-1 mt-0.5 items-center flex-wrap">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--chip-bg)', color: 'var(--chip-text)' }}
                        >
                          {txn.payment_mode?.toUpperCase()}
                        </span>
                        {txn.party_name && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--chip-bg)', color: 'var(--chip-text)' }}
                          >
                            {txn.party_name}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(txn.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p
                      className="font-bold text-right"
                      style={{ color: txn.type === 'in' ? 'var(--cash-in)' : 'var(--cash-out)' }}
                    >
                      {txn.type === 'in' ? '+' : '-'}{fmtCurrency(txn.amount)}
                    </p>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        if (window.confirm('Delete this entry?')) deleteTxn.mutate(txn.id)
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-lg"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky CASH IN / OUT buttons */}
      <div
        className="fixed bottom-16 left-0 right-0 flex z-40"
        style={{ maxWidth: 480, margin: '0 auto' }}
      >
        <button
          onClick={() => openAdd('in')}
          className="flex-1 py-4 font-bold text-white text-sm tracking-wide"
          style={{
            background: 'linear-gradient(135deg,#16a34a,#15803d)',
            boxShadow: '0 -2px 12px rgba(22,163,74,0.3)',
          }}
        >
          + CASH IN
        </button>
        <button
          onClick={() => openAdd('out')}
          className="flex-1 py-4 font-bold text-white text-sm tracking-wide"
          style={{
            background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
            boxShadow: '0 -2px 12px rgba(220,38,38,0.3)',
          }}
        >
          − CASH OUT
        </button>
      </div>

      <AddTransactionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        bookId={bookId}
        defaultType={sheetType}
        editData={editTxn}
      />
    </div>
  )
}
