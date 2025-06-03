// src/routes/duties.js

import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';
import requirePermission from '../middleware/requirePermission.js';

const router = express.Router();
const prisma = new PrismaClient();

// Utility: parse optional date string
const toDate = (s) => (s ? new Date(s) : undefined);

// Utility: Given a Date, return the Monday (00:00:00) of that week
function getStartOfWeek(date) {
  const d = new Date(date);
  const jsDay = d.getDay();         // 0=Sunday…6=Saturday
  const dow = jsDay === 0 ? 7 : jsDay; // Convert Sunday=0 → 7
  const diff = dow - 1;             // Days since Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Utility: Given a week’s Monday and a target dayOfWeek (1–7), plus hour/minute, return that Date
function getDueDateForWeekday(monday, dayOfWeek, hour, minute) {
  const result = new Date(monday);
  result.setDate(monday.getDate() + (dayOfWeek - 1));
  result.setHours(typeof hour === 'number' ? hour : 0);
  result.setMinutes(typeof minute === 'number' ? minute : 0);
  result.setSeconds(0, 0);
  return result;
}

/**
 * POST /api/duties
 * Create a new recurring Duty.  Request body should include:
 *   {
 *     name: String,
 *     dayOfWeek: 1..7,
 *     memberIds: [1,2,3,...],
 *     // FRONT END sends this as an ISO if you provided both date & time:
 *     endDate: "2025-06-09T10:00:00.000Z"   (or just date portion if no time)
 *   }
 *
 * We will extract dueHour/dueMinute from that ISO, store them on Duty, then seed the first DutyAssignment
 * using those hours/minutes when computing “firstDueDate.”  If the client did not supply any time (only date),
 * we default to 00:00 (midnight).
 */
router.post(
  '/',
  authMiddleware,
  requirePermission('assign_duties'),
  async (req, res, next) => {
    try {
      let { name, dayOfWeek, memberIds, endDate } = req.body;

      // 1) Basic validation
      if (!name || !dayOfWeek || !Array.isArray(memberIds) || memberIds.length === 0) {
        return res
          .status(400)
          .json({ error: 'name, dayOfWeek, and at least one memberId are required' });
      }

      dayOfWeek = Number(dayOfWeek);
      if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
        return res.status(400).json({ error: 'dayOfWeek must be integer 1–7' });
      }

      memberIds = memberIds.map((id) => Number(id)).filter((id) => !isNaN(id));
      if (memberIds.length === 0) {
        return res.status(400).json({ error: 'memberIds must contain valid user IDs' });
      }

      // 2) Parse payload.endDate (might include time)
      // If endDate is provided as ISO, we extract hours & minutes; otherwise null.
      let dh = null;
      let dm = null;
      let finalEndDate = null; // will hold a Date or null

      if (endDate) {
        const parsed = new Date(endDate);
        if (isNaN(parsed.getTime())) {
          return res.status(400).json({ error: 'Invalid endDate format' });
        }
        // Extract the local hour/minute that the user picked
        const localHour = parsed.getHours();
        const localMinute = parsed.getMinutes();

        dh = localHour;    // will be 0..23
        dm = localMinute;  // will be 0..59
        finalEndDate = parsed; // store full DateTime as endDate in DB
      }

      // 3) Compute this week’s Monday at 00:00
      const now = new Date();
      const todayMidnight = new Date(now);
      todayMidnight.setHours(0, 0, 0, 0);
      const thisWeekMonday = getStartOfWeek(todayMidnight);

      // 4) Compute which “weekOf” to seed (this week or next) and the actual first “dueDate”
      let firstWeekOf, firstDueDate;
      const maybeThisWeekDue = getDueDateForWeekday(
        thisWeekMonday,
        dayOfWeek,
        dh,
        dm
      );
      if (maybeThisWeekDue.getTime() >= todayMidnight.getTime()) {
        firstWeekOf = thisWeekMonday;
        firstDueDate = maybeThisWeekDue;
      } else {
        const nextWeekMonday = new Date(thisWeekMonday);
        nextWeekMonday.setDate(thisWeekMonday.getDate() + 7);
        firstWeekOf = nextWeekMonday;
        firstDueDate = getDueDateForWeekday(nextWeekMonday, dayOfWeek, dh, dm);
      }

      // 5) Create the Duty row, storing dayOfWeek + dueHour/dueMinute + startDate + endDate
      const duty = await prisma.duty.create({
        data: {
          name: name.trim(),
          dayOfWeek,
          dueHour: dh,
          dueMinute: dm,
          startDate: thisWeekMonday,
          endDate: finalEndDate,
          currentIndex: 0,
          createdBy: req.user.id,
        },
      });

      // 6) Create DutyMember entries in the specified rotation order
      const membersData = memberIds.map((uid, idx) => ({
        dutyId: duty.id,
        userId: uid,
        order: idx,
      }));
      await prisma.dutyMember.createMany({
        data: membersData,
        skipDuplicates: true,
      });

      // 7) Seed the very first DutyAssignment (for firstWeekOf)
      const firstMember = await prisma.dutyMember.findFirst({
        where: { dutyId: duty.id, order: 0 },
      });
      if (firstMember) {
        await prisma.dutyAssignment.create({
          data: {
            dutyId: duty.id,
            userId: firstMember.userId,
            weekOf: firstWeekOf,
            dueDate: firstDueDate,
          },
        });
        // Advance currentIndex for rotation
        const nextIndex = memberIds.length > 1 ? 1 : 0;
        await prisma.duty.update({
          where: { id: duty.id },
          data: { currentIndex: nextIndex },
        });
      }

      return res
        .status(201)
        .json({ message: 'Duty created successfully', dutyId: duty.id });
    } catch (err) {
      console.error('❌ POST /api/duties error:', err);
      next(err);
    }
  }
);


