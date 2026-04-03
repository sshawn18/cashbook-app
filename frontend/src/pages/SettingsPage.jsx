import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings'),
  })
  const [businessName, setBusinessName] = useState('')

  useEffect(() => {
    if (settings?.businessName) setBusinessName(settings.businessName)
  }, [settings])

  const save = useMutation({
    mutationFn: (data) => api.put('/settings', data),
    onSuccess: () => toast.success('Settings saved'),
    onError: (e) => toast.error(e.message),
  })

  return (
    <div className="px-4 pt-10" style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-2xl" style={{ color: 'var(--text-primary)' }}>←</button>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
      </div>

      <div className="space-y-3">
        {/* Business name */}
        <div className="p-4 rounded-2xl space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <label className="text-xs font-semibold uppercase tracking-wide block" style={{ color: 'var(--text-secondary)' }}>
            Business Name
          </label>
          <input
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            placeholder="Your business name"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={() => save.mutate({ businessName })}
            disabled={save.isPending}
            className="w-full py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-60"
            style={{ background: 'var(--accent-gradient)' }}
          >
            {save.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Theme toggle */}
        <div
          className="p-4 rounded-2xl flex items-center justify-between"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Theme</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Currently: {theme === 'dark' ? 'Dark' : 'Light'}
            </p>
          </div>
          <button
            onClick={toggle}
            className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'var(--chip-bg)', color: 'var(--chip-text)' }}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        {/* Currency (display only) */}
        <div
          className="p-4 rounded-2xl flex items-center justify-between"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Currency</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Indian Rupee (₹)</p>
          </div>
          <span className="text-2xl font-bold" style={{ color: 'var(--text-secondary)' }}>₹</span>
        </div>
      </div>
    </div>
  )
}
