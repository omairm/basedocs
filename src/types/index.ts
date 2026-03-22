export type Role = 'ADMIN' | 'WRITER'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  createdAt: string
}

export interface Space {
  id: string
  name: string
  description?: string
  emoji: string
  color: string
  archived: boolean
  createdAt: string
  _count?: { pages: number }
}

export interface Page {
  id: string
  title: string
  slug: string
  content: unknown
  spaceId: string
  parentId?: string | null
  authorId: string
  createdAt: string
  updatedAt: string
  author?: { id: string; name: string; email?: string }
  space?: { id: string; name: string; emoji: string; color: string }
  parent?: { id: string; title: string; slug: string } | null
  children?: Page[]
}

export interface Activity {
  id: string
  action: string
  userId: string
  pageId?: string | null
  createdAt: string
  user: { id: string; name: string; email: string }
  page?: { id: string; title: string; slug: string; spaceId: string } | null
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}
