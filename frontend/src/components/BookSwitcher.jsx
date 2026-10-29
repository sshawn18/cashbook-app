import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomSheet from './BottomSheet'
import Icon from './Icon'
import { useBooks, useCreateBook } from '../hooks/useBooks'
import { fmtNum } from '../lib/utils'

export default function BookSwitcher({ open, onClose, currentId }) {
  const navigate = useNavigate()
  const { data: books = [] } = useBooks()
  const createBook = useCreateBook()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const go = (id) => { onClose(); navigate(`/book/${id}`) }

  const create = async () => {
    const n = name.trim()
    if (!n) return
    try {
      const b = await createBook.mutateAsync({ name: n, opening_balance: 0 })
      setName(''); setAdding(false)
      go(b.id)
    } catch { /* toast shown by hook */ }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Books">
      <div className="-mx-1">
        {books.map(b => {
          const on = String(b.id) === String(currentId)
          const bal = b.net_balance ?? 0
          return (
            <button
              key={b.id}
              onClick={() => go(b.id)}
              className="press w-full h-12 px-1 flex items-center gap-3 text-left"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <span className="flex-1 text-[14px]" style={{ color: on ? 'var(--accent)' : 'var(--text-primary)' }}>{b.name}</span>
              <span className="num text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>{bal < 0 ? '−' : ''}{fmtNum(bal)}</span>
              {on && <Icon name="check" size={15} style={{ color: 'var(--accent)' }} />}
            </button>
          )
        })}
      </div>

      {adding ? (
        <div className="flex gap-2 mt-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && create()}
            placeholder="Book name"
            autoFocus
            className="flex-1 h-10 rounded-xl px-3.5 text-[13.5px] outline-none"
            style={{ background: 'transparent', border: '1px solid var(--accent-line)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={create}
            disabled={!name.trim() || createBook.isPending}
            className="press px-4 rounded-xl text-[13px] font-medium disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            Add
          </button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="press mt-3 h-10 flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--accent)' }}>
          <Icon name="plus" size={14} /> New book
        </button>
      )}
    </BottomSheet>
  )
}
