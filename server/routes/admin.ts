import { Router, Response } from 'express'
import { db } from '../lib/db'
import { requireAuth, AuthRequest } from '../middleware/requireAuth'
import { requireRole } from '../middleware/requireRole'

const router = Router()

router.use(requireAuth)
router.use(requireRole('ADMIN'))

// GET /api/admin/activity
router.get('/activity', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activities = await db.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, name: true, email: true } },
        page: { select: { id: true, title: true, slug: true, spaceId: true } },
      },
    })
    res.json({ activities })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/admin/stats
router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [userCount, spaceCount, pageCount, recentActivity] = await Promise.all([
      db.user.count(),
      db.space.count({ where: { archived: false } }),
      db.page.count(),
      db.activity.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
        },
      }),
    ])

    res.json({ stats: { userCount, spaceCount, pageCount }, recentActivity })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
