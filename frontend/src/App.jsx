import { Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'

// Pages (will be created in Tasks 11-15)
const Placeholder = ({ name }) => (
  <div style={{ padding: 20, paddingTop: 60, color: 'var(--text-primary)' }}>
    <h1 style={{ fontSize: 24, fontWeight: 700 }}>{name}</h1>
    <p style={{ color: 'var(--text-secondary)' }}>Coming soon...</p>
  </div>
)

export default function App() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ maxWidth: 480, margin: '0 auto', background: 'var(--bg-primary)' }}
    >
      <div className="flex-1 pb-16">
        <Routes>
          <Route path="/"                        element={<Placeholder name="Home" />} />
          <Route path="/book/:bookId"             element={<Placeholder name="Ledger" />} />
          <Route path="/reports"                  element={<Placeholder name="Reports" />} />
          <Route path="/more"                     element={<Placeholder name="More" />} />
          <Route path="/more/parties/:bookId"     element={<Placeholder name="Parties" />} />
          <Route path="/more/categories"          element={<Placeholder name="Categories" />} />
          <Route path="/more/settings"            element={<Placeholder name="Settings" />} />
          <Route path="/more/backup"              element={<Placeholder name="Backup" />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}
