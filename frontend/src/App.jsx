import { Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import LedgerPage from './pages/LedgerPage'
import ReportsPage from './pages/ReportsPage'
import MorePage from './pages/MorePage'
import PartiesPage from './pages/PartiesPage'
import CategoriesPage from './pages/CategoriesPage'
import SettingsPage from './pages/SettingsPage'
import BackupPage from './pages/BackupPage'

export default function App() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ maxWidth: 480, margin: '0 auto', background: 'var(--bg-primary)' }}
    >
      <div className="flex-1 pb-16">
        <Routes>
          <Route path="/"                    element={<HomePage />} />
          <Route path="/book/:bookId"         element={<LedgerPage />} />
          <Route path="/reports"              element={<ReportsPage />} />
          <Route path="/more"                 element={<MorePage />} />
          <Route path="/more/parties/:bookId" element={<PartiesPage />} />
          <Route path="/more/categories"      element={<CategoriesPage />} />
          <Route path="/more/settings"        element={<SettingsPage />} />
          <Route path="/more/backup"          element={<BackupPage />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}
