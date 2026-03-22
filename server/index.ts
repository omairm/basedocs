import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import authRoutes from './routes/auth'
import spacesRoutes from './routes/spaces'
import pagesRoutes from './routes/pages'
import usersRoutes from './routes/users'
import adminRoutes from './routes/admin'

import path from 'path'

const app = express()
const PORT = Number(process.env.PORT) || 4000

// Middleware
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.APP_URL || true
      : ['http://localhost:5070', 'http://127.0.0.1:5070'],
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/spaces', spacesRoutes)
app.use('/api', pagesRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/admin', adminRoutes)

// Serve React frontend in production (must be after API routes)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

// This should always be last
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BaseDocs server running on port ${PORT}`)
})

export default app
