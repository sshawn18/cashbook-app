export const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Math.abs(n))

// Takes rupee value (legacy)
export const fmtCurrency = (n, symbol = '₹') => `${symbol}${fmt(n)}`

// Takes paise value (new – backend stores paise)
export const fmtPaise = (paise, symbol = '₹') => {
  const n = Math.abs(paise / 100)
  return `${symbol}${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)}`
}

export const fmtDate = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

const pad = (n) => String(n).padStart(2, '0')
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const today = () => ymd(new Date())

// Indian-grouped number from paise, no currency symbol
export const fmtNum = (paise) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Math.abs(paise / 100))

export const dayLabel = (d) => {
  const t = today()
  const y = ymd(new Date(Date.now() - 86400000))
  if (d === t) return 'Today'
  if (d === y) return 'Yesterday'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const datePresets = () => {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastPrevEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const lastPrevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const week = new Date(now.getTime() - 6 * 86400000)
  return {
    today:     { label: 'Today',      from: ymd(now),            to: ymd(now) },
    week:      { label: '7 days',     from: ymd(week),           to: ymd(now) },
    month:     { label: 'This month', from: ymd(first),          to: ymd(now) },
    lastMonth: { label: 'Last month', from: ymd(lastPrevStart),  to: ymd(lastPrevEnd) },
  }
}

export const groupByDate = (txns) => {
  const map = {}
  for (const t of txns) {
    if (!map[t.date]) map[t.date] = []
    map[t.date].push(t)
  }
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
}
