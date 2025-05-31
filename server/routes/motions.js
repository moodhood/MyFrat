// server/routes/motions.js

import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * GET /api/motions?archived=true|false
 *   – List all motions (filtered by archived flag)
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const showArchived = req.query.archived === 'true';

    const motions = await prisma.motion.findMany({
      where: { archived: showArchived },
      orderBy: [
        { stopped: 'asc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        stopped: true,
        archived: true,
        deadline: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.json(motions);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/motions/:id
 *   – Fetch a single motion (including votes, yourVote, totals if allowed)
 */
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid motion ID' });
    }

    const motion = await prisma.motion.findUnique({
      where: { id },
      include: { votes: true }
    });

    if (!motion) {
      return res.status(404).json({ error: 'Motion not found' });
    }

    const isCreator = req.user.id === motion.creatorId;
    const isOfficer = req.user.permissions?.includes('manage_votes');
    let yourVote = null;

    if (!isCreator) {
      const existing = motion.votes.find(v => v.userId === req.user.id);
      yourVote = existing?.choice ?? null;
    }

    let totals = null;
    if (isCreator || isOfficer || motion.stopped) {
      // group votes by choice
      const grouped = await prisma.vote.groupBy({
        by: ['choice'],
        where: { motionId: id },
        _count: true
      });

      totals = {};
      for (const g of grouped) {
        totals[g.choice] = g._count;
      }
    }

    return res.json({
      id: motion.id,
      title: motion.title,
      description: motion.description,
      options: motion.options,
      stopped: motion.stopped,
      archived: motion.archived,
      deadline: motion.deadline,
      createdAt: motion.createdAt,
      updatedAt: motion.updatedAt,
      creatorId: motion.creatorId,
      yourVote,
      totals
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/motions
 *   – Create a new motion
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { title, description, options } = req.body;

    if (!title || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        error: 'Title and at least two options are required.'
      });
    }

    const motion = await prisma.motion.create({
      data: {
        title,
        description: description || null,
        options,
        deadline: null,
        stopped: false,
        archived: false,
        creatorId: req.user.id
      }
    });

    return res.status(201).json(motion);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/motions/:id/vote
 *   – Cast or update a vote on a motion
 */
router.post('/:id/vote', authMiddleware, async (req, res, next) => {
  try {
    const motionId = Number(req.params.id);
    if (isNaN(motionId)) {
      return res.status(400).json({ error: 'Invalid motion ID' });
    }

    const { choice } = req.body;
    if (!choice) {
      return res.status(400).json({ error: 'Choice is required' });
    }

    // Fetch motion to verify state
    const motion = await prisma.motion.findUnique({ where: { id: motionId } });
    if (!motion) {
      return res.status(404).json({ error: 'Motion not found' });
    }

    // Creator cannot vote on their own motion
    if (motion.creatorId === req.user.id) {
      return res.status(403).json({
        error: 'Creators are not allowed to vote on their own motions'
      });
    }

    // If motion is stopped or deadline passed, reject
    if (motion.stopped || (motion.deadline && new Date(motion.deadline) < new Date())) {
      return res.status(400).json({ error: 'Motion is closed or expired' });
    }

    // Ensure choice is valid
    if (!motion.options.includes(choice)) {
      return res.status(400).json({ error: 'Invalid choice' });
    }

    // Upsert vote (update if exists, create if not)
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
    });

    return res.status(201).json(vote);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/motions/:id/stop
 *   – Stop voting on a motion (only creator or officer)
 */
router.patch('/:id/stop', authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid motion ID' });
    }

    const motion = await prisma.motion.findUnique({ where: { id } });
    if (!motion) {
      return res.status(404).json({ error: 'Motion not found' });
    }

    const isCreator = motion.creatorId === req.user.id;
    const isOfficer = req.user.permissions?.includes('manage_votes');
    if (!isCreator && !isOfficer) {
      return res.status(403).json({ error: 'Not authorized to stop this motion' });
    }

    const updated = await prisma.motion.update({
      where: { id },
      data: { stopped: true }
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/motions/:id/archive
 *   – Archive a motion (only creator or officer)
 */
router.patch('/:id/archive', authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid motion ID' });
    }

    const motion = await prisma.motion.findUnique({ where: { id } });
    if (!motion) {
      return res.status(404).json({ error: 'Motion not found' });
    }

    const isCreator = motion.creatorId === req.user.id;
    const isOfficer = req.user.permissions?.includes('manage_votes');
    if (!isCreator && !isOfficer) {
      return res.status(403).json({ error: 'Not authorized to archive this motion' });
    }

    const updated = await prisma.motion.update({
      where: { id },
      data: { archived: true }
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/motions/:id
 *   – Delete a motion (only creator or officer)
 *   – Returns 204 on success, 404 if not found, 403 if unauthorized
 */
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid motion ID' });
    }

    // Fetch motion to verify existence + ownership/permissions
    const motion = await prisma.motion.findUnique({ where: { id } });
    if (!motion) {
      return res.status(404).json({ error: 'Motion not found' });
    }

    const isCreator = motion.creatorId === req.user.id;
    const isOfficer = req.user.permissions?.includes('manage_votes');
    if (!isCreator && !isOfficer) {
      return res.status(403).json({ error: 'Not authorized to delete this motion' });
    }

    // Attempt to delete
    await prisma.motion.delete({ where: { id } });
    return res.status(204).send(); // No Content
  } catch (err) {
    // If Prisma throws because record not found, return 404
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Motion not found' });
    }
    console.error('Error deleting motion:', err);
    next(err);
  }
});

export default router;
