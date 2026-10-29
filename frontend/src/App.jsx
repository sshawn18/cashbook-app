import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import BottomNav from './components/BottomNav'
import { SkeletonCard } from './components/Skeleton'
import { useBooks } from './hooks/useBooks'
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

// Personal use: open straight into the last-used book; fall back to the books list for first-run setup
function HomeRedirect() {
  const { data: books = [], isLoading } = useBooks()
  if (isLoading) return <div className="p-5 space-y-3 pt-12"><SkeletonCard height={64} /><SkeletonCard height={44} /><SkeletonCard height={44} /></div>
  if (books.length === 0) return <HomePage />
  let last = null
  try { last = localStorage.getItem('cb_last_book') } catch { /* ignore */ }
  const target = books.find(b => String(b.id) === last) || [...books].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))[0]
  return <Navigate to={`/book/${target.id}`} replace />
}

export default function App() {
  const { isLoggedIn } = useAuth()

  return (
    <SettingsProvider>
      <div
        className="min-h-screen flex flex-col"
        style={{ maxWidth: 480, margin: '0 auto', background: 'var(--bg-primary)' }}
      >
        <div className="flex-1 pb-16">
          <Routes>
            <Route path="/login"  element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/"                    element={<ProtectedRoute><HomeRedirect /></ProtectedRoute>} />
            <Route path="/books"               element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
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
    </SettingsProvider>
  )
}
