import { useEffect } from 'react'

export default function BottomSheet({ open, onClose, title, right, footer, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 flex items-end justify-center" style={{ maxWidth: 480, margin: '0 auto', zIndex: 60 }}>
      <div className="absolute inset-0 fade-in" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
      <div
        className="relative w-full z-10 sheet-in flex flex-col"
        style={{
          background: 'var(--sheet-bg)',
          borderTop: '1px solid var(--border)',
          borderRadius: '22px 22px 0 0',
          maxHeight: '92vh',
        }}
      >
        <div className="w-8 h-[3px] rounded-full mx-auto mt-2.5" style={{ background: 'var(--border)' }} />
        {(title || right) && (
          <div className="flex items-center justify-between px-5 pt-3">
            <h2 className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>{title}</h2>
            {right}
          </div>
        )}
        <div className="px-5 pt-3 pb-4 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-5 pt-2" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
