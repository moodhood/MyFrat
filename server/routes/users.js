import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();
// Setup file upload directory
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!req.user?.id) return cb(new Error('User ID missing in auth middleware'));
    cb(null, `user-${req.user.id}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, and WEBP images are allowed'));
    }
    cb(null, true);
  }
});

// 🔒 Protected route: GET all users
router.get('/', authMiddleware, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { lastSeen: new Date() },
    });

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        lastSeen: true,
        role: {
          select: { name: true }
        }
      }
    });

    res.json(users);
  } catch (err) {
    console.error('❌ GET /users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 🔒 Protected route: GET online users
router.get('/online', authMiddleware, async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - 2 * 60 * 1000);
    const users = await prisma.user.findMany({
      where: { lastSeen: { gte: cutoff } },
      select: {
        id: true,
        name: true,
        profilePicture: true,
        lastSeen: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(users);
  } catch (err) {
    console.error('❌ GET /users/online error:', err);
    res.status(500).json({ error: 'Failed to fetch online users' });
  }
});

// 🔒 Protected route: PATCH /users/profile
router.patch('/profile', authMiddleware, upload.single('profilePicture'), async (req, res) => {
  try {
    const {
      name, email, phone, birthday, address,
      currentPassword, newPassword, confirmPassword
    } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (birthday) updates.birthday = new Date(birthday);
    if (address) updates.address = address;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        profilePicture: true,
        role: { select: { name: true, permissions: true } }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.file) {
      if (user.profilePicture) {
        const oldPath = path.join(uploadDir, user.profilePicture);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.profilePicture = req.file.filename;
    }

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
      if (newPassword !== confirmPassword) return res.status(400).json({ error: 'New passwords do not match' });

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) return res.status(401).json({ error: 'Invalid current password' });

      updates.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthday: true,
        address: true,
        profilePicture: true,
        createdAt: true,
        role: { select: { name: true, permissions: true } }
      }
    });

    res.json({
      ...updated,
      role: {
        name: updated.role.name,
        permissions: updated.role.permissions
      }
    });
  } catch (err) {
    console.error('❌ PATCH /users/profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔒 Protected route: GET user by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid user ID' });

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        profilePicture: true,
        lastSeen: true,
        role: { select: { name: true } },
        philanthropy: {
          select: {
            id: true,
            date: true,
            hours: true,
            organization: true,
            notes: true
          }
        },
        duties: {
          select: {
            description: true,
            dueDate: true,
            completed: true
          }
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'Member not found' });

    const totalHours = user.philanthropy.reduce((sum, log) => sum + log.hours, 0);

    res.json({ ...user, totalHours });
  } catch (err) {
    console.error('❌ GET /users/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Permanently delete the authenticated user (with optional avatar file cleanup).
router.delete('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch the user, including their profilePicture filename (if any)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePicture: true },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 1. Delete the avatar file from disk (if exists)
    if (user.profilePicture) {
      const uploadDir = path.resolve('uploads');
      const avatarPath = path.join(uploadDir, user.profilePicture);
      if (fs.existsSync(avatarPath)) {
        try {
          fs.unlinkSync(avatarPath);
        } catch (fsErr) {
          console.warn('Could not delete avatar file:', fsErr);
          // Continue even if the file deletion fails
        }
      }
    }

    // 2. Delete the user record (cascading will remove related data, as specified)
    await prisma.user.delete({ where: { id: userId } });

    // 3. Send 204 No Content
    return res.sendStatus(204);
  } catch (err) {
    console.error('❌ DELETE /users/profile error:', err);
    return res.status(500).json({ error: 'Failed to delete user account' });
  }
});

export default router;
