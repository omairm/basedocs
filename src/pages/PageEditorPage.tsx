import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Page, Space, User } from '../types'
import { api } from '../lib/api'
import { Sidebar } from '../components/Sidebar'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'

interface PageEditorPageProps {
  user: User
  spaces: Space[]
  onLogout: () => void
}

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  return (
    <div className="editor-toolbar">
      <button
        className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <em>I</em>
      </button>
      <button
        className={`toolbar-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <s>S</s>
      </button>
      <button
        className={`toolbar-btn ${editor.isActive('code') ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Inline code"
      >
        {'<>'}
      </button>

      <div className="toolbar-divider" />

      <button
        className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
      >
        H1
      </button>
      <button
        className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        H2
      </button>
      <button
        className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
      >
        H3
      </button>

      <div className="toolbar-divider" />

      <button
        className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list"
      >
        • List
      </button>
      <button
        className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Ordered list"
      >
        1. List
      </button>

      <div className="toolbar-divider" />

      <button
        className={`toolbar-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Quote"
      >
        ❝
      </button>
      <button
        className={`toolbar-btn ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Code block"
      >
        {'{ }'}
      </button>

      <div className="toolbar-divider" />

      <button
        className="toolbar-btn"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        ↩
      </button>
      <button
        className="toolbar-btn"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        ↪
      </button>
    </div>
  )
}

function flattenPages(pages: Page[]): Page[] {
  const result: Page[] = []
  const walk = (arr: Page[]) => {
    for (const p of arr) {
      result.push(p)
      if (p.children?.length) walk(p.children)
    }
  }
  walk(pages)
  return result
}

export function PageEditorPage({ user, spaces, onLogout }: PageEditorPageProps) {
  const { spaceId, pageId } = useParams<{ spaceId: string; pageId: string }>()
  const [page, setPage] = useState<Page | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [allSpacePages, setAllSpacePages] = useState<Page[]>([])
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(true)
  const [title, setTitle] = useState('')
  const [parentId, setParentId] = useState<string | null>(null)
  const [changingParent, setChangingParent] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showNewPage, setShowNewPage] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState('')
  const { showToast } = useToast()
  const navigate = useNavigate()
  const saveTimeoutRef = useRef<number | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    onUpdate: () => {
      setSaved(false)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = window.setTimeout(() => {
        handleSave()
      }, 1500)
    },
  })

  const handleSave = useCallback(async () => {
    if (!pageId || !editor) return
    setSaving(true)
    try {
      await api.patch(`/pages/${pageId}`, {
        content: editor.getJSON(),
      })
      setSaved(true)
    } catch {
      // Silent fail for autosave
    } finally {
      setSaving(false)
    }
  }, [pageId, editor])

  const handleTitleSave = useCallback(async (newTitle: string) => {
    if (!pageId || !newTitle.trim()) return
    try {
      await api.patch(`/pages/${pageId}`, { title: newTitle })
      setSaved(true)
    } catch (err) {
      showToast('Failed to update title', 'error')
    }
  }, [pageId, showToast])

  useEffect(() => {
    if (!spaceId || !pageId) return

    const load = async () => {
      try {
        const [pageData, spaceData] = await Promise.all([
          api.get<{ page: Page }>(`/pages/${pageId}`),
          api.get<{ space: Space & { pages: Page[] } }>(`/spaces/${spaceId}`),
        ])

        setPage(pageData.page)
        setTitle(pageData.page.title)
        setParentId(pageData.page.parentId ?? null)
        setCurrentSpace(spaceData.space)
        const allFlat = flattenPages(spaceData.space.pages)
        setAllSpacePages(allFlat)
        setPages(spaceData.space.pages.filter((p: Page) => !p.parentId))

        if (editor && pageData.page.content) {
          editor.commands.setContent(pageData.page.content as object)
        }
      } catch {
        showToast('Failed to load page', 'error')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [spaceId, pageId, editor])

  // When editor is ready and page is loaded, set content
  useEffect(() => {
    if (editor && page?.content && !loading) {
      editor.commands.setContent(page.content as object)
    }
  }, [editor, page, loading])

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

  // Collect all descendant IDs of the current page (can't be its own parent)
  const getDescendantIds = (p: Page): Set<string> => {
    const ids = new Set<string>()
    const walk = (node: Page) => {
      ids.add(node.id)
      node.children?.forEach(walk)
    }
    walk(p)
    return ids
  }

  const handleParentChange = async (newParentId: string | null) => {
    if (!pageId) return
    setChangingParent(true)
    try {
      await api.patch(`/pages/${pageId}`, { parentId: newParentId })
      setParentId(newParentId)
      showToast('Page hierarchy updated', 'success')
      // Refresh pages list in sidebar
      const spaceData = await api.get<{ space: Space & { pages: Page[] } }>(`/spaces/${spaceId}`)
      const allFlat = flattenPages(spaceData.space.pages)
      setAllSpacePages(allFlat)
      setPages(spaceData.space.pages.filter((p: Page) => !p.parentId))
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update hierarchy', 'error')
    } finally {
      setChangingParent(false)
    }
  }

  const canEdit = user.role === 'ADMIN' || page?.authorId === user.id

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
        pages={pages}
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
          <span style={{ color: 'var(--ink)' }}>{page?.title}</span>
        </div>

        {/* Page toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 40px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              {saving ? 'Saving…' : saved ? 'Saved' : 'Unsaved changes'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link
              to={`/spaces/${spaceId}/pages/${pageId}`}
              className="btn btn-ghost btn-sm"
            >
              ← View Page
            </Link>
            {canEdit && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleSave()}
                disabled={saving || saved}
              >
                Save
              </button>
            )}
            {(user.role === 'ADMIN' || page?.authorId === user.id) && (
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Editor area */}
        <div className="editor-wrapper">
          {/* Page title */}
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 40px 0' }}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={(e) => handleTitleSave(e.target.value)}
              style={{
                width: '100%',
                fontFamily: 'var(--font-serif)',
                fontSize: '2.4em',
                fontWeight: 700,
                color: 'var(--ink)',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                lineHeight: 1.2,
                marginBottom: 8,
              }}
              placeholder="Untitled"
              disabled={!canEdit}
            />
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, display: 'flex', gap: 12 }}>
              {page?.author && <span>by {page.author.name}</span>}
              {page?.updatedAt && (
                <span>Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
              )}
            </div>
            {/* Parent page selector */}
            {canEdit && allSpacePages.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Parent page:</span>
                <select
                  value={parentId ?? ''}
                  onChange={(e) => handleParentChange(e.target.value || null)}
                  disabled={changingParent}
                  style={{
                    fontSize: 12,
                    color: 'var(--ink)',
                    background: 'var(--surface)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 8,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    outline: 'none',
                    opacity: changingParent ? 0.6 : 1,
                  }}
                >
                  <option value="">None (top-level)</option>
                  {allSpacePages
                    .filter((p) => {
                      if (!page) return true
                      const descendants = getDescendantIds(page)
                      return !descendants.has(p.id)
                    })
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.parentId ? `  ↳ ${p.title}` : p.title}
                      </option>
                    ))}
                </select>
                {changingParent && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Updating…</span>}
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '1.5px solid var(--border)', marginBottom: 0, marginTop: 12 }} />
          </div>

          {canEdit && <EditorToolbar editor={editor} />}
          <EditorContent editor={editor} />
        </div>
      </main>

      {/* Delete confirmation */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Page">
        <p style={{ color: 'var(--muted)', marginBottom: 8 }}>
          Are you sure you want to delete <strong style={{ color: 'var(--ink)' }}>{page?.title}</strong>?
          This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setShowDelete(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete Page
          </button>
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
          <button className="btn btn-ghost" onClick={() => setShowNewPage(false)}>
            Cancel
          </button>
          <button
            className="btn btn-ink"
            onClick={handleCreatePage}
            disabled={!newPageTitle.trim()}
          >
            Create Page
          </button>
        </div>
      </Modal>
    </div>
  )
}
