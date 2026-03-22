import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '../lib/db'
import { requireAuth, AuthRequest } from '../middleware/requireAuth'
import { requireRole } from '../middleware/requireRole'

const router = Router()

router.use(requireAuth)
router.use(requireRole('ADMIN'))

// GET /api/users
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await db.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ users })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'WRITER']).default('WRITER'),
})

// POST /api/users
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createUserSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() })
    return
  }

  try {
    const { email, name, password, role } = parsed.data
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ error: 'Email already in use' })
      return
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await db.user.create({
      data: { email, name, password: hashed, role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })

    res.status(201).json({ user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'WRITER']).optional(),
  password: z.string().min(6).optional(),
})

// PATCH /api/users/:id
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = updateUserSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() })
    return
  }

  try {
    const { name, role, password } = parsed.data
    const updateData: Record<string, unknown> = {}

    if (name) updateData.name = name
    if (role) updateData.role = role
    if (password) updateData.password = await bcrypt.hash(password, 10)

    const user = await db.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })

    res.json({ user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/users/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.params.id === req.user!.userId) {
      res.status(400).json({ error: 'Cannot delete your own account' })
      return
    }
    await db.user.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
