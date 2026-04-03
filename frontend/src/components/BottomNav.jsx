import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/',        icon: '🏠', label: 'Home' },
  { to: '/reports', icon: '📈', label: 'Reports' },
  { to: '/more',    icon: '☰',  label: 'More' },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 border-t"
      style={{
        background: 'var(--nav-bg)',
        borderColor: 'var(--border)',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className="flex flex-col items-center gap-1 px-4 py-1 text-xs font-medium transition-colors"
          style={({ isActive }) => ({
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
          })}
        >
          <span className="text-xl">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
