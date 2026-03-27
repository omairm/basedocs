import { useState, useEffect } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { User, Space, Page } from '../types'
import { PageTree } from './PageTree'

interface SidebarProps {
  user: User
  spaces: Space[]
  pages?: Page[]
  currentSpace?: Space | null
  onLogout: () => void
  onNewPage?: () => void
}

export function Sidebar({ user, spaces, pages, currentSpace, onLogout, onNewPage }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { spaceId } = useParams()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <>
      <div className={`mobile-header${mobileOpen ? ' mobile-header--hidden' : ''}`}>
        <Link to="/spaces" className="mobile-wordmark" style={{ textDecoration: 'none' }}>BaseDocs</Link>
        <button className="hamburger-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>
      </div>

      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
      <div className="sidebar-header">
        <Link to="/spaces" className="sidebar-wordmark" style={{ textDecoration: 'none' }}>
          BaseDocs
        </Link>
        <button className="sidebar-close-btn" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          ✕
        </button>
      </div>

      <nav className="sidebar-nav">
        {/* Spaces navigation */}
        <div className="sidebar-section-label">Spaces</div>
        {spaces.map((space) => (
          <Link
            key={space.id}
            to={`/spaces/${space.id}`}
            className={`sidebar-item ${spaceId === space.id ? 'active' : ''}`}
          >
            <span
              className="space-icon"
              style={{ background: `${space.color}20` }}
            >
              {space.emoji}
            </span>
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {space.name}
            </span>
          </Link>
        ))}

        <div style={{ marginTop: 4, marginBottom: 4 }}>
          <Link
            to="/spaces"
            className={`sidebar-item ${location.pathname === '/spaces' ? 'active' : ''}`}
            style={{ fontSize: 12, color: 'var(--sidebar-muted)' }}
          >
            <span>All Spaces</span>
          </Link>
        </div>

        {/* Current space page tree */}
        {currentSpace && pages && (
          <>
            <div
              className="sidebar-section-label"
              style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span>Pages</span>
              {onNewPage && (
                <button
                  onClick={onNewPage}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--sidebar-muted)',
                    cursor: 'pointer',
                    fontSize: 16,
                    lineHeight: 1,
                    padding: '0 4px',
                  }}
                  title="New page"
                >
                  +
                </button>
              )}
            </div>
            <PageTree pages={pages} spaceId={currentSpace.id} />
          </>
        )}

        {/* Admin link */}
        {user.role === 'ADMIN' && (
          <>
            <div className="sidebar-section-label" style={{ marginTop: 12 }}>
              Admin
            </div>
            <Link
              to="/admin/users"
              className={`sidebar-item ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
            >
              <span>⚙</span>
              <span>Admin Console</span>
            </Link>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.role.toLowerCase()}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="sidebar-item"
          style={{ width: '100%', marginTop: 4, color: 'var(--sidebar-muted)' }}
        >
          <span>↪</span>
          <span>Sign out</span>
        </button>
      </div>
      </aside>
    </>
  )
}
