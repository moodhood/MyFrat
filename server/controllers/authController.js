// server/controllers/authController.js

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import {
  sendConfirmationEmail,
  sendResetPasswordEmail
} from '../utils/email.js';

const prisma = new PrismaClient();
const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  throw new Error('❌ JWT_SECRET not defined in environment');
}

// REGISTER
export async function register(req, res) {
  try {
    let { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    email = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const role = await prisma.role.findFirst({ where: { name: 'Member' } });
    if (!role) {
      return res.status(500).json({ error: 'Default role not found' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const confirmCode = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        roleId: role.id,
        emailConfirmed: false,
        emailConfirmCode: confirmCode,
      },
    });

    // Send branded confirmation email
    await sendConfirmationEmail(email, confirmCode);

    res.status(201).json({ message: 'Confirmation code sent' });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// CONFIRM EMAIL
export async function confirmEmail(req, res) {
  const { email, code } = req.body;
  if (!email || !code) {
    return res
      .status(400)
      .json({ error: 'Email and confirmation code are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailConfirmed) {
      return res.status(200).json({ message: 'Email already confirmed' });
    }

    if (user.emailConfirmCode !== code) {
      return res.status(400).json({ error: 'Invalid confirmation code' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailConfirmed: true, emailConfirmCode: null },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Email confirmation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// LOGIN
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { role: true },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.emailConfirmed) {
      return res.status(403).json({ error: 'Email not confirmed' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash, emailConfirmCode, resetToken, resetTokenExpiry, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// FORGOT PASSWORD
export async function forgotPassword(req, res) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.sendStatus(204); // silent fail

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.emailConfirmed) {
      return res.sendStatus(204);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const resetLink = `http://localhost:3001/reset-password/${token}`;

    // Send branded reset-password email
    await sendResetPasswordEmail(email, resetLink);

    res.sendStatus(204);
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// RESET PASSWORD
export async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: 'Token and new password are required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
