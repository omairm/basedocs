import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { User, Space } from '../../types'
import { Sidebar } from '../../components/Sidebar'

interface AdminLayoutProps {
  children: ReactNode
  user: User
  spaces: Space[]
  onLogout: () => void
}

const adminNav = [
  { path: '/admin/users', label: 'Users', icon: '👤' },
  { path: '/admin/spaces', label: 'Spaces', icon: '📦' },
  { path: '/admin/activity', label: 'Activity', icon: '📋' },
]

export function AdminLayout({ children, user, spaces, onLogout }: AdminLayoutProps) {
  const location = useLocation()

  return (
    <div className="app-layout">
      <Sidebar user={user} spaces={spaces} onLogout={onLogout} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Admin sidebar */}
        <div className="admin-sidebar">
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 20,
              paddingLeft: 10,
            }}
          >
            Admin Console
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {adminNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div style={{ marginTop: 'auto' }}>
            <Link
              to="/spaces"
              className="admin-nav-item"
              style={{ fontSize: 13 }}
            >
              <span>←</span>
              <span>Back to Spaces</span>
            </Link>
          </div>
        </div>

        {/* Admin content */}
        <main className="admin-content">{children}</main>
      </div>
    </div>
  )
}
