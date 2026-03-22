import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Page, Space, User } from '../types'
import { api } from '../lib/api'
import { Sidebar } from '../components/Sidebar'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'

interface PageViewPageProps {
  user: User
  spaces: Space[]
  onLogout: () => void
}

export function PageViewPage({ user, spaces, onLogout }: PageViewPageProps) {
  const { spaceId, pageId } = useParams<{ spaceId: string; pageId: string }>()
  const [page, setPage] = useState<Page | null>(null)
  const [sidebarPages, setSidebarPages] = useState<Page[]>([])
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewPage, setShowNewPage] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const { showToast } = useToast()
  const navigate = useNavigate()

  const editor = useEditor({
    extensions: [StarterKit],
    editable: false,
    content: { type: 'doc', content: [] },
  })

  useEffect(() => {
    if (!spaceId || !pageId) return

    const load = async () => {
      try {
        const [pageData, spaceData] = await Promise.all([
          api.get<{ page: Page }>(`/pages/${pageId}`),
          api.get<{ space: Space & { pages: Page[] } }>(`/spaces/${spaceId}`),
        ])

        setPage(pageData.page)
        setCurrentSpace(spaceData.space)
        setSidebarPages(spaceData.space.pages.filter((p: Page) => !p.parentId))
      } catch {
        showToast('Failed to load page', 'error')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [spaceId, pageId])

  useEffect(() => {
    if (editor && page?.content && !loading) {
      editor.commands.setContent(page.content as object)
    }
  }, [editor, page, loading])

  const canEdit = user.role === 'ADMIN' || page?.authorId === user.id

  const handleDelete = async () => {
    if (!pageId) return
    try {
      await api.delete(`/pages/${pageId}`)
      showToast('Page deleted', 'success')
      navigate(`/spaces/${spaceId}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete', 'error')
    }
  }

  const handleCreatePage = async () => {
    if (!newPageTitle.trim() || !spaceId) return
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
    }
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

  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        spaces={spaces}
        pages={sidebarPages}
        currentSpace={currentSpace}
        onLogout={onLogout}
        onNewPage={() => setShowNewPage(true)}
      />

      <main className="main-content">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/spaces">Spaces</Link>
          <span className="breadcrumb-sep">/</span>
          {currentSpace && (
            <>
              <Link to={`/spaces/${spaceId}`}>{currentSpace.name}</Link>
              <span className="breadcrumb-sep">/</span>
            </>
          )}
          {page?.parent && (
            <>
              <Link to={`/spaces/${spaceId}/pages/${page.parent.id}`}>{page.parent.title}</Link>
              <span className="breadcrumb-sep">/</span>
            </>
          )}
          <span style={{ color: 'var(--ink)' }}>{page?.title}</span>
        </div>

        {/* Page toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '12px 40px',
            borderBottom: '1px solid var(--border)',
            gap: 8,
          }}
        >
          {canEdit && (
            <Link
              to={`/spaces/${spaceId}/pages/${pageId}/edit`}
              className="btn btn-ink btn-sm"
            >
              ✏ Edit
            </Link>
          )}
          {canEdit && (
            <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>
              Delete
            </button>
          )}
        </div>

        {/* Page content */}
        <div className="editor-wrapper" style={{ pointerEvents: 'none', userSelect: 'text' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 40px 0' }}>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2.4em',
                fontWeight: 700,
                color: 'var(--ink)',
                lineHeight: 1.2,
                marginBottom: 8,
                margin: '0 0 8px',
              }}
            >
              {page?.title}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, display: 'flex', gap: 12 }}>
              {page?.author && <span>by {page.author.name}</span>}
              {page?.updatedAt && (
                <span>Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
              )}
            </div>
            <hr style={{ border: 'none', borderTop: '1.5px solid var(--border)', marginBottom: 0 }} />
          </div>

          <EditorContent editor={editor} />

          {/* Child pages */}
          {page?.children && page.children.length > 0 && (
            <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 40px 40px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.1em',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginBottom: 12,
                }}
              >
                Child Pages
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {page.children.map((child) => (
                  <Link
                    key={child.id}
                    to={`/spaces/${spaceId}/pages/${child.id}`}
                    style={{
                      pointerEvents: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      background: 'var(--surface)',
                      border: '1.5px solid var(--border)',
                      borderRadius: 10,
                      textDecoration: 'none',
                      color: 'var(--ink)',
                      fontSize: 14,
                      fontFamily: 'var(--font-serif)',
                      fontWeight: 500,
                      transition: 'box-shadow 0.15s, transform 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '3px 3px 0 var(--ink)'
                      e.currentTarget.style.transform = 'translate(-1px, -1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.transform = 'none'
                    }}
                  >
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>📄</span>
                    {child.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete confirmation */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Page">
        <p style={{ color: 'var(--muted)', marginBottom: 8 }}>
          Are you sure you want to delete <strong style={{ color: 'var(--ink)' }}>{page?.title}</strong>?
          This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setShowDelete(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete}>Delete Page</button>
        </div>
      </Modal>

      {/* New page modal */}
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
          <button className="btn btn-ghost" onClick={() => setShowNewPage(false)}>Cancel</button>
          <button className="btn btn-ink" onClick={handleCreatePage} disabled={!newPageTitle.trim()}>
            Create Page
          </button>
        </div>
      </Modal>
    </div>
  )
}
