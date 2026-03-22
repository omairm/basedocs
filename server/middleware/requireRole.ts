import { Response, NextFunction } from 'express'
import { AuthRequest } from './requireAuth'

export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    if (req.user.role !== role) {
      res.status(403).json({ error: 'Forbidden: insufficient permissions' })
      return
    }

    next()
  }
}
