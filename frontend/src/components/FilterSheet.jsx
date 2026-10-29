import { useState } from 'react'
import BottomSheet from './BottomSheet'
import { useCategories } from '../hooks/useCategories'
import { useSummary } from '../hooks/useTransactions'
import { datePresets } from '../lib/utils'
import { EMPTY_FILTERS, MODES, filtersToQuery } from '../lib/filters'

function Pill({ on, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="press h-8 px-3.5 rounded-full text-[12.5px] whitespace-nowrap"
      style={{
        background: on ? 'var(--accent-soft)' : 'transparent',
        border: `1px solid ${on ? 'var(--accent-line)' : 'var(--border)'}`,
        color: on ? 'var(--accent)' : 'var(--chip-text)',
      }}
    >
      {children}
    </button>
  )
}

function Group({ label, children }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

const toggle = (arr, v) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])

// Mount fresh on every open so the draft always starts from the applied filters
export default function FilterSheet({ open, ...rest }) {
  return open ? <FilterForm {...rest} /> : null
}

function FilterForm({ onClose, bookId, value, onApply }) {
  const open = true
  const [draft, setDraft] = useState(value)
  const { data: categories = [] } = useCategories()
  const { data: preview } = useSummary(bookId, filtersToQuery(draft))

  // Same-named categories (shared default + personal copy) become one chip covering all their ids
  const groups = Object.values(
    categories.reduce((acc, c) => {
      const k = c.name.trim().toLowerCase()
      ;(acc[k] ||= { name: c.name, ids: [] }).ids.push(String(c.id))
      return acc
    }, {})
  ).sort((a, b) => a.name.localeCompare(b.name))

  const presets = datePresets()
  const set = (patch) => setDraft(d => ({ ...d, ...patch }))

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Filters"
      right={
        <button onClick={() => setDraft(EMPTY_FILTERS)} className="text-[12.5px]" style={{ color: 'var(--accent)' }}>
          Clear
        </button>
      }
      footer={
        <button
          onClick={() => { onApply(draft); onClose() }}
          className="press w-full h-11 rounded-xl text-[13.5px] font-medium"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          {preview ? `Show ${preview.count} ${preview.count === 1 ? 'entry' : 'entries'}` : 'Apply'}
        </button>
      }
    >
      <Group label="Date">
        <Pill on={draft.preset === 'all'} onClick={() => set({ preset: 'all' })}>All time</Pill>
        {Object.entries(presets).map(([k, p]) => (
          <Pill key={k} on={draft.preset === k} onClick={() => set({ preset: k })}>{p.label}</Pill>
        ))}
        <Pill on={draft.preset === 'custom'} onClick={() => set({ preset: 'custom' })}>Custom</Pill>
      </Group>

      {draft.preset === 'custom' && (
        <div className="flex gap-2 mb-5 -mt-2">
          {[['from', 'From'], ['to', 'To']].map(([k, l]) => (
            <label key={k} className="flex-1 text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>
              {l}
              <input
                type="date"
                value={draft[k]}
                onChange={e => set({ [k]: e.target.value })}
                className="mt-1 w-full h-10 rounded-xl px-3 text-[13px] outline-none normal-case tracking-normal"
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </label>
          ))}
        </div>
      )}

      <Group label="Type">
        {[['', 'All'], ['out', 'Cash out'], ['in', 'Cash in']].map(([v, l]) => (
          <Pill key={v} on={draft.type === v} onClick={() => set({ type: v })}>{l}</Pill>
        ))}
      </Group>

      <Group label="Category">
        {groups.map(g => {
          const on = g.ids.some(id => draft.categoryId.includes(id))
          return (
            <Pill
              key={g.name}
              on={on}
              onClick={() => set({
                categoryId: on
                  ? draft.categoryId.filter(id => !g.ids.includes(id))
                  : [...draft.categoryId, ...g.ids.filter(id => !draft.categoryId.includes(id))],
              })}
            >
              {g.name}
            </Pill>
          )
        })}
        {groups.length === 0 && <span className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>No categories yet</span>}
      </Group>

      <Group label="Payment mode">
        {MODES.map(m => (
          <Pill key={m.id} on={draft.mode.includes(m.id)} onClick={() => set({ mode: toggle(draft.mode, m.id) })}>{m.label}</Pill>
        ))}
      </Group>
    </BottomSheet>
  )
}
