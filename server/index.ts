import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import authRoutes from './routes/auth'
import spacesRoutes from './routes/spaces'
import pagesRoutes from './routes/pages'
import usersRoutes from './routes/users'
import adminRoutes from './routes/admin'

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(
  cors({
    origin: ['http://localhost:5070', 'http://127.0.0.1:5070'],
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

app.listen(PORT, () => {
  console.log(`BaseDocs server running on http://localhost:${PORT}`)
})

export default app
