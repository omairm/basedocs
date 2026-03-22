import { Router, Response } from 'express'
import { z } from 'zod'
import { db } from '../lib/db'
import { requireAuth, AuthRequest } from '../middleware/requireAuth'
import { requireRole } from '../middleware/requireRole'

const router = Router()

router.use(requireAuth)

// GET /api/spaces
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const spaces = await db.space.findMany({
      where: { archived: false },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { pages: true } },
      },
    })
    res.json({ spaces })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/spaces/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const space = await db.space.findUnique({
      where: { id: req.params.id },
      include: {
        pages: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, email: true } },
            children: {
              orderBy: { createdAt: 'asc' },
              include: {
                children: {
                  orderBy: { createdAt: 'asc' },
                },
              },
            },
          },
        },
      },
    })

    if (!space) {
      res.status(404).json({ error: 'Space not found' })
      return
    }

    res.json({ space })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const createSpaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  emoji: z.string().default('📄'),
  color: z.string().default('#2d6a4f'),
})

// POST /api/spaces
router.post('/', requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createSpaceSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() })
    return
  }

  try {
    const space = await db.space.create({ data: parsed.data })
    res.status(201).json({ space })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const updateSpaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  emoji: z.string().optional(),
  color: z.string().optional(),
  archived: z.boolean().optional(),
})

// PATCH /api/spaces/:id
router.patch('/:id', requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = updateSpaceSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() })
    return
  }

  try {
    const space = await db.space.update({
      where: { id: req.params.id },
      data: parsed.data,
    })
    res.json({ space })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/spaces/:id
router.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await db.space.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
