import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { api } from './lib/api'
import { Space } from './types'
import { LoginPage } from './pages/LoginPage'
import { SpacesPage } from './pages/SpacesPage'
import { SpacePage } from './pages/SpacePage'
import { PageEditorPage } from './pages/PageEditorPage'
import { PageViewPage } from './pages/PageViewPage'
import { UsersAdminPage } from './pages/admin/UsersAdminPage'
import { SpacesAdminPage } from './pages/admin/SpacesAdminPage'
import { ActivityAdminPage } from './pages/admin/ActivityAdminPage'

function RequireAuth({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-wordmark">BaseDocs</div>
        <div className="spinner" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/spaces" replace />

  return <>{children}</>
}

export function App() {
  const { user, loading, login, logout } = useAuth()
  const [spaces, setSpaces] = useState<Space[]>([])

  useEffect(() => {
    if (user) {
      api.get<{ spaces: Space[] }>('/spaces').then((data) => setSpaces(data.spaces)).catch(() => {})
    }
  }, [user])

  const handleLogout = async () => {
    await logout()
    setSpaces([])
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-wordmark">BaseDocs</div>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? <Navigate to="/spaces" replace /> : <LoginPage onLogin={login} />
        }
      />

      <Route
        path="/spaces"
        element={
          <RequireAuth>
            {user && (
              <SpacesPage user={user} onLogout={handleLogout} />
            )}
          </RequireAuth>
        }
      />

      <Route
        path="/spaces/:spaceId"
        element={
          <RequireAuth>
            {user && (
              <SpacePage user={user} spaces={spaces} onLogout={handleLogout} />
            )}
          </RequireAuth>
        }
      />

      <Route
        path="/spaces/:spaceId/pages/:pageId"
        element={
          <RequireAuth>
            {user && (
              <PageViewPage user={user} spaces={spaces} onLogout={handleLogout} />
            )}
          </RequireAuth>
        }
      />

      <Route
        path="/spaces/:spaceId/pages/:pageId/edit"
        element={
          <RequireAuth>
            {user && (
              <PageEditorPage user={user} spaces={spaces} onLogout={handleLogout} />
            )}
          </RequireAuth>
        }
      />

      <Route
        path="/admin/users"
        element={
          <RequireAuth role="ADMIN">
            {user && (
              <UsersAdminPage user={user} spaces={spaces} onLogout={handleLogout} />
            )}
          </RequireAuth>
        }
      />

      <Route
        path="/admin/spaces"
        element={
          <RequireAuth role="ADMIN">
            {user && (
              <SpacesAdminPage
                user={user}
                spaces={spaces}
                onSpacesChange={setSpaces}
                onLogout={handleLogout}
              />
            )}
          </RequireAuth>
        }
      />

      <Route
        path="/admin/activity"
        element={
          <RequireAuth role="ADMIN">
            {user && (
              <ActivityAdminPage user={user} spaces={spaces} onLogout={handleLogout} />
            )}
          </RequireAuth>
        }
      />

      <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
      <Route path="/" element={<Navigate to="/spaces" replace />} />
      <Route path="*" element={<Navigate to="/spaces" replace />} />
    </Routes>
  )
}
