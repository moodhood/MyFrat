import express from 'express'
import { PrismaClient } from '@prisma/client'
import authMiddleware from '../middleware/auth.js'
import authorize from '../middleware/authorize.js'

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/events — list all events
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({ orderBy: { start: 'asc' } })
    res.json(events)
  } catch (err) {
    next(err)
  }
})

// POST /api/events — create a new event (officers only)
router.post(
  '/',
  authMiddleware,
  authorize('manage_events'),
  async (req, res, next) => {
    try {
      const { title, description, location, start, end, category } = req.body
      const ev = await prisma.event.create({
        data: { title, description, location, start: new Date(start), end: new Date(end), category }
      })
      res.status(201).json(ev)
    } catch (err) {
      next(err)
    }
  }
)

// PUT /api/events/:id — update an event (officers only)
router.put(
  '/:id',
  authMiddleware,
  authorize('manage_events'),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id)
      const { title, description, location, start, end, category } = req.body
      const ev = await prisma.event.update({
        where: { id },
        data: { title, description, location, start: new Date(start), end: new Date(end), category }
      })
      res.json(ev)
    } catch (err) {
      next(err)
    }
  }
)

// DELETE /api/events/:id — delete an event (officers only)
router.delete(
  '/:id',
  authMiddleware,
  authorize('manage_events'),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id)
      await prisma.event.delete({ where: { id } })
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  }
)

export default router
