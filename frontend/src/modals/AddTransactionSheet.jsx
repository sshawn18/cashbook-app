import { useState, useEffect } from 'react'
import BottomSheet from '../components/BottomSheet'
import { useCategories } from '../hooks/useCategories'
import { useParties } from '../hooks/useParties'
import { useCreateTransaction, useUpdateTransaction } from '../hooks/useTransactions'
import { today } from '../lib/utils'

export default function AddTransactionSheet({ open, onClose, bookId, defaultType, editData }) {
  const { data: categories = [] } = useCategories()
  const { data: parties = [] } = useParties(bookId)
  const createTxn = useCreateTransaction(bookId)
  const updateTxn = useUpdateTransaction(bookId)

  const emptyForm = () => ({
    type: defaultType || 'in',
    amount: '',
    category_id: '',
    party_id: '',
    note: '',
    payment_mode: 'cash',
    date: today(),
  })

  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!open) return
    if (editData) {
      setForm({
        type: editData.type,
        amount: String(editData.amount),
        category_id: editData.category_id ? String(editData.category_id) : '',
        party_id: editData.party_id ? String(editData.party_id) : '',
        note: editData.note || '',
        payment_mode: editData.payment_mode || 'cash',
        date: editData.date,
      })
    } else {
      setForm(f => ({ ...emptyForm(), type: defaultType || f.type }))
    }
  }, [open, editData, defaultType])

  const filtered = categories.filter(c =>
    form.type === 'in' ? c.type === 'income' : c.type === 'expense'
  )

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    const amt = Number(form.amount)
    if (!amt || amt <= 0) return
    const payload = {
      type: form.type,
      amount: amt,
      category_id: form.category_id ? Number(form.category_id) : null,
      party_id: form.party_id ? Number(form.party_id) : null,
      note: form.note || null,
      payment_mode: form.payment_mode,
      date: form.date,
    }
    if (editData) {
      await updateTxn.mutateAsync({ id: editData.id, ...payload })
    } else {
      await createTxn.mutateAsync(payload)
    }
    onClose()
  }

  const isSaving = createTxn.isPending || updateTxn.isPending

  return (
    <BottomSheet open={open} onClose={onClose} title={editData ? 'Edit Entry' : 'New Entry'}>
      {/* Type toggle */}
      <div className="flex rounded-xl overflow-hidden mb-4" style={{ border: '1px solid var(--border)' }}>
        {['in', 'out'].map(t => (
          <button
            key={t}
            onClick={() => set('type', t)}
            className="flex-1 py-2.5 font-bold text-sm"
            style={{
              background: form.type === t
                ? (t === 'in' ? '#16a34a' : '#dc2626')
                : 'var(--bg-secondary)',
              color: form.type === t ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {t === 'in' ? '↑ Cash In' : '↓ Cash Out'}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="mb-4">
        <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-secondary)' }}>
          Amount (₹)
        </label>
        <input
          type="number"
          value={form.amount}
          onChange={e => set('amount', e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          className="w-full rounded-xl px-4 py-3 text-2xl font-bold outline-none"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Category */}
      {filtered.length > 0 && (
        <div className="mb-4">
          <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: 'var(--text-secondary)' }}>
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {filtered.map(cat => (
              <button
                key={cat.id}
                onClick={() => set('category_id', String(cat.id) === form.category_id ? '' : String(cat.id))}
                className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1"
                style={{
                  background: String(cat.id) === form.category_id ? cat.color : 'var(--chip-bg)',
                  color: String(cat.id) === form.category_id ? '#fff' : 'var(--chip-text)',
                }}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payment mode */}
      <div className="mb-4">
        <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: 'var(--text-secondary)' }}>
          Payment Mode
        </label>
        <div className="flex gap-2">
          {['cash', 'upi', 'bank'].map(m => (
            <button
              key={m}
              onClick={() => set('payment_mode', m)}
              className="flex-1 py-2 rounded-xl text-xs font-bold uppercase"
              style={{
                background: form.payment_mode === m ? 'var(--accent)' : 'var(--chip-bg)',
                color: form.payment_mode === m ? '#fff' : 'var(--chip-text)',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Party (optional) */}
      {parties.length > 0 && (
        <div className="mb-4">
          <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-secondary)' }}>
            Party (optional)
          </label>
          <select
            value={form.party_id}
            onChange={e => set('party_id', e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="">None</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {/* Note */}
      <div className="mb-4">
        <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-secondary)' }}>
          Note
        </label>
        <input
          value={form.note}
          onChange={e => set('note', e.target.value)}
          placeholder="Add a note..."
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Date */}
      <div className="mb-5">
        <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-secondary)' }}>
          Date
        </label>
        <input
          type="date"
          value={form.date}
          onChange={e => set('date', e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-60"
        style={{
          background: form.type === 'in'
            ? 'linear-gradient(135deg,#16a34a,#15803d)'
            : 'linear-gradient(135deg,#dc2626,#b91c1c)',
        }}
      >
        {isSaving ? 'Saving...' : editData ? 'Update Entry' : 'Save Entry'}
      </button>
    </BottomSheet>
  )
}
