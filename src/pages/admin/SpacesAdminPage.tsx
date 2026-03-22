import { useState, useEffect } from 'react'
import { User, Space } from '../../types'
import { api } from '../../lib/api'
import { AdminLayout } from './AdminLayout'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/Toast'

interface SpacesAdminPageProps {
  user: User
  spaces: Space[]
  onSpacesChange: (spaces: Space[]) => void
  onLogout: () => void
}

const COLORS = ['#2d6a4f', '#bc5a3c', '#c07a0a', '#5b6abf', '#8b5cf6', '#0891b2', '#be185d']
const EMOJIS = ['📄', '⚙️', '🚀', '📚', '🎯', '💡', '🔧', '📊', '🌍', '🏗️', '🎨', '🔐']

export function SpacesAdminPage({ user, spaces, onSpacesChange, onLogout }: SpacesAdminPageProps) {
  const [allSpaces, setAllSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editSpace, setEditSpace] = useState<Space | null>(null)
  const [showArchive, setShowArchive] = useState<Space | null>(null)
  const [showDelete, setShowDelete] = useState<Space | null>(null)
  const [form, setForm] = useState({ name: '', description: '', emoji: '📄', color: '#2d6a4f' })
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const fetchSpaces = async () => {
    try {
      const data = await api.get<{ spaces: Space[] }>('/spaces')
      setAllSpaces(data.spaces)
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
      const updated = [...allSpaces, data.space]
      setAllSpaces(updated)
      onSpacesChange(updated.filter((s) => !s.archived))
      setShowCreate(false)
      setForm({ name: '', description: '', emoji: '📄', color: '#2d6a4f' })
      showToast('Space created!', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!editSpace) return
    setSaving(true)
    try {
      const data = await api.patch<{ space: Space }>(`/spaces/${editSpace.id}`, {
        name: editSpace.name,
        description: editSpace.description,
        emoji: editSpace.emoji,
        color: editSpace.color,
      })
      const updated = allSpaces.map((s) => (s.id === data.space.id ? data.space : s))
      setAllSpaces(updated)
      onSpacesChange(updated.filter((s) => !s.archived))
      setEditSpace(null)
      showToast('Space updated!', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (space: Space) => {
    try {
      const data = await api.patch<{ space: Space }>(`/spaces/${space.id}`, { archived: !space.archived })
      const updated = allSpaces.map((s) => (s.id === data.space.id ? data.space : s))
      setAllSpaces(updated)
      onSpacesChange(updated.filter((s) => !s.archived))
      setShowArchive(null)
      showToast(`Space ${data.space.archived ? 'archived' : 'unarchived'}!`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to archive', 'error')
    }
  }

  const handleDelete = async (space: Space) => {
    try {
      await api.delete(`/spaces/${space.id}`)
      const updated = allSpaces.filter((s) => s.id !== space.id)
      setAllSpaces(updated)
      onSpacesChange(updated.filter((s) => !s.archived))
      setShowDelete(null)
      showToast('Space deleted', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete', 'error')
    }
  }

  return (
    <AdminLayout user={user} spaces={spaces} onLogout={onLogout}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Spaces</h1>
          <p className="page-subtitle">{allSpaces.length} spaces total</p>
        </div>
        <button className="btn btn-ink" onClick={() => setShowCreate(true)}>
          + New Space
        </button>
      </div>

      <div className="page-body">
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Space</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                      Loading…
                    </td>
                  </tr>
                ) : (
                  allSpaces.map((space) => (
                    <tr key={space.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            className="space-icon"
                            style={{ background: `${space.color}18` }}
                          >
                            {space.emoji}
                          </div>
                          <span style={{ fontWeight: 500 }}>{space.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: 13 }}>
                        {space.description || '—'}
                      </td>
                      <td>
                        <span className={`badge ${space.archived ? 'badge-gray' : 'badge-green'}`}>
                          {space.archived ? 'archived' : 'active'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: 13 }}>
                        {new Date(space.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditSpace({ ...space })}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setShowArchive(space)}
                          >
                            {space.archived ? 'Unarchive' : 'Archive'}
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setShowDelete(space)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Space">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            <label className="form-label">Description</label>
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
                    width: 36, height: 36, borderRadius: 8, fontSize: 18, cursor: 'pointer',
                    border: `2px solid ${form.emoji === emoji ? 'var(--ink)' : 'var(--border)'}`,
                    background: form.emoji === emoji ? 'rgba(28,26,22,0.06)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
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
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
          <button className="btn btn-ink" onClick={handleCreate} disabled={saving || !form.name.trim()}>
            {saving ? 'Creating…' : 'Create Space'}
          </button>
        </div>
      </Modal>

      {/* Edit modal */}
      {editSpace && (
        <Modal isOpen={!!editSpace} onClose={() => setEditSpace(null)} title="Edit Space">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                className="form-input"
                value={editSpace.name}
                onChange={(e) => setEditSpace((s) => s ? { ...s, name: e.target.value } : s)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                value={editSpace.description || ''}
                onChange={(e) => setEditSpace((s) => s ? { ...s, description: e.target.value } : s)}
                rows={2}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Icon</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setEditSpace((s) => s ? { ...s, emoji } : s)}
                    style={{
                      width: 36, height: 36, borderRadius: 8, fontSize: 18, cursor: 'pointer',
                      border: `2px solid ${editSpace.emoji === emoji ? 'var(--ink)' : 'var(--border)'}`,
                      background: editSpace.emoji === emoji ? 'rgba(28,26,22,0.06)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                    className={`color-swatch ${editSpace.color === color ? 'selected' : ''}`}
                    style={{ background: color }}
                    onClick={() => setEditSpace((s) => s ? { ...s, color } : s)}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setEditSpace(null)}>Cancel</button>
            <button className="btn btn-ink" onClick={handleEdit} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {/* Archive confirm */}
      {showArchive && (
        <Modal isOpen={!!showArchive} onClose={() => setShowArchive(null)} title={showArchive.archived ? 'Unarchive Space' : 'Archive Space'}>
          <p style={{ color: 'var(--muted)' }}>
            {showArchive.archived
              ? `Unarchive "${showArchive.name}"? It will be visible again.`
              : `Archive "${showArchive.name}"? It will be hidden from the main view.`}
          </p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShowArchive(null)}>Cancel</button>
            <button className="btn btn-ink" onClick={() => handleArchive(showArchive)}>
              {showArchive.archived ? 'Unarchive' : 'Archive'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {showDelete && (
        <Modal isOpen={!!showDelete} onClose={() => setShowDelete(null)} title="Delete Space">
          <p style={{ color: 'var(--muted)' }}>
            Permanently delete <strong style={{ color: 'var(--ink)' }}>{showDelete.name}</strong>?
            All pages in this space will also be deleted. This cannot be undone.
          </p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShowDelete(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => handleDelete(showDelete)}>Delete Space</button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}
