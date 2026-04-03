export const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Math.abs(n))

export const fmtCurrency = (n, symbol = '₹') => `${symbol}${fmt(n)}`

export const fmtDate = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

export const today = () => new Date().toISOString().slice(0, 10)

export const groupByDate = (txns) => {
  const map = {}
  for (const t of txns) {
    if (!map[t.date]) map[t.date] = []
    map[t.date].push(t)
  }
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
}
