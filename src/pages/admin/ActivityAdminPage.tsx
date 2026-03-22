import { useState, useEffect } from 'react'
import { User, Space, Activity } from '../../types'
import { api } from '../../lib/api'
import { AdminLayout } from './AdminLayout'
import { useToast } from '../../components/Toast'

interface ActivityAdminPageProps {
  user: User
  spaces: Space[]
  onLogout: () => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function ActivityAdminPage({ user, spaces, onLogout }: ActivityAdminPageProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const data = await api.get<{ activities: Activity[] }>('/admin/activity')
        setActivities(data.activities)
      } catch {
        showToast('Failed to load activity', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [])

  return (
    <AdminLayout user={user} spaces={spaces} onLogout={onLogout}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Log</h1>
          <p className="page-subtitle">Recent edits, logins, and deletions</p>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : activities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No activity yet</div>
            <div className="empty-state-desc">Actions will appear here as users create and edit pages</div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1.5px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
                {activities.length} recent activities
              </span>
            </div>
            <div>
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '14px 20px',
                    borderBottom: index < activities.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(28,26,22,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {activity.user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14 }}>
                      <strong>{activity.user.name}</strong>{' '}
                      <span style={{ color: 'var(--muted)' }}>{activity.action}</span>
                    </div>
                    {activity.page && (
                      <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 2 }}>
                        {activity.page.title}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0, marginTop: 2 }}>
                    {timeAgo(activity.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
