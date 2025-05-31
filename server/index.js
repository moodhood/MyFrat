// server/index.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';

import authRouter from './routes/auth.js';
import userRouter from './routes/users.js';
import eventRouter from './routes/events.js';
import dutyRouter from './routes/duties.js';
import philanthropyRouter from './routes/philanthropy.js';
import motionRouter from './routes/motions.js';
import dashboardRouter from './routes/dashboard.js';
import folderRouter from './routes/folders.js';
import documentsRouter from './routes/documents.js';

import authMiddleware from './middleware/auth.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT ?? 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3001';

// 1. Enable CORS for our React front-end
app.use(cors({ origin: CLIENT_ORIGIN }));

// 2. Parse incoming JSON bodies
app.use(express.json());

// 3. Serve the uploads folder as static files
app.use('/uploads', express.static(path.resolve('uploads')));

// 4. Public authentication routes (no JWT required)
app.use('/api/auth', authRouter);

// 5. Protected API routes (require valid JWT)
app.use('/api/users',        authMiddleware, userRouter);
app.use('/api/events',       authMiddleware, eventRouter);
app.use('/api/duties',       authMiddleware, dutyRouter);
app.use('/api/philanthropy', authMiddleware, philanthropyRouter);
app.use('/api/motions',      authMiddleware, motionRouter);
app.use('/api/dashboard',    authMiddleware, dashboardRouter);

// 6. File-system routes (folders before documents)
app.use('/api/folders',   authMiddleware, folderRouter);
app.use('/api/documents', authMiddleware, documentsRouter);

// 7. Session-restore endpoint (alternative to /api/auth/me)
app.get('/api/auth/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.user.id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { name: true, permissions: true } }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ...user,
      role: {
        name: user.role.name,
        permissions: user.role.permissions
      }
    });
  } catch (err) {
    next(err);
  }
});

// 8. 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// 9. Global error handler
app.use(errorHandler);

// 10. Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});

// Optional: disconnect Prisma on shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
