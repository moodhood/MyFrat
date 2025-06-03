// src/utils/dutyScheduler.js

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Utility: Given any Date, return a new Date that is the Monday (00:00:00) of that week.
// We assume week starts on Monday. If today is Sunday (getDay() === 0), Monday was six days ago.
function getStartOfWeek(date) {
  const d = new Date(date);
  // JS getDay(): 0 = Sunday, 1 = Monday, …, 6 = Saturday
  const jsDay = d.getDay();
  // Convert to 1=Monday … 7=Sunday
  const dow = jsDay === 0 ? 7 : jsDay;
  // Number of days since Monday:
  const diff = dow - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Main rotation function: looks at "today", finds duties due today, and assigns them if not already done.
async function rotateDutiesForToday() {
  const today = new Date();
  const jsDay = today.getDay(); // 0=Sunday…6=Saturday
  // Convert to 1=Monday…7=Sunday:
  const todayDOW = jsDay === 0 ? 7 : jsDay;

  // Monday of this week:
  const thisWeekMonday = getStartOfWeek(today);

  // Fetch all active duties that haven’t ended yet:
  const duties = await prisma.duty.findMany({
    where: {
      active: true,
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: today } }
          ]
        }
      ]
    },
    include: {
      members: {
        orderBy: { order: 'asc' }
      }
    }
  });

  for (const duty of duties) {
    // Only assign if duty.dayOfWeek matches today:
    if (duty.dayOfWeek !== todayDOW) {
      continue;
    }

    // Check if we've already created an assignment for this duty for thisWeekMonday:
    const existing = await prisma.dutyAssignment.findFirst({
      where: {
        dutyId: duty.id,
        weekOf: thisWeekMonday
      }
    });
    if (existing) {
      // Already assigned this week; skip
      continue;
    }

    // If no members in rotation, skip
    const memberCount = duty.members.length;
    if (memberCount === 0) {
      continue;
    }

    // Determine which member to assign (cycle via currentIndex):
    let idx = duty.currentIndex ?? 0;
    if (idx >= memberCount) {
      idx = 0;
    }
    const nextMember = duty.members.find((m) => m.order === idx);
    if (!nextMember) {
      // Fallback: if order=idx is missing, just take members[0]
      nextMember = duty.members[0];
      idx = nextMember.order;
    }

    // Create DutyAssignment for this week:
    try {
      await prisma.dutyAssignment.create({
        data: {
          dutyId: duty.id,
          userId: nextMember.userId,
          weekOf: thisWeekMonday,
          dueDate: today, // assignment is due today (the chore's scheduled day)
        }
      });
    } catch (err) {
      console.error(`Failed to create assignment for duty ${duty.id} this week:`, err);
      continue;
    }

    // Update duty.currentIndex → next in rotation:
    const newIndex = (idx + 1) % memberCount;
    try {
      await prisma.duty.update({
        where: { id: duty.id },
        data: { currentIndex: newIndex }
      });
    } catch (err) {
      console.error(`Failed to update currentIndex for duty ${duty.id}:`, err);
    }
  }
}

// Schedule: run every day at 00:05 (server time). You can adjust if needed.
// Cron pattern: minute hour dayOfMonth month dayOfWeek
// '5 0 * * *' → at 00:05 every day.
cron.schedule('5 0 * * *', () => {
  rotateDutiesForToday()
    .then(() => {
      console.log('Duty rotation job completed for date:', new Date().toLocaleString());
    })
    .catch((err) => {
      console.error('Error running duty rotation job:', err);
    });
});

console.log('⚙️  Duty scheduler initialized (runs daily at 00:05).');

