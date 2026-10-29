export function SkeletonCard({ height = 72 }) {
  return (
    <div style={{
      height,
      borderRadius: 16,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, transparent 0%, var(--border) 50%, transparent 100%)',
        animation: 'skeleton-sweep 1.4s ease infinite',
      }} />
    </div>
  )
}
