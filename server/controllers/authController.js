// src/controllers/authController.js

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import {
  sendConfirmationEmail,
  sendResetPasswordEmail,
} from '../utils/email.js';

const prisma = new PrismaClient();
const { JWT_SECRET, JWT_EXPIRATION = '7d' } = process.env;

if (!JWT_SECRET) {
  throw new Error('❌ JWT_SECRET not defined in environment');
}

// Helper to look up a role’s ID by name
async function getRoleIdByName(roleName) {
  const role = await prisma.role.findUnique({
    where: { name: roleName },
    select: { id: true },
  });
  if (!role) {
    throw new Error(`Role not found: ${roleName}`);
  }
  return role.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
export async function register(req, res) {
  try {
    let { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    email = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Hash password + create confirmation code
    const passwordHash = await bcrypt.hash(password, 10);
    const confirmCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email,
        name: name.trim(),
        passwordHash,
        emailConfirmed: false,
        emailConfirmCode: confirmCode,
      },
      select: { id: true, email: true },
    });

    // Assign default “Member” role via UserRole
    const memberRoleId = await getRoleIdByName('Member');
    await prisma.userRole.create({
      data: {
        userId: newUser.id,
        roleId: memberRoleId,
      },
    });

    // Send confirmation email
    await sendConfirmationEmail(email, confirmCode);
    return res.status(201).json({ message: 'Confirmation code sent' });
  } catch (err) {
    console.error('❌ Registration error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM EMAIL
export async function confirmEmail(req, res) {
  const { email, code } = req.body;
  if (!email || !code) {
    return res
      .status(400)
      .json({ error: 'Email and confirmation code are required' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        emailConfirmed: true,
        emailConfirmCode: true,
      },
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
    return res.status(200).json({ message: 'Email confirmed successfully' });
  } catch (err) {
    console.error('❌ Confirm email error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
export async function login(req, res) {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Email and password are required' });
    }

    email = email.trim().toLowerCase();
    const userRecord = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        emailConfirmed: true,
        passwordHash: true,
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                permissions: true,
              },
            },
          },
        },
      },
    });
    if (!userRecord) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const passwordValid = await bcrypt.compare(
      password,
      userRecord.passwordHash
    );
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!userRecord.emailConfirmed) {
      return res.status(403).json({ error: 'Email not confirmed' });
    }

    // Flatten roles → array of role objects
    const rolesArray = userRecord.userRoles.map((ur) => ur.role);

    // Flatten permissions into a Set
    const permissionsSet = new Set();
    rolesArray.forEach((role) => {
      if (Array.isArray(role.permissions)) {
        role.permissions.forEach((perm) => permissionsSet.add(perm));
      }
    });
    const permissions = Array.from(permissionsSet);

    // Sign JWT (include user ID; we trust middleware to re-fetch full permissions)
    const token = jwt.sign(
      { id: userRecord.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    // Prepare safeUser to return
    const safeUser = {
      id: userRecord.id,
      email,
      roles: rolesArray,
      permissions,
    };

    return res.status(200).json({ token, user: safeUser });
  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD
export async function forgotPassword(req, res) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) {
      return res.sendStatus(204); // silent
    }
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailConfirmed: true },
    });
    if (!user || !user.emailConfirmed) {
      return res.sendStatus(204); // silent if not found or not confirmed
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const resetLink = `http://localhost:3001/reset-password/${token}`;
    await sendResetPasswordEmail(email, resetLink);

    return res.sendStatus(204);
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
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
      select: { id: true },
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
    return res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('❌ Reset password error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
