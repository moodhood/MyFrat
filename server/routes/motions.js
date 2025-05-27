import express from 'express'
import { PrismaClient } from '@prisma/client'
import authMiddleware from '../middleware/auth.js'
import authorize from '../middleware/authorize.js'

const prisma = new PrismaClient()
const router = express.Router()

// List all motions (open first, then closed)
router.get('/', authMiddleware, async (_req, res, next) => {
  try {
    const motions = await prisma.motion.findMany({
      orderBy: [{ stopped: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        stopped: true,
        deadline: true,
        createdAt: true
      }
    })
    res.json(motions)
  } catch (err) {
    next(err)
  }
})

// View motion detail + user's vote + totals if officer
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const motion = await prisma.motion.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        optionA: true,
        optionB: true,
        stopped: true,
        deadline: true,
        createdAt: true,
        votes: {
          where: { userId: req.user.id },
          select: { choice: true }
        }
      }
    })

    if (!motion) return res.status(404).json({ error: 'Motion not found' })

    const yourVote = motion.votes[0]?.choice
    delete motion.votes

    let totals = null
    if (req.user.permissions.includes('manage_votes')) {
      const allVotes = await prisma.vote.groupBy({
        by: ['choice'],
        where: { motionId: id },
        _count: true
      })
      totals = {
        A: allVotes.find(v => v.choice === 'A')?._count || 0,
        B: allVotes.find(v => v.choice === 'B')?._count || 0
      }
    }

    res.json({ ...motion, yourVote, totals })
  } catch (err) {
    next(err)
  }
})

// Create a new motion (officers only)
router.post(
  '/',
  authMiddleware,
  authorize('manage_votes'),
  async (req, res, next) => {
    try {
      const { title, description, optionA, optionB, deadline } = req.body
      const motion = await prisma.motion.create({
        data: {
          title,
          description,
          optionA,
          optionB,
          deadline: new Date(deadline)
        }
      })
      res.status(201).json(motion)
    } catch (err) {
      next(err)
    }
  }
)

// Cast or update a vote
router.post(
  '/:id/vote',
  authMiddleware,
  async (req, res, next) => {
    try {
      const motionId = Number(req.params.id)
      const { choice } = req.body

      if (!['A', 'B'].includes(choice)) {
        return res.status(400).json({ error: 'Invalid choice' })
      }

      const motion = await prisma.motion.findUnique({ where: { id: motionId } })
      if (!motion || motion.stopped || new Date(motion.deadline) < new Date()) {
        return res.status(400).json({ error: 'Motion is closed or expired' })
      }

      const vote = await prisma.vote.upsert({
        where: {
          userId_motionId: {
            userId: req.user.id,
            motionId
          }
        },
        update: { choice },
        create: {
          userId: req.user.id,
          motionId,
          choice
        }
      })

      res.json(vote)
    } catch (err) {
      next(err)
    }
  }
)

// Stop a motion early (officers only)
router.patch(
  '/:id/stop',
  authMiddleware,
  authorize('manage_votes'),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id)
      const motion = await prisma.motion.update({
        where: { id },
        data: { stopped: true }
      })
      res.json(motion)
    } catch (err) {
      next(err)
    }
  }
)

export default router