/**
 * GET /api/duties
 * Officer view: return all active duties with members + dueHour/dueMinute + next upcoming assignment.
 */
router.get(
  '/',
  authMiddleware,
  requirePermission('assign_duties'),
  async (req, res, next) => {
    try {
      // 1) Fetch all active duties with their rotation members
      const duties = await prisma.duty.findMany({
        where: { active: true },
        include: {
          members: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });

      const today = new Date();
      const thisWeekMonday = getStartOfWeek(today);

      // 2) For each duty, find next assignment whose weekOf >= thisWeekMonday
      const result = [];
      for (const duty of duties) {
        let nextIndex = duty.currentIndex;
        if (nextIndex >= duty.members.length) nextIndex = 0;

        const nextAssignment = await prisma.dutyAssignment.findFirst({
          where: {
            dutyId: duty.id,
            weekOf: {
              gte: thisWeekMonday,
            },
          },
          orderBy: { weekOf: 'asc' },
          include: {
            assignee: { select: { id: true, name: true } },
          },
        });

        result.push({
          id: duty.id,
          name: duty.name,
          dayOfWeek: duty.dayOfWeek,
          dueHour: duty.dueHour,
          dueMinute: duty.dueMinute,
          endDate: duty.endDate,
          members: duty.members.map((m) => ({
            userId: m.user.id,
            name: m.user.name,
            order: m.order,
          })),
          currentIndex: nextIndex,
          thisWeekAssignment: nextAssignment
            ? {
                assignmentId: nextAssignment.id,
                userId: nextAssignment.assignee.id,
                name: nextAssignment.assignee.name,
                dueDate: nextAssignment.dueDate,
                done: nextAssignment.done,
              }
            : null,
        });
      }

      return res.json(result);
    } catch (err) {
      console.error('❌ GET /api/duties error:', err);
      next(err);
    }
  }
);


/**
 * PUT /api/duties/:id
 * Edit an existing Duty’s name, dayOfWeek, dueHour/dueMinute (extracted from endDate ISO),
 * rotation members, or endDate.
 */
router.put(
  '/:id',
  authMiddleware,
  requirePermission('assign_duties'),
  async (req, res, next) => {
    try {
      const dutyId = Number(req.params.id);
      if (isNaN(dutyId)) {
        return res.status(400).json({ error: 'Invalid duty ID' });
      }

      const existingDuty = await prisma.duty.findUnique({
        where: { id: dutyId },
        include: { members: true },
      });
      if (!existingDuty) {
        return res.status(404).json({ error: 'Duty not found' });
      }

      let { name, dayOfWeek, memberIds, endDate } = req.body;
      const updates = {};

      if (typeof name === 'string' && name.trim() !== '') {
        updates.name = name.trim();
      }
      if (dayOfWeek !== undefined) {
        const dow = Number(dayOfWeek);
        if (isNaN(dow) || dow < 1 || dow > 7) {
          return res.status(400).json({ error: 'dayOfWeek must be integer 1–7' });
        }
        updates.dayOfWeek = dow;
      }

      // If endDate provided, parse its time & date again:
      if (endDate !== undefined) {
        if (!endDate) {
          // Clearing out endDate entirely
          updates.endDate = null;
          updates.dueHour = null;
          updates.dueMinute = null;
        } else {
          const parsed = new Date(endDate);
          if (isNaN(parsed.getTime())) {
            return res.status(400).json({ error: 'Invalid endDate' });
          }
          // Extract local hour & minute
          const localHour = parsed.getHours();
          const localMinute = parsed.getMinutes();
          updates.dueHour = localHour;
          updates.dueMinute = localMinute;
          updates.endDate = parsed; // keep the full Date for “stop generating”
        }
      }

      // If rotating members changed, wipe & re‐seed
      if (Array.isArray(memberIds)) {
        const cleanIds = memberIds
          .map((id) => Number(id))
          .filter((id) => !isNaN(id));
        if (cleanIds.length === 0) {
          return res
            .status(400)
            .json({ error: 'memberIds must contain at least one valid user ID' });
        }

        // Delete existing members for this duty
        await prisma.dutyMember.deleteMany({ where: { dutyId } });

        // Re-create with new order
        const newMembersData = cleanIds.map((uid, idx) => ({
          dutyId,
          userId: uid,
          order: idx,
        }));
        await prisma.dutyMember.createMany({
          data: newMembersData,
          skipDuplicates: true,
        });

        // Reset rotation pointer
        updates.currentIndex = 0;
      }

      await prisma.duty.update({
        where: { id: dutyId },
        data: updates,
      });

      return res.json({ message: 'Duty updated successfully' });
    } catch (err) {
      console.error('❌ PUT /api/duties/:id error:', err);
      next(err);
    }
  }
);


/**
 * DELETE /api/duties/:id
 * Soft-delete a duty and remove future assignments.
 */
router.delete(
  '/:id',
  authMiddleware,
  requirePermission('assign_duties'),
  async (req, res, next) => {
    try {
      const dutyId = Number(req.params.id);
      if (isNaN(dutyId)) {
        return res.status(400).json({ error: 'Invalid duty ID' });
      }

      // Mark this duty inactive
      await prisma.duty.update({
        where: { id: dutyId },
        data: { active: false },
      });

      const now = new Date();
      const currMonday = getStartOfWeek(now);

      // Delete all future assignments for this duty
      await prisma.dutyAssignment.deleteMany({
        where: {
          dutyId,
          weekOf: { gte: currMonday },
        },
      });

      return res.status(204).end();
    } catch (err) {
      console.error('❌ DELETE /api/duties/:id error:', err);
      next(err);
    }
  }
);


/**
 * GET /api/duties/assignments/my
 * Return next pending assignment(s) for logged-in user (this week or later).
 */
router.get(
  '/assignments/my',
  authMiddleware,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const today = new Date();
      const thisWeekMonday = getStartOfWeek(today);

      // Fetch all pending assignments where weekOf >= thisWeekMonday
      const assignments = await prisma.dutyAssignment.findMany({
        where: {
          userId,
          weekOf: { gte: thisWeekMonday },
          done: false,
        },
        include: {
          duty: { select: { name: true, dueHour: true, dueMinute: true, dayOfWeek: true } },
        },
        orderBy: { weekOf: 'asc' },
      });

      const result = assignments.map((as) => ({
        assignmentId: as.id,
        dutyId: as.duty.id,
        dutyName: as.duty.name,
        dueDate: as.dueDate,
        done: as.done,
      }));

      return res.json(result);
    } catch (err) {
      console.error('❌ GET /api/duties/assignments/my error:', err);
      next(err);
    }
  }
);


/**
 * POST /api/duties/assignments/:id/done
 * Mark a DutyAssignment as done.
 */
router.post(
  '/assignments/:id/done',
  authMiddleware,
  async (req, res, next) => {
    try {
      const assignmentId = Number(req.params.id);
      if (isNaN(assignmentId)) {
        return res.status(400).json({ error: 'Invalid assignment ID' });
      }

      const existing = await prisma.dutyAssignment.findUnique({
        where: { id: assignmentId },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      const isOwner = existing.userId === req.user.id;
      const isOfficer = req.user.permissions.includes('assign_duties');
      if (!isOwner && !isOfficer) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updated = await prisma.dutyAssignment.update({
        where: { id: assignmentId },
        data: {
          done: true,
          doneAt: new Date(),
        },
      });

      return res.json({ message: 'Marked as done', assignmentId: updated.id });
    } catch (err) {
      console.error('❌ POST /api/duties/assignments/:id/done error:', err);
      next(err);
    }
  }
);

export default router;
