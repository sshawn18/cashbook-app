import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooks, useCreateBook, useDeleteBook } from '../hooks/useBooks'
import { fmtCurrency } from '../lib/utils'
import { useTheme } from '../context/ThemeContext'
import BottomSheet from '../components/BottomSheet'

export default function HomePage() {
  const { data: books = [], isLoading } = useBooks()
  const createBook = useCreateBook()
  const deleteBook = useDeleteBook()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  const [showSheet, setShowSheet] = useState(false)
  const [form, setForm] = useState({ name: '', opening_balance: '' })

  // show onboarding if no books on first load
  useEffect(() => {
    if (!isLoading && books.length === 0) setShowSheet(true)
  }, [isLoading, books.length])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    await createBook.mutateAsync({ name: form.name.trim(), opening_balance: Number(form.opening_balance) || 0 })
    setForm({ name: '', opening_balance: '' })
    setShowSheet(false)
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            My Cashbooks
          </p>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            Books
          </h1>
        </div>
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Book list */}
      <div className="flex-1 px-4 space-y-3 overflow-y-auto pb-24">
        {isLoading && (
          <p className="text-center py-10" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        )}
        {!isLoading && books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-6xl">📒</span>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>No books yet</p>
            <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              Create your first cashbook to start tracking
            </p>
          </div>
        )}
        {books.map(book => (
          <div
            key={book.id}
            onClick={() => navigate(`/book/${book.id}`)}
            className="flex items-center justify-between p-4 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'var(--accent-gradient)' }}
              >
                📒
              </div>
              <div>
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{book.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Updated {new Date(book.updated_at).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-base font-bold"
                style={{ color: (book.net_balance ?? 0) >= 0 ? 'var(--cash-in)' : 'var(--cash-out)' }}
              >
                {(book.net_balance ?? 0) < 0 ? '-' : ''}{fmtCurrency(book.net_balance ?? 0)}
              </span>
              <button
                onClick={e => {
                  e.stopPropagation()
                  if (window.confirm(`Delete "${book.name}"? All entries will be lost.`)) {
                    deleteBook.mutate(book.id)
                  }
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

      {/* FAB */}
      <button
        onClick={() => setShowSheet(true)}
        className="fixed bottom-20 right-4 flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-white shadow-lg z-40"
        style={{
          background: 'var(--accent-gradient)',
          boxShadow: '0 4px 20px rgba(26,35,126,0.4)',
        }}
      >
        + ADD NEW BOOK
      </button>

      {/* Create Book Sheet */}
      <BottomSheet
        open={showSheet}
        onClose={() => setShowSheet(false)}
        title={books.length === 0 ? '👋 Welcome! Create your first book' : 'Create a Book'}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Book Name
            </label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. March 2026, Main Business"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Opening Balance (₹)
            </label>
            <input
              type="number"
              value={form.opening_balance}
              onChange={e => setForm(f => ({ ...f, opening_balance: e.target.value }))}
              placeholder="0"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={createBook.isPending}
            className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-60"
            style={{ background: 'var(--accent-gradient)' }}
          >
            {createBook.isPending ? 'Creating...' : 'Create Book'}
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
