// server/index.js

import 'dotenv/config'                 // Load .env into process.env
import express from 'express'
import { PrismaClient } from '@prisma/client'
import cors from 'cors' 

import authRouter from './routes/auth.js'
import authMiddleware from './middleware/auth.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3000

// 0. Enable CORS for your frontend origin
app.use(cors({
  origin: 'http://localhost:3001'       // ← adjust if your client runs on a different port
}))

// 1. JSON body parsing
app.use(express.json())

// 2. Public auth routes
app.use('/api/auth', authRouter)

// 3. Protected endpoint
app.get('/api/profile', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.user.id) },
      select: { id: true, email: true, name: true, createdAt: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json(user)
  } catch (err) {
    next(err)
  }
})

// 4. 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// 5. Centralized error handler
app.use(errorHandler)

// 6. Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server listening at http://localhost:${PORT}`)
})
