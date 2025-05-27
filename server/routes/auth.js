import express from 'express';
import { register, login } from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/register', register);
router.post('/login', login);

// ✅ GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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

    res.status(200).json(user);
  } catch (err) {
    console.error('❌ Error in GET /me:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
