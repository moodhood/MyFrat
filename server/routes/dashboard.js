// server/routes/dashboard.js

import express from 'express'
import { PrismaClient } from '@prisma/client'
import authMiddleware from '../middleware/auth.js'
import authorize from '../middleware/authorize.js'

const router = express.Router()
const prisma = new PrismaClient()

router.get(
  '/',
  authMiddleware,
  authorize('assign_duties'), // or 'manage_events' — any officer permission
  async (_req, res, next) => {
    try {
      const [duties, logs, totalMembers, totalHours] = await Promise.all([
        prisma.dutyAssignment.findMany({
          orderBy: { dueDate: 'desc' },
          take: 5,
          include: { user: { select: { name: true } } }
        }),
        prisma.philanthropyLog.findMany({
          orderBy: { date: 'desc' },
          take: 5,
          include: { user: { select: { name: true } } }
        }),
        prisma.user.count(),
        prisma.philanthropyLog.aggregate({
          _sum: { hours: true }
        })
      ])

      res.json({
        duties,
        logs,
        totalMembers,
        totalHours: totalHours._sum.hours || 0
      })
    } catch (err) {
      next(err)
    }
  }
)

export default router
