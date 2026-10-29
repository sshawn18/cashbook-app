import { datePresets } from './utils'

export const EMPTY_FILTERS = { preset: 'all', from: '', to: '', type: '', categoryId: [], mode: [] }

export const MODES = [
  { id: 'cash', label: 'Cash' },
  { id: 'upi', label: 'UPI' },
  { id: 'bank', label: 'Bank' },
]

export function resolveRange(f) {
  if (f.preset === 'custom') return { from: f.from || undefined, to: f.to || undefined }
  const p = datePresets()[f.preset]
  return p ? { from: p.from, to: p.to } : {}
}

export function filtersToQuery(f, search = '') {
  const { from, to } = resolveRange(f)
  return {
    from,
    to,
    type: f.type || undefined,
    categoryId: f.categoryId.length ? f.categoryId : undefined,
    mode: f.mode.length ? f.mode : undefined,
    search: search || undefined,
  }
}

export function activeCount(f) {
  return (
    (f.preset !== 'all' ? 1 : 0) +
    (f.type ? 1 : 0) +
    (f.categoryId.length ? 1 : 0) +
    (f.mode.length ? 1 : 0)
  )
}

export function dateLabel(f) {
  if (f.preset === 'all') return 'All time'
  if (f.preset === 'custom') {
    const s = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '…')
    return `${s(f.from)} – ${s(f.to)}`
  }
  return datePresets()[f.preset].label
}
