import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Page } from '../types'

interface PageTreeItemProps {
  page: Page
  spaceId: string
  depth?: number
}

function PageTreeItem({ page, spaceId, depth = 0 }: PageTreeItemProps) {
  const { pageId } = useParams()
  const [expanded, setExpanded] = useState(true)
  const hasChildren = page.children && page.children.length > 0

  return (
    <div className="page-tree-item">
      <Link
        to={`/spaces/${spaceId}/pages/${page.id}`}
        className={`page-tree-row ${pageId === page.id ? 'active' : ''}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {hasChildren ? (
          <button
            className={`page-tree-toggle ${expanded ? 'expanded' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setExpanded((v) => !v)
            }}
          >
            ▶
          </button>
        ) : (
          <span style={{ width: 16, flexShrink: 0 }} />
        )}
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {page.title}
        </span>
      </Link>

      {hasChildren && expanded && (
        <div className="page-tree-children">
          {page.children!.map((child) => (
            <PageTreeItem key={child.id} page={child} spaceId={spaceId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

interface PageTreeProps {
  pages: Page[]
  spaceId: string
}

export function PageTree({ pages, spaceId }: PageTreeProps) {
  if (pages.length === 0) {
    return (
      <div style={{ padding: '8px', color: 'var(--sidebar-muted)', fontSize: 12 }}>
        No pages yet
      </div>
    )
  }

  return (
    <div className="page-tree">
      {pages.map((page) => (
        <PageTreeItem key={page.id} page={page} spaceId={spaceId} />
      ))}
    </div>
  )
}
