import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useParties, useCreateParty, useDeleteParty } from '../hooks/useParties'
import { fmtCurrency } from '../lib/utils'
import BottomSheet from '../components/BottomSheet'

const emptyForm = { name: '', phone: '', type: 'customer', opening_balance: '' }

export default function PartiesPage() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const { data: parties = [] } = useParties(bookId)
  const createParty = useCreateParty(bookId)
  const deleteParty = useDeleteParty(bookId)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    await createParty.mutateAsync({ ...form, opening_balance: Number(form.opening_balance) || 0 })
    setForm(emptyForm)
    setOpen(false)
  }

  return (
    <div className="px-4 pt-10" style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-2xl" style={{ color: 'var(--text-primary)' }}>←</button>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Parties</h1>
      </div>

      <div className="space-y-2 pb-24">
        {parties.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-2">
            <span className="text-5xl">👥</span>
            <p style={{ color: 'var(--text-secondary)' }}>No parties yet</p>
          </div>
        )}
        {parties.map(p => (
          <div
            key={p.id}
            className="flex items-center justify-between p-4 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg"
                style={{ background: 'var(--accent-gradient)' }}
              >
                {(p.name?.[0] || '?').toUpperCase()}
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
                  {p.type || 'party'}{p.phone ? ` · ${p.phone}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="font-bold text-sm"
                style={{ color: p.balance >= 0 ? 'var(--cash-in)' : 'var(--cash-out)' }}
              >
                {fmtCurrency(p.balance)}
              </span>
              <button
                onClick={() => window.confirm('Delete party?') && deleteParty.mutate(p.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-lg"
                style={{ color: 'var(--text-muted)' }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 px-5 py-3 rounded-2xl font-bold text-white z-40"
        style={{ background: 'var(--accent-gradient)', boxShadow: '0 4px 20px rgba(26,35,126,0.4)' }}
      >
        + Add Party
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Add Party">
        <div className="space-y-4">
          {[
            ['Name', 'name', 'text', 'Party name'],
            ['Phone', 'phone', 'tel', 'Phone number (optional)'],
            ['Opening Balance (₹)', 'opening_balance', 'number', '0'],
          ].map(([label, key, type, ph]) => (
            <div key={key}>
              <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                {label}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={ph}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              Type
            </label>
            <div className="flex gap-2">
              {['customer', 'supplier'].map(t => (
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
            disabled={createParty.isPending}
            className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-60"
            style={{ background: 'var(--accent-gradient)' }}
          >
            {createParty.isPending ? 'Saving...' : 'Add Party'}
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
