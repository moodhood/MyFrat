// server/routes/philanthropy.js

import express from 'express'
import { PrismaClient } from '@prisma/client'
import authMiddleware from '../middleware/auth.js'
import authorize from '../middleware/authorize.js'

const router = express.Router()
const prisma = new PrismaClient()

// Helper to parse date strings
const toDate = s => (s ? new Date(s) : undefined)

/**
 * GET /api/philanthropy
 * - Members see only their own logs
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const logs = await prisma.philanthropyLog.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' }
    })
    res.json(logs)
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/philanthropy/all
 * - Officers only: see everyone’s logs
 */
router.get(
  '/all',
  authMiddleware,
  authorize('manage_philanthropy'),
  async (_req, res, next) => {
    try {
      const logs = await prisma.philanthropyLog.findMany({
        orderBy: { date: 'desc' }
      })
      res.json(logs)
    } catch (err) {
      next(err)
    }
  }
)

/**
 * POST /api/philanthropy
 * - Log new hours (any authenticated member)
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { date, organization, hours, notes } = req.body
    const log = await prisma.philanthropyLog.create({
      data: {
        userId: req.user.id,
        date: toDate(date),
        organization,
        hours: Number(hours),
        notes
      }
    })
    res.status(201).json(log)
  } catch (err) {
    next(err)
  }
})

/**
 * PATCH /api/philanthropy/:id
 * - Members can edit their own logs, officers can edit any
 */
router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const existing = await prisma.philanthropyLog.findUnique({ where: { id } })
    if (!existing) return res.status(404).end()

    // Only owner or officers
    if (
      existing.userId !== req.user.id &&
      !req.user.permissions.includes('manage_philanthropy')
    ) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { date, organization, hours, notes } = req.body
    const updated = await prisma.philanthropyLog.update({
      where: { id },
      data: {
        date: toDate(date),
        organization,
        hours: Number(hours),
        notes
      }
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

/**
 * DELETE /api/philanthropy/:id
 * - Members can delete their own, officers can delete any
 */
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const existing = await prisma.philanthropyLog.findUnique({ where: { id } })
    if (!existing) return res.status(404).end()

    if (
      existing.userId !== req.user.id &&
      !req.user.permissions.includes('manage_philanthropy')
    ) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await prisma.philanthropyLog.delete({ where: { id } })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

export default router
