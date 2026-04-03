import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function BackupPage() {
  const navigate = useNavigate()

  const exportData = async () => {
    try {
      const data = await api.get('/backup/export')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `cashbook-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      toast.success('Backup exported')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const importData = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        await api.post('/backup/import', data)
        toast.success('Data restored! Refreshing...')
        setTimeout(() => window.location.reload(), 1200)
      } catch {
        toast.error('Invalid backup file')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="px-4 pt-10" style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-2xl" style={{ color: 'var(--text-primary)' }}>←</button>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Backup & Restore</h1>
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">📤</span>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Export Backup</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Download all data as JSON
              </p>
            </div>
          </div>
          <button
            onClick={exportData}
            className="w-full py-2.5 rounded-xl font-bold text-white text-sm"
            style={{ background: 'var(--accent-gradient)' }}
          >
            Export
          </button>
        </div>

        <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">📥</span>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Restore Backup</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Import from JSON file — replaces all existing data
              </p>
            </div>
          </div>
          <label
            className="block w-full py-2.5 rounded-xl font-bold text-white text-sm text-center cursor-pointer"
            style={{ background: '#dc2626' }}
          >
            Choose File
            <input type="file" accept=".json" onChange={importData} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  )
}
