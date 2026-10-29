import { NavLink, useLocation } from 'react-router-dom'
import Icon from './Icon'

const tabs = [
  { to: '/books',   icon: 'book',  label: 'Books' },
  { to: '/reports', icon: 'chart', label: 'Reports' },
  { to: '/more',    icon: 'menu',  label: 'More' },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  // The ledger has its own floating In/Out bar and header shortcuts
  if (pathname.startsWith('/book/')) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex justify-around items-center h-14"
      style={{
        background: 'var(--nav-bg)',
        borderTop: '1px solid var(--border)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        maxWidth: 480,
        margin: '0 auto',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className="press flex flex-col items-center gap-0.5 px-5 py-1 text-[10.5px]"
          style={({ isActive }) => ({ color: isActive ? 'var(--accent)' : 'var(--text-muted)' })}
        >
          <Icon name={tab.icon} size={19} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
