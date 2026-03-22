import { Request, Response, NextFunction } from 'express'
import { verifyToken, JWTPayload } from '../lib/jwt'

export interface AuthRequest extends Request {
  user?: JWTPayload
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.token

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const payload = verifyToken(token)
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
