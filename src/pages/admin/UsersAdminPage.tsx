import { useState, useEffect } from 'react'
import { User, Space } from '../../types'
import { api } from '../../lib/api'
import { AdminLayout } from './AdminLayout'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/Toast'

interface UsersAdminPageProps {
  user: User
  spaces: Space[]
  onLogout: () => void
}

export function UsersAdminPage({ user, spaces, onLogout }: UsersAdminPageProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [showDelete, setShowDelete] = useState<User | null>(null)
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'WRITER' as 'ADMIN' | 'WRITER' })
  const [editForm, setEditForm] = useState({ name: '', role: 'WRITER' as 'ADMIN' | 'WRITER' })
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const fetchUsers = async () => {
    try {
      const data = await api.get<{ users: User[] }>('/users')
      setUsers(data.users)
    } catch {
      showToast('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleInvite = async () => {
    if (!form.email || !form.name || !form.password) return
    setSaving(true)
    try {
      const data = await api.post<{ user: User }>('/users', form)
      setUsers((prev) => [...prev, data.user])
      setShowInvite(false)
      setForm({ email: '', name: '', password: '', role: 'WRITER' })
      showToast('User invited!', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to invite user', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editUser) return
    setSaving(true)
    try {
      const data = await api.patch<{ user: User }>(`/users/${editUser.id}`, editForm)
      setUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)))
      setEditUser(null)
      showToast('User updated!', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (target: User) => {
    try {
      await api.delete(`/users/${target.id}`)
      setUsers((prev) => prev.filter((u) => u.id !== target.id))
      setShowDelete(null)
      showToast('User removed', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete', 'error')
    }
  }

  return (
    <AdminLayout user={user} spaces={spaces} onLogout={onLogout}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{users.length} team members</p>
        </div>
        <button className="btn btn-ink" onClick={() => setShowInvite(true)}>
          + Invite User
        </button>
      </div>

      <div className="page-body">
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
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
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'rgba(28,26,22,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {u.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <span style={{ fontWeight: 500 }}>{u.name}</span>
                          {u.id === user.id && (
                            <span className="badge badge-green" style={{ fontSize: 11 }}>You</span>
                          )}
                        </div>
                      </td>
                      <td style={{ color: 'var(--muted)' }}>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'ADMIN' ? 'badge-amber' : 'badge-gray'}`}>
                          {u.role.toLowerCase()}
                        </span>
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: 13 }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setEditUser(u)
                              setEditForm({ name: u.name, role: u.role })
                            }}
                          >
                            Edit
                          </button>
                          {u.id !== user.id && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setShowDelete(u)}
                            >
                              Remove
                            </button>
                          )}
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

      {/* Invite modal */}
      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite User">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              placeholder="Jane Doe"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="jane@company.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className="form-select"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as 'ADMIN' | 'WRITER' }))}
            >
              <option value="WRITER">Writer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setShowInvite(false)}>
            Cancel
          </button>
          <button
            className="btn btn-ink"
            onClick={handleInvite}
            disabled={saving || !form.email || !form.name || !form.password}
          >
            {saving ? 'Inviting…' : 'Invite User'}
          </button>
        </div>
      </Modal>

      {/* Edit modal */}
      {editUser && (
        <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={editForm.role}
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as 'ADMIN' | 'WRITER' }))}
              >
                <option value="WRITER">Writer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setEditUser(null)}>
              Cancel
            </button>
            <button className="btn btn-ink" onClick={handleUpdate} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {showDelete && (
        <Modal isOpen={!!showDelete} onClose={() => setShowDelete(null)} title="Remove User">
          <p style={{ color: 'var(--muted)' }}>
            Are you sure you want to remove <strong style={{ color: 'var(--ink)' }}>{showDelete.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShowDelete(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={() => handleDelete(showDelete)}>
              Remove User
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}
