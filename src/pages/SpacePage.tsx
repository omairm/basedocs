import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Space, Page, User } from '../types'
import { api } from '../lib/api'
import { Sidebar } from '../components/Sidebar'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'

interface SpacePageProps {
  user: User
  spaces: Space[]
  onLogout: () => void
}

export function SpacePage({ user, spaces, onLogout }: SpacePageProps) {
  const { spaceId } = useParams<{ spaceId: string }>()
  const [space, setSpace] = useState<Space | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewPage, setShowNewPage] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()
  const navigate = useNavigate()

  const fetchSpace = async () => {
    if (!spaceId) return
    try {
      const data = await api.get<{ space: Space & { pages: Page[] } }>(`/spaces/${spaceId}`)
      setSpace(data.space)
      // Only top-level pages
      const topLevel = data.space.pages.filter((p: Page) => !p.parentId)
      setPages(topLevel)
    } catch {
      showToast('Failed to load space', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSpace()
  }, [spaceId])

  const handleCreatePage = async () => {
    if (!newPageTitle.trim() || !spaceId) return
    setSaving(true)
    try {
      const data = await api.post<{ page: Page }>(`/spaces/${spaceId}/pages`, {
        title: newPageTitle.trim(),
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
      })
      setShowNewPage(false)
      setNewPageTitle('')
      showToast('Page created!', 'success')
      navigate(`/spaces/${spaceId}/pages/${data.page.id}/edit`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create page', 'error')
    } finally {
      setSaving(false)
    }
  }

  const allPages = (pgs: Page[]): Page[] => {
    const result: Page[] = []
    const walk = (arr: Page[]) => {
      for (const p of arr) {
        result.push(p)
        if (p.children?.length) walk(p.children)
      }
    }
    walk(pgs)
    return result
  }

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar user={user} spaces={spaces} onLogout={onLogout} />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </main>
      </div>
    )
  }

  if (!space) {
    return (
      <div className="app-layout">
        <Sidebar user={user} spaces={spaces} onLogout={onLogout} />
        <main className="main-content">
          <div className="empty-state">
            <div className="empty-state-icon">❌</div>
            <div className="empty-state-title">Space not found</div>
            <Link to="/spaces" className="btn btn-ink" style={{ display: 'inline-flex' }}>
              Back to Spaces
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        spaces={spaces}
        pages={pages}
        currentSpace={space}
        onLogout={onLogout}
        onNewPage={() => setShowNewPage(true)}
      />

      <main className="main-content">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              className="space-icon space-icon-lg"
              style={{ background: `${space.color}18` }}
            >
              {space.emoji}
            </div>
            <div>
              <h1 className="page-title">{space.name}</h1>
              {space.description && (
                <p className="page-subtitle">{space.description}</p>
              )}
            </div>
          </div>
          <button className="btn btn-ink" onClick={() => setShowNewPage(true)}>
            + New Page
          </button>
        </div>

        <div className="page-body">
          {allPages(pages).length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <div className="empty-state-title">No pages yet</div>
              <div className="empty-state-desc">Create your first page in this space</div>
              <button className="btn btn-ink" onClick={() => setShowNewPage(true)}>
                Create First Page
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {allPages(pages).map((page) => (
                <Link
                  key={page.id}
                  to={`/spaces/${spaceId}/pages/${page.id}`}
                  className="card card-hover"
                  style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                >
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                    {page.title}
                  </div>
                  {page.parentId && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                      Child page
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span>{page.author?.name || 'Unknown'}</span>
                    <span>·</span>
                    <span>{new Date(page.updatedAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Modal isOpen={showNewPage} onClose={() => setShowNewPage(false)} title="New Page">
        <div className="form-group">
          <label className="form-label">Page Title</label>
          <input
            className="form-input"
            placeholder="e.g., Getting Started"
            value={newPageTitle}
            onChange={(e) => setNewPageTitle(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setShowNewPage(false)}>
            Cancel
          </button>
          <button
            className="btn btn-ink"
            onClick={handleCreatePage}
            disabled={saving || !newPageTitle.trim()}
          >
            {saving ? 'Creating...' : 'Create Page'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
