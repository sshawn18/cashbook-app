import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useBooks } from '../hooks/useBooks'
import { useTransactions, useSummary, useDeleteTransaction, useCreateTransaction } from '../hooks/useTransactions'
import { fmtNum, dayLabel, groupByDate } from '../lib/utils'
import { EMPTY_FILTERS, filtersToQuery, activeCount, dateLabel, MODES } from '../lib/filters'
import AddTransactionSheet from '../modals/AddTransactionSheet'
import FilterSheet from '../components/FilterSheet'
import BookSwitcher from '../components/BookSwitcher'
import Icon from '../components/Icon'
import { SkeletonCard } from '../components/Skeleton'

const signed = (t) => (t.type === 'in' ? Number(t.amount) : -Number(t.amount))

export default function LedgerPage() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const { data: books = [] } = useBooks()
  const book = books.find(b => String(b.id) === bookId)

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetType, setSheetType] = useState('out')
  const [editTxn, setEditTxn] = useState(null)
  const [limit, setLimit] = useState(50)

  useEffect(() => { if (bookId) { try { localStorage.setItem('cb_last_book', bookId) } catch { /* ignore */ } } }, [bookId])

  const query = useMemo(() => filtersToQuery(filters, search.trim()), [filters, search])
  const { data: txnsResult, isLoading } = useTransactions(bookId, { ...query, limit })
  const { data: summary } = useSummary(bookId, query)
  const deleteTxn = useDeleteTransaction(bookId)
  const createTxn = useCreateTransaction(bookId)

  const txnsList = useMemo(() => txnsResult?.data || [], [txnsResult])
  const hasMore = txnsResult?.hasMore || false
  const nActive = activeCount(filters)

  // Running balance: starts from the (filtered) net balance and walks down the newest-first list
  const rows = useMemo(() => {
    let bal = summary?.netBalance
    if (bal === undefined) return txnsList.map(t => ({ ...t }))
    return txnsList.map(t => {
      const r = { ...t, runningBalance: bal }
      bal -= signed(t)
      return r
    })
  }, [txnsList, summary])

  const grouped = useMemo(() => groupByDate(rows), [rows])

  const openAdd = (type) => { setSheetType(type); setEditTxn(null); setSheetOpen(true) }
  const openEdit = (txn) => { setEditTxn(txn); setSheetType(txn.type); setSheetOpen(true) }

  const handleDelete = (e, txn) => {
    e.stopPropagation()
    const original = { ...txn }
    deleteTxn.mutate(txn.id, {
      onSuccess: () => {
        toast(
          (t) => (
            <div className="flex items-center gap-3 text-[13px]">
              <span>Entry deleted</span>
              <button
                onClick={() => {
                  createTxn.mutate({
                    type: original.type, amount: original.amount, date: original.date, note: original.note,
                    category_id: original.category_id, party_id: original.party_id, payment_mode: original.payment_mode,
                  })
                  toast.dismiss(t.id)
                }}
                className="font-semibold"
                style={{ color: 'var(--accent)' }}
              >
                Undo
              </button>
            </div>
          ),
          { duration: 5000 }
        )
      },
    })
  }

  const net = summary?.netBalance ?? 0
  const tin = summary?.totalIn ?? 0
  const tout = summary?.totalOut ?? 0
  const inShare = tin + tout > 0 ? (tin / (tin + tout)) * 100 : 0

  const chip = (on, label, onClick, icon) => (
    <button
      onClick={onClick}
      className="press shrink-0 h-8 px-3 rounded-full flex items-center gap-1.5 text-[12.5px] whitespace-nowrap"
      style={{
        background: on ? 'var(--accent-soft)' : 'transparent',
        border: `1px solid ${on ? 'var(--accent-line)' : 'var(--border)'}`,
        color: on ? 'var(--accent)' : 'var(--chip-text)',
      }}
    >
      {icon && <Icon name={icon} size={13} />}
      {label}
    </button>
  )

  const catCount = filters.categoryId.length
  const modeCount = filters.mode.length

  return (
    <div className="page flex flex-col min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-1">
        <button onClick={() => setSwitcherOpen(true)} className="press flex items-center gap-1 text-[16px] font-medium" style={{ color: 'var(--text-primary)' }}>
          {book?.name || '…'}
          <Icon name="chevron" size={15} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
          <button onClick={() => { setShowSearch(s => !s); if (showSearch) setSearch('') }} className="press w-9 h-9 grid place-items-center rounded-full" aria-label="Search">
            <Icon name="search" size={18} />
          </button>
          <button onClick={() => navigate('/reports')} className="press w-9 h-9 grid place-items-center rounded-full" aria-label="Reports">
            <Icon name="chart" size={18} />
          </button>
          <button onClick={() => navigate('/more')} className="press w-9 h-9 grid place-items-center rounded-full" aria-label="Menu">
            <Icon name="menu" size={18} />
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="rise px-5 pt-1 pb-1">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setLimit(50) }}
            placeholder="Search remark or contact"
            autoFocus
            className="w-full h-10 rounded-xl px-3.5 text-[13.5px] outline-none"
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
      )}

      {/* Balance */}
      <div className="px-5 pt-4 pb-3">
        <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
          {summary?.filtered ? 'Filtered balance' : 'Net balance'}
        </p>
        <p className="num mt-0.5" style={{ fontSize: 34, fontWeight: 300, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
          {net < 0 && <span style={{ color: 'var(--text-muted)', fontSize: 20, marginRight: 2, letterSpacing: 0 }}>−</span>}
          {fmtNum(net)}
        </p>
        <div className="h-[3px] rounded-full mt-3 overflow-hidden flex gap-[3px]" style={{ background: tin + tout > 0 ? 'transparent' : 'var(--border)' }}>
          {tin + tout > 0 && (
            <>
              <i style={{ width: `${inShare}%`, background: 'var(--cash-in)', borderRadius: 9, display: 'block' }} />
              <i style={{ flex: 1, background: 'var(--cash-out)', borderRadius: 9, display: 'block' }} />
            </>
          )}
        </div>
        <div className="flex gap-5 mt-2.5 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          <span>In <b className="num font-medium" style={{ color: 'var(--cash-in)' }}>{fmtNum(tin)}</b></span>
          <span>Out <b className="num font-medium" style={{ color: 'var(--cash-out)' }}>{fmtNum(tout)}</b></span>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 px-5 pb-2 overflow-x-auto no-scrollbar">
        {chip(nActive > 0, nActive > 0 ? `Filters · ${nActive}` : 'Filters', () => setFilterOpen(true), 'filter')}
        {chip(filters.preset !== 'all', dateLabel(filters), () => setFilterOpen(true), 'calendar')}
        {chip(!!filters.type, filters.type === 'in' ? 'Cash in' : filters.type === 'out' ? 'Cash out' : 'Type', () => setFilterOpen(true))}
        {chip(catCount > 0, catCount ? `Category · ${catCount}` : 'Category', () => setFilterOpen(true))}
        {chip(modeCount > 0, modeCount ? filters.mode.map(m => MODES.find(x => x.id === m)?.label || m).join(', ') : 'Mode', () => setFilterOpen(true))}
        {nActive > 0 && (
          <button onClick={() => setFilters(EMPTY_FILTERS)} className="shrink-0 h-8 px-2 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
            Clear
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 px-5 pb-40">
        {isLoading && (
          <div className="space-y-2 mt-3">{[44, 44, 44, 44, 44, 44].map((h, i) => <SkeletonCard key={i} height={h} />)}</div>
        )}

        {!isLoading && txnsList.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-1.5 text-center">
            <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>
              {nActive > 0 || search ? 'Nothing matches' : 'No entries yet'}
            </p>
            <p className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
              {nActive > 0 || search ? 'Try clearing a filter.' : 'Tap In or Out below to add your first one.'}
            </p>
          </div>
        )}

        {grouped.map(([date, dayRows]) => {
          const dayNet = dayRows.reduce((s, t) => s + signed(t), 0)
          return (
            <div key={date}>
              <div className="flex justify-between items-center pt-4 pb-1 text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
                <span>{dayLabel(date)}</span>
                <span className="num">{dayNet < 0 ? '−' : '+'}{fmtNum(dayNet)}</span>
              </div>
              {dayRows.map(txn => {
                const label = txn.note || txn.category_name || (txn.type === 'in' ? 'Cash in' : 'Cash out')
                const sub = [txn.category_name !== label && txn.category_name, MODES.find(m => m.id === txn.payment_mode)?.label || txn.payment_mode, txn.party_name].filter(Boolean).join(' · ')
                return (
                  <div
                    key={txn.id}
                    onClick={() => openEdit(txn)}
                    className="press group flex items-center gap-3 cursor-pointer"
                    style={{ minHeight: 52, borderBottom: '1px solid var(--border)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-[10px] grid place-items-center shrink-0 text-[12px] font-medium"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--chip-text)' }}
                    >
                      {(txn.category_name || label).trim().charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 leading-tight">
                      <p className="text-[14px] truncate" style={{ color: 'var(--text-primary)' }}>{label}</p>
                      <p className="text-[11.5px] truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>{sub}</p>
                    </div>
                    <div className="text-right leading-tight shrink-0">
                      <p className="num text-[14px] font-medium" style={{ color: txn.type === 'in' ? 'var(--cash-in)' : 'var(--cash-out)' }}>
                        {txn.type === 'in' ? '+' : '−'}{fmtNum(txn.amount)}
                      </p>
                      {txn.runningBalance !== undefined && (
                        <p className="num text-[10.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {txn.runningBalance < 0 ? '−' : ''}{fmtNum(txn.runningBalance)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, txn)}
                      className="w-7 h-7 -mr-1.5 grid place-items-center rounded-lg shrink-0"
                      style={{ color: 'var(--text-muted)' }}
                      aria-label="Delete entry"
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )
        })}

        {hasMore && !isLoading && (
          <button
            onClick={() => setLimit(l => l + 50)}
            className="press w-full h-10 rounded-xl text-[13px] mt-4"
            style={{ border: '1px solid var(--border)', color: 'var(--chip-text)' }}
          >
            Load more
          </button>
        )}
      </div>

      {/* Floating In / Out bar */}
      <div className="fixed left-0 right-0 flex justify-center pointer-events-none" style={{ bottom: 18, maxWidth: 480, margin: '0 auto', zIndex: 40 }}>
        <div
          className="pointer-events-auto flex gap-1 p-1 rounded-full"
          style={{ background: 'var(--nav-bg)', border: '1px solid var(--border)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', boxShadow: '0 10px 30px rgba(0,0,0,0.45)' }}
        >
          <button
            onClick={() => openAdd('in')}
            className="press h-11 pl-4 pr-5 rounded-full flex items-center gap-1.5 text-[13.5px] font-medium"
            style={{ background: 'var(--cash-in)', color: '#04210f' }}
          >
            <Icon name="plus" size={15} style={{ strokeWidth: 2.4 }} /> In
          </button>
          <button
            onClick={() => openAdd('out')}
            className="press h-11 pl-4 pr-5 rounded-full flex items-center gap-1.5 text-[13.5px] font-medium"
            style={{ color: 'var(--cash-out)' }}
          >
            <Icon name="minus" size={15} style={{ strokeWidth: 2.4 }} /> Out
          </button>
        </div>
      </div>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        bookId={bookId}
        value={filters}
        onApply={(f) => { setFilters(f); setLimit(50) }}
      />
      <BookSwitcher open={switcherOpen} onClose={() => setSwitcherOpen(false)} currentId={bookId} />
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
