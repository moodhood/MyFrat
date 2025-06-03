// src/routes/dashboard.js

import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/dashboard — Officer Dashboard
 */
router.get(
  "/",
  authMiddleware,
  authorize("assign_duties"),
  async (_req, res, next) => {
    try {
      const [completedDuties, logs, totalMembers, sumResult] =
        await Promise.all([
          prisma.dutyAssignment.findMany({
            where: { done: true },
            orderBy: { doneAt: "desc" },
            take: 5,
            select: {
              id: true,
              doneAt: true,
              duty: {
                select: {
                  name: true,
                },
              },
              assignee: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          }),
          prisma.philanthropyLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              date: true,
              organization: true,
              hours: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          }),
          prisma.user.count(),
          prisma.philanthropyLog.aggregate({
            _sum: { hours: true },
          }),
        ]);

      res.json({
        completedDuties: completedDuties.map((d) => ({
          id: d.id,
          description: d.duty.name,
          completedAt: d.doneAt,
          user: {
            id: d.assignee.id,
            name: d.assignee.name,
          },
        })),
        logs,
        totalMembers,
        totalHours: sumResult._sum.hours || 0,
      });
    } catch (err) {
      console.error("❌ Officer Dashboard Error:", err);
      next(err);
    }
  }
);

/**
 * GET /api/dashboard/member — Member Dashboard
 */
router.get("/member", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        createdAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        philanthropy: {
          orderBy: { createdAt: "desc" },
          select: {
            date: true,
            organization: true,
            hours: true,
            createdAt: true,
          },
        },
        duties: {
          where: { done: false },
          orderBy: { dueDate: "asc" },
          select: {
            id: true,
            duty: {
              select: {
                name: true,
              },
            },
            dueDate: true,
            done: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const totalHours = user.philanthropy.reduce(
      (sum, log) => sum + log.hours,
      0
    );
    const latestLog = user.philanthropy[0] || null;

    const grouped = user.philanthropy.reduce((acc, log) => {
      acc[log.organization] = (acc[log.organization] || 0) + log.hours;
      return acc;
    }, {});
    const chartData = Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));

    const roleName = user.userRoles[0]?.role.name || "Member";

    res.json({
      name: user.name,
      role: roleName,
      joined: user.createdAt,
      totalHours,
      latestLog,
      duties: user.duties.map((d) => ({
        id: d.id,
        description: d.duty.name,
        dueDate: d.dueDate,
        done: d.done,
      })),
      chartData,
    });
  } catch (err) {
    console.error("❌ Member Dashboard Error:", err);
    res.status(500).json({ error: "Failed to load member dashboard" });
  }
});

export default router;
