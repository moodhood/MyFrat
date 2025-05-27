// server/routes/duties.js

import express from 'express'
import { PrismaClient } from '@prisma/client'
import authMiddleware from '../middleware/auth.js'
import authorize from '../middleware/authorize.js'

const router = express.Router()
const prisma = new PrismaClient()

// Helper to parse date strings
const toDate = s => (s ? new Date(s) : undefined)

/**
 * GET /api/duties
 * - Everyone sees only their own duties (inbox)
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const duties = await prisma.dutyAssignment.findMany({
      where: { userId: req.user.id },
      orderBy: { dueDate: 'asc' }
    })
    res.json(duties)
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/duties/all
 * - Officers only: see every member’s duties
 */
router.get(
  '/all',
  authMiddleware,
  authorize('assign_duties'),
  async (_req, res, next) => {
    try {
      const duties = await prisma.dutyAssignment.findMany({
        orderBy: { dueDate: 'asc' }
      })
      res.json(duties)
    } catch (err) {
      next(err)
    }
  }
)

/**
 * POST /api/duties
 * - Assign a duty (officers only)
 */
router.post(
  '/',
  authMiddleware,
  authorize('assign_duties'),
  async (req, res, next) => {
    try {
      let { userId, description, dueDate } = req.body

      userId = Number(userId)
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid userId' })
      }

      const duty = await prisma.dutyAssignment.create({
        data: { userId, description, dueDate: toDate(dueDate) }
      })
      res.status(201).json(duty)
    } catch (err) {
      next(err)
    }
  }
)

/**
 * PATCH /api/duties/:id
 * - Mark complete or update (owner or officers)
 */
router.patch(
  '/:id',
  authMiddleware,
  async (req, res, next) => {
    try {
      const id = Number(req.params.id)
      const existing = await prisma.dutyAssignment.findUnique({ where: { id } })
      if (!existing) return res.status(404).end()

      // only owner or officers can update
      if (
        existing.userId !== req.user.id &&
        !req.user.permissions.includes('assign_duties')
      ) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      const { description, dueDate, completed } = req.body
      const updated = await prisma.dutyAssignment.update({
        where: { id },
        data: { description, dueDate: toDate(dueDate), completed }
      })
      res.json(updated)
    } catch (err) {
      next(err)
    }
  }
)

/**
 * DELETE /api/duties/:id
 * - Delete a duty (officers only)
 */
router.delete(
  '/:id',
  authMiddleware,
  authorize('assign_duties'),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id)
      await prisma.dutyAssignment.delete({ where: { id } })
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  }
)

export default router
