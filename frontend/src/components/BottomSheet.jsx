import { useEffect } from 'react'

export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ maxWidth: 480, margin: '0 auto' }}
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        className="relative w-full rounded-t-2xl p-5 pb-8 z-10 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div
          className="w-10 h-1 rounded-full mx-auto mb-4"
          style={{ background: 'var(--border)' }}
        />
        {title && (
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}
