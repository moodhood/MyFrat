import express from 'express';
import {
  register,
  login,
  confirmEmail,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';
import { sendConfirmationEmail } from '../utils/email.js';
import { canResend } from '../utils/rateLimit.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// --- Auth Endpoints ---
router.post('/register', register);
router.post('/login', login);
router.post('/confirm', confirmEmail);
router.post('/forgot', forgotPassword);
router.post('/reset', resetPassword);

// --- Resend Confirmation Code ---
router.post('/resend-code', async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!canResend(email)) {
    return res.status(429).json({ error: 'Please wait before requesting another code.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.emailConfirmed) {
      return res.status(400).json({ error: 'Email already confirmed' });
    }

    // Generate and persist new code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.user.update({
      where: { id: user.id },
      data: { emailConfirmCode: newCode },
    });

    // Send via branded helper
    await sendConfirmationEmail(email, newCode);

    res.status(200).json({ message: 'Confirmation code resent' });
  } catch (err) {
    console.error('❌ Resend code error:', err);
    res.status(500).json({ error: 'Failed to resend confirmation code' });
  }
});

// --- Get Current Authenticated User ---
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
        role: { select: { name: true, permissions: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error('❌ Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
