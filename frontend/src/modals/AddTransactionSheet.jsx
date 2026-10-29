import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import BottomSheet from '../components/BottomSheet'
import CategoryPicker from '../components/CategoryPicker'
import Icon from '../components/Icon'
import { useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '../hooks/useTransactions'
import { today } from '../lib/utils'
import { MODES } from '../lib/filters'

const emptyForm = (type) => ({
  type: type || 'out',
  amount: '',
  category_id: '',
  party_id: '',
  note: '',
  payment_mode: 'cash',
  date: today(),
})

const formFromEdit = (e) => ({
  type: e.type,
  amount: String(e.amount / 100),
  category_id: e.category_id ? String(e.category_id) : '',
  party_id: e.party_id ? String(e.party_id) : '',
  note: e.note || '',
  payment_mode: e.payment_mode || 'cash',
  date: e.date,
})

// Mount the form fresh on every open so state never needs resetting
export default function AddTransactionSheet({ open, ...rest }) {
  return open ? <SheetForm {...rest} /> : null
}

function SheetForm({ onClose, bookId, defaultType, editData }) {
  const open = true
  const createTxn = useCreateTransaction(bookId)
  const updateTxn = useUpdateTransaction(bookId)
  const deleteTxn = useDeleteTransaction(bookId)

  const amountRef = useRef(null)
  const [form, setForm] = useState(() => (editData ? formFromEdit(editData) : emptyForm(defaultType)))
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const t = setTimeout(() => amountRef.current?.focus(), 220)
    return () => clearTimeout(t)
  }, [])

  const isOut = form.type === 'out'
  const tone = isOut ? 'var(--cash-out)' : 'var(--cash-in)'
  const isSaving = createTxn.isPending || updateTxn.isPending
  const amountOk = Number(form.amount) > 0

  const buildPayload = () => ({
    ...form,
    amount: Math.round(Number(form.amount) * 100),
    category_id: form.category_id ? Number(form.category_id) : null,
    party_id: form.party_id ? Number(form.party_id) : null,
  })

  const undoToast = (createdId) =>
    toast(
      (t) => (
        <div className="flex items-center gap-3 text-[13px]">
          <span>Entry added</span>
          {createdId && (
            <button
              onClick={() => { deleteTxn.mutate(createdId); toast.dismiss(t.id) }}
              className="font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              Undo
            </button>
          )}
        </div>
      ),
      { duration: 4000 }
    )

  const handleSave = async (andNew = false) => {
    if (!amountOk || isSaving) return
    try {
      if (editData) {
        await updateTxn.mutateAsync({ id: editData.id, ...buildPayload() })
        onClose()
        return
      }
      const created = await createTxn.mutateAsync(buildPayload())
      undoToast(created?.id ?? created?.data?.id)
      if (andNew) {
        setForm(f => ({ ...f, amount: '', note: '' }))
        setTimeout(() => amountRef.current?.focus(), 50)
      } else {
        onClose()
      }
    } catch { /* error toast shown by hook */ }
  }

  const handleDelete = () => {
    if (!editData) return
    deleteTxn.mutate(editData.id, { onSuccess: () => { toast('Entry deleted'); onClose() } })
  }

  const onAmount = (e) => {
    const v = e.target.value.replace(/,/g, '')
    if (/^\d*\.?\d{0,2}$/.test(v)) set('amount', v)
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={editData ? 'Edit entry' : 'New entry'}
      right={
        editData && (
          <button onClick={handleDelete} className="press w-8 h-8 grid place-items-center rounded-lg" style={{ color: 'var(--text-muted)' }}>
            <Icon name="trash" size={16} />
          </button>
        )
      }
      footer={
        <div className="flex gap-2">
          {!editData && (
            <button
              onClick={() => handleSave(true)}
              disabled={!amountOk || isSaving}
              className="press flex-1 h-11 rounded-xl text-[13px] font-medium disabled:opacity-40"
              style={{ border: '1px solid var(--border)', color: 'var(--chip-text)' }}
            >
              Save &amp; add
            </button>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={!amountOk || isSaving}
            className="press h-11 rounded-xl text-[13.5px] font-medium disabled:opacity-40"
            style={{ flex: editData ? 1 : 1.2, background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            {isSaving ? 'Saving…' : editData ? 'Update' : 'Save'}
          </button>
        </div>
      }
    >
      {/* Type toggle */}
      <div className="flex mx-auto mb-3 p-0.5 rounded-full w-44" style={{ border: '1px solid var(--border)' }}>
        {[['in', 'In'], ['out', 'Out']].map(([t, l]) => {
          const on = form.type === t
          const c = t === 'in' ? 'var(--cash-in)' : 'var(--cash-out)'
          return (
            <button
              key={t}
              onClick={() => { set('type', t); set('category_id', '') }}
              className="flex-1 h-8 rounded-full text-[12.5px] transition-colors"
              style={{
                background: on ? 'color-mix(in srgb, ' + c + ' 14%, transparent)' : 'transparent',
                color: on ? c : 'var(--text-secondary)',
                fontWeight: on ? 500 : 400,
              }}
            >
              {l}
            </button>
          )
        })}
      </div>

      {/* Amount */}
      <input
        ref={amountRef}
        value={form.amount}
        onChange={onAmount}
        inputMode="decimal"
        placeholder="0"
        className="num w-full bg-transparent text-center outline-none mb-4"
        style={{ fontSize: 44, fontWeight: 300, letterSpacing: '-0.04em', color: form.amount ? tone : 'var(--text-muted)', caretColor: 'var(--accent)' }}
      />

      <div className="space-y-2">
        <CategoryPicker type={form.type} value={form.category_id} onChange={(v) => set('category_id', v)} />

        <input
          value={form.note}
          onChange={e => set('note', e.target.value)}
          placeholder="Remark"
          className="w-full h-11 rounded-xl px-3.5 text-[13.5px] outline-none"
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />

        <div className="flex gap-2">
          <input
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value || today())}
            className="h-11 rounded-xl px-3 text-[13px] outline-none flex-1 min-w-0"
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <div className="flex rounded-xl p-0.5" style={{ border: '1px solid var(--border)' }}>
            {MODES.map(m => {
              const on = form.payment_mode === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => set('payment_mode', m.id)}
                  className="px-3 rounded-[10px] text-[12px]"
                  style={{
                    background: on ? 'var(--accent-soft)' : 'transparent',
                    color: on ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: on ? 500 : 400,
                  }}
                >
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}
