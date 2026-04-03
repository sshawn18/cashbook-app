import { useNavigate } from 'react-router-dom'
import { useBooks } from '../hooks/useBooks'

export default function MorePage() {
  const navigate = useNavigate()
  const { data: books = [] } = useBooks()
  const bookId = books[0]?.id

  const items = [
    { icon: '👥', label: 'Parties',    sub: 'Customer & supplier ledger',    to: bookId ? `/more/parties/${bookId}` : null },
    { icon: '📂', label: 'Categories', sub: 'Manage income & expense types',  to: '/more/categories' },
    { icon: '⚙️', label: 'Settings',   sub: 'Business name, theme',          to: '/more/settings' },
    { icon: '💾', label: 'Backup',     sub: 'Export & import your data',      to: '/more/backup' },
  ]

  return (
    <div className="px-4 pt-10" style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <h1 className="text-2xl font-extrabold mb-6" style={{ color: 'var(--text-primary)' }}>More</h1>
      <div className="space-y-2">
        {items.map(item => (
          <button
            key={item.label}
            onClick={() => item.to && navigate(item.to)}
            disabled={!item.to}
            className="w-full flex items-center justify-between p-4 rounded-2xl disabled:opacity-50"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div className="text-left">
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.sub}</p>
              </div>
            </div>
            <span style={{ color: 'var(--text-secondary)' }}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}
