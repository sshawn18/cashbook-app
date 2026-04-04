import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import LedgerPage from './pages/LedgerPage'
import ReportsPage from './pages/ReportsPage'
import MorePage from './pages/MorePage'
import PartiesPage from './pages/PartiesPage'
import CategoriesPage from './pages/CategoriesPage'
import SettingsPage from './pages/SettingsPage'
import BackupPage from './pages/BackupPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { isLoggedIn } = useAuth()

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ maxWidth: 480, margin: '0 auto', background: 'var(--bg-primary)' }}
    >
      <div className="flex-1 pb-16">
        <Routes>
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/"                    element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/book/:bookId"         element={<ProtectedRoute><LedgerPage /></ProtectedRoute>} />
          <Route path="/reports"              element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/more"                 element={<ProtectedRoute><MorePage /></ProtectedRoute>} />
          <Route path="/more/parties/:bookId" element={<ProtectedRoute><PartiesPage /></ProtectedRoute>} />
          <Route path="/more/categories"      element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
          <Route path="/more/settings"        element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/more/backup"          element={<ProtectedRoute><BackupPage /></ProtectedRoute>} />
        </Routes>
      </div>
      {isLoggedIn && <BottomNav />}
    </div>
  )
}
