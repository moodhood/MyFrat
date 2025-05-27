import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';

import authRouter from './routes/auth.js';
import eventRouter from './routes/events.js';
import dutyRouter from './routes/duties.js';
import userRouter from './routes/users.js';
import philanthropyRouter from './routes/philanthropy.js';
import motionRouter from './routes/motions.js';
import dashboardRouter from './routes/dashboard.js';

import authMiddleware from './middleware/auth.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// 1. CORS
app.use(cors({ origin: 'http://localhost:3001' }));

// 2. JSON parser
app.use(express.json());

// 3. Serve uploads (e.g. profile pictures)
app.use('/uploads', express.static(path.resolve('uploads')));

// 4. Public routes
app.use('/api/auth', authRouter);

// 5. Protected routes
app.use('/api/events', eventRouter);
app.use('/api/duties', dutyRouter);
app.use('/api/users', userRouter);
app.use('/api/philanthropy', philanthropyRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/motions', motionRouter);

// 6. GET /api/auth/me — session restore
app.get('/api/auth/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.user.id) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthday: true,
        address: true,
        profilePicture: true,
        createdAt: true,
        role: {
          select: {
            name: true,
            permissions: true
          }
        }
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

// 7. Fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// 8. Global error handler
app.use(errorHandler);

// 9. Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
