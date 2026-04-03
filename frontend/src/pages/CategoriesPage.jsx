import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCategories, useCreateCategory, useDeleteCategory } from '../hooks/useCategories'
import BottomSheet from '../components/BottomSheet'

const emptyForm = { name: '', type: 'expense', icon: '📦', color: '#6366f1' }

export default function CategoriesPage() {
  const navigate = useNavigate()
  const { data: categories = [] } = useCategories()
  const createCat = useCreateCategory()
  const deleteCat = useDeleteCategory()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    try {
      await createCat.mutateAsync(form)
      setOpen(false)
      setForm({ name: '', type: 'expense', icon: '📦', color: '#6366f1' })
    } catch {
      // toast already shown by hook
    }
  }

  return (
    <div className="px-4 pt-10" style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-2xl" style={{ color: 'var(--text-primary)' }}>←</button>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Categories</h1>
      </div>

      <div className="space-y-2 pb-24">
        {['income', 'expense'].map(typeFilter => {
          const group = categories.filter(c => c.type === typeFilter)
          if (group.length === 0) return null
          return (
            <div key={typeFilter}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2 mt-4" style={{ color: 'var(--text-muted)' }}>
                {typeFilter === 'income' ? 'Income' : 'Expense'}
              </p>
              {group.map(cat => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-2xl mb-2"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: cat.color + '22' }}
                    >
                      {cat.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{cat.name}</p>
                      {cat.is_default ? (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Default</p>
                      ) : null}
                    </div>
                  </div>
                  {!cat.is_default && (
                    <button
                      onClick={() => window.confirm('Delete category?') && deleteCat.mutate(cat.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-lg"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 px-5 py-3 rounded-2xl font-bold text-white z-40"
        style={{ background: 'var(--accent-gradient)', boxShadow: '0 4px 20px rgba(26,35,126,0.4)' }}
      >
        + Add Category
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Add Category">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              Name
            </label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Category name"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              Icon (emoji)
            </label>
            <input
              value={form.icon}
              onChange={e => set('icon', e.target.value)}
              placeholder="📦"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              Type
            </label>
            <div className="flex gap-2">
              {['income', 'expense'].map(t => (
                <button
                  key={t}
                  onClick={() => set('type', t)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold capitalize"
                  style={{
                    background: form.type === t ? 'var(--accent)' : 'var(--chip-bg)',
                    color: form.type === t ? '#fff' : 'var(--chip-text)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={createCat.isPending}
            className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-60"
            style={{ background: 'var(--accent-gradient)' }}
          >
            {createCat.isPending ? 'Saving...' : 'Add Category'}
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
