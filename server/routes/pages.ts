import { Router, Response } from 'express'
import { z } from 'zod'
import { db } from '../lib/db'
import { requireAuth, AuthRequest } from '../middleware/requireAuth'

const router = Router()

router.use(requireAuth)

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function uniqueSlug(spaceId: string, baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await db.page.findFirst({
      where: {
        spaceId,
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    })

    if (!existing) return slug
    slug = `${baseSlug}-${counter++}`
  }
}

// GET /api/spaces/:spaceId/pages
router.get('/spaces/:spaceId/pages', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pages = await db.page.findMany({
      where: { spaceId: req.params.spaceId, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true } },
        children: {
          orderBy: { createdAt: 'asc' },
          include: {
            children: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    })
    res.json({ pages })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/pages/:id
router.get('/pages/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = await db.page.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, name: true, email: true } },
        space: { select: { id: true, name: true, emoji: true, color: true } },
        parent: { select: { id: true, title: true, slug: true } },
        children: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, title: true, slug: true },
        },
      },
    })

    if (!page) {
      res.status(404).json({ error: 'Page not found' })
      return
    }

    res.json({ page })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const createPageSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.any().optional(),
  parentId: z.string().optional(),
})

// POST /api/spaces/:spaceId/pages
router.post('/spaces/:spaceId/pages', async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createPageSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() })
    return
  }

  try {
    const { title, content, parentId } = parsed.data
    const baseSlug = generateSlug(title)
    const slug = await uniqueSlug(req.params.spaceId, baseSlug)

    const page = await db.page.create({
      data: {
        title,
        slug,
        content: content || {},
        spaceId: req.params.spaceId,
        parentId: parentId || null,
        authorId: req.user!.userId,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    })

    await db.activity.create({
      data: {
        action: `Created page "${title}"`,
        userId: req.user!.userId,
        pageId: page.id,
      },
    })

    res.status(201).json({ page })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const updatePageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.any().optional(),
  parentId: z.string().nullable().optional(),
})

// PATCH /api/pages/:id
router.patch('/pages/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = updatePageSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() })
    return
  }

  try {
    const existing = await db.page.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      res.status(404).json({ error: 'Page not found' })
      return
    }

    // Only author or admin can edit
    if (existing.authorId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const { title, content, parentId } = parsed.data
    const updateData: Record<string, unknown> = {}

    if (content !== undefined) updateData.content = content
    if (parentId !== undefined) updateData.parentId = parentId

    if (title && title !== existing.title) {
      updateData.title = title
      const baseSlug = generateSlug(title)
      updateData.slug = await uniqueSlug(existing.spaceId, baseSlug, existing.id)
    }

    const page = await db.page.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        author: { select: { id: true, name: true } },
      },
    })

    await db.activity.create({
      data: {
        action: `Updated page "${page.title}"`,
        userId: req.user!.userId,
        pageId: page.id,
      },
    })

    res.json({ page })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/pages/:id
router.delete('/pages/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await db.page.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      res.status(404).json({ error: 'Page not found' })
      return
    }

    if (existing.authorId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    // Log activity before delete
    await db.activity.create({
      data: {
        action: `Deleted page "${existing.title}"`,
        userId: req.user!.userId,
        pageId: null,
      },
    })

    await db.page.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
