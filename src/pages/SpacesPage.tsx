import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Space, User } from '../types'
import { api } from '../lib/api'
import { Sidebar } from '../components/Sidebar'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'

const COLORS = ['#2d6a4f', '#bc5a3c', '#c07a0a', '#5b6abf', '#8b5cf6', '#0891b2', '#be185d']
const EMOJIS = ['📄', '⚙️', '🚀', '📚', '🎯', '💡', '🔧', '📊', '🌍', '🏗️', '🎨', '🔐']

interface SpacesPageProps {
  user: User
  onLogout: () => void
}

export function SpacesPage({ user, onLogout }: SpacesPageProps) {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', emoji: '📄', color: '#2d6a4f' })
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const fetchSpaces = async () => {
    try {
      const data = await api.get<{ spaces: Space[] }>('/spaces')
      setSpaces(data.spaces)
    } catch {
      showToast('Failed to load spaces', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSpaces()
  }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const data = await api.post<{ space: Space }>('/spaces', form)
      setSpaces((prev) => [...prev, data.space])
      setShowCreate(false)
      setForm({ name: '', description: '', emoji: '📄', color: '#2d6a4f' })
      showToast('Space created!', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create space', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} spaces={spaces} onLogout={onLogout} />

      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Spaces</h1>
            <p className="page-subtitle">Your team's knowledge, organized by topic</p>
          </div>
          {user.role === 'ADMIN' && (
            <button className="btn btn-ink" onClick={() => setShowCreate(true)}>
              + New Space
            </button>
          )}
        </div>

        <div className="page-body">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <div className="spinner" />
            </div>
          ) : spaces.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <div className="empty-state-title">No spaces yet</div>
              <div className="empty-state-desc">Create your first space to start organizing documentation</div>
              {user.role === 'ADMIN' && (
                <button className="btn btn-ink" onClick={() => setShowCreate(true)}>
                  Create First Space
                </button>
              )}
            </div>
          ) : (
            <div className="spaces-grid">
              {spaces.map((space) => (
                <Link
                  key={space.id}
                  to={`/spaces/${space.id}`}
                  className="card card-hover space-card"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="space-card-header">
                    <div
                      className="space-icon space-icon-lg"
                      style={{ background: `${space.color}18` }}
                    >
                      {space.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="space-card-name">{space.name}</div>
                    </div>
                  </div>
                  {space.description && (
                    <div className="space-card-desc">{space.description}</div>
                  )}
                  <div className="space-card-footer">
                    <span>📄</span>
                    <span>{space._count?.pages ?? 0} pages</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Space"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-input"
              placeholder="e.g., Engineering"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea
              className="form-textarea"
              placeholder="What is this space for?"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setForm((f) => ({ ...f, emoji }))}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: `2px solid ${form.emoji === emoji ? 'var(--ink)' : 'var(--border)'}`,
                    background: form.emoji === emoji ? 'rgba(28,26,22,0.06)' : 'transparent',
                    fontSize: 18,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-swatches">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={`color-swatch ${form.color === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{ padding: '12px 16px', background: 'var(--bg)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="space-icon space-icon-lg" style={{ background: `${form.color}18` }}>
              {form.emoji}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 16 }}>
                {form.name || 'Space Name'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {form.description || 'Description'}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>
            Cancel
          </button>
          <button className="btn btn-ink" onClick={handleCreate} disabled={saving || !form.name.trim()}>
            {saving ? 'Creating...' : 'Create Space'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
