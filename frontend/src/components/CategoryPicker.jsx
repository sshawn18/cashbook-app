import { useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { useCategories, useCreateCategory } from '../hooks/useCategories'

// Dropdown with search and inline "Create" — never leaves the entry sheet.
export default function CategoryPicker({ type, value, onChange }) {
  const { data: categories = [] } = useCategories()
  const createCategory = useCreateCategory()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const inputRef = useRef(null)

  const catType = type === 'in' ? 'income' : 'expense'
  const list = useMemo(() => {
    const seen = new Set()
    // Prefer the user's own copy when a shared default has the same name
    return [...categories]
      .sort((a, b) => (b.user_id ? 1 : 0) - (a.user_id ? 1 : 0))
      .filter(c => {
        const k = c.type + ':' + c.name.trim().toLowerCase()
        if (c.type !== catType || seen.has(k)) return false
        seen.add(k)
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [categories, catType])
  const selected = categories.find(c => String(c.id) === String(value))

  const term = q.trim()
  const shown = term ? list.filter(c => c.name.toLowerCase().includes(term.toLowerCase())) : list
  const exact = list.some(c => c.name.toLowerCase() === term.toLowerCase())

  const pick = (id) => { onChange(id ? String(id) : ''); setOpen(false); setQ('') }

  const create = async () => {
    if (!term || createCategory.isPending) return
    try {
      const cat = await createCategory.mutateAsync({ name: term, type: catType, icon: '📌', color: '#6366f1' })
      pick(cat.id)
    } catch { /* toast shown by hook */ }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 60) }}
        className="press w-full h-11 rounded-xl px-3.5 flex items-center justify-between text-[13.5px]"
        style={{
          background: 'transparent',
          border: `1px solid ${open ? 'var(--accent-line)' : 'var(--border)'}`,
          color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
      >
        <span>{selected ? selected.name : 'Category'}</span>
        <Icon name="chevron" size={15} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>

      {open && (
        <div className="rise mt-1.5 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div className="flex items-center gap-2 px-3 h-10" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <Icon name="search" size={14} />
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (term && !exact) create(); else if (shown[0]) pick(shown[0].id) } }}
              placeholder="Search or create…"
              className="flex-1 bg-transparent outline-none text-[13px]"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
          <div className="max-h-44 overflow-y-auto no-scrollbar">
            {term && !exact && (
              <button
                type="button"
                onClick={create}
                disabled={createCategory.isPending}
                className="w-full h-10 px-3 flex items-center gap-2 text-left text-[13px]"
                style={{ color: 'var(--accent)', borderBottom: '1px solid var(--border)' }}
              >
                <Icon name="plus" size={14} />
                {createCategory.isPending ? 'Creating…' : `Create “${term}”`}
              </button>
            )}
            {value && (
              <button
                type="button"
                onClick={() => pick('')}
                className="w-full h-10 px-3 text-left text-[13px]"
                style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
              >
                No category
              </button>
            )}
            {shown.map(c => (
              <button
                type="button"
                key={c.id}
                onClick={() => pick(c.id)}
                className="w-full h-10 px-3 flex items-center justify-between text-left text-[13px]"
                style={{ color: 'var(--text-primary)' }}
              >
                {c.name}
                {String(c.id) === String(value) && <Icon name="check" size={14} style={{ color: 'var(--accent)' }} />}
              </button>
            ))}
            {shown.length === 0 && !term && (
              <p className="px-3 py-3 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>No categories yet. Type a name to create one.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
