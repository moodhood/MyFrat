// src/routes/users.js

import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage configuration for profile pictures
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!req.user?.id) {
      return cb(new Error('User ID missing in auth middleware'));
    }
    cb(null, `user-${req.user.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, and WEBP images are allowed'));
    }
    cb(null, true);
  },
});

/**
 * GET /api/users
 * Returns all users (with minimal fields & array of roles).
 * Also updates the requesting user’s lastSeen timestamp.
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Update lastSeen for the current user
    await prisma.user.update({
      where: { id: req.user.id },
      data: { lastSeen: new Date() },
    });

    // Fetch all users plus their roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        lastSeen: true,
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Format each user’s roles as an array
    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      profilePicture: u.profilePicture,
      lastSeen: u.lastSeen,
      roles: u.userRoles.map((ur) => ur.role),
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('❌ GET /api/users error:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/users/online
 * Returns users who have `lastSeen` within the past 2 minutes.
 */
router.get('/online', authMiddleware, async (req, res) => {
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const onlineUsers = await prisma.user.findMany({
      where: { lastSeen: { gte: twoMinutesAgo } },
      select: {
        id: true,
        name: true,
        profilePicture: true,
        lastSeen: true,
      },
      orderBy: { name: 'asc' },
    });
    return res.json(onlineUsers);
  } catch (err) {
    console.error('❌ GET /api/users/online error:', err);
    return res.status(500).json({ error: 'Failed to fetch online users' });
  }
});

/**
 * PATCH /api/users/profile
 * Update current user’s profile (basic fields, optional avatar upload, password).
 * Returns updated user (including `roles: [...]`).
 */
router.patch(
  '/profile',
  authMiddleware,
  upload.single('profilePicture'),
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        birthday,
        address,
        currentPassword,
        newPassword,
        confirmPassword,
      } = req.body;

      // Build up fields to update
      const updates = {};
      if (name) updates.name = name.trim();
      if (email) updates.email = email.trim().toLowerCase();
      if (phone) updates.phone = phone.trim();
      if (birthday) updates.birthday = new Date(birthday);
      if (address) updates.address = address.trim();

      // Fetch existing user
      const existingUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          passwordHash: true,
          profilePicture: true,
        },
      });
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Handle profile picture upload/replacement
      if (req.file) {
        if (existingUser.profilePicture) {
          const oldPath = path.join(uploadDir, existingUser.profilePicture);
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
            } catch (fsErr) {
              console.warn('⚠️ Could not delete old profile picture:', fsErr);
            }
          }
        }
        updates.profilePicture = req.file.filename;
      }

      // Handle password change
      if (newPassword) {
        if (!currentPassword) {
          return res
            .status(400)
            .json({ error: 'Current password is required to change password' });
        }
        if (newPassword !== confirmPassword) {
          return res.status(400).json({ error: 'New passwords do not match' });
        }
        const isValid = await bcrypt.compare(
          currentPassword,
          existingUser.passwordHash
        );
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid current password' });
        }
        updates.passwordHash = await bcrypt.hash(newPassword, 10);
      }

      // Perform the update
      const updatedUser = await prisma.user.update({
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

      // Format roles array for response
      const rolesArray = updatedUser.userRoles.map((ur) => ur.role);

      return res.json({ ...updatedUser, roles: rolesArray });
    } catch (err) {
      console.error('❌ PATCH /api/users/profile error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/users/:id
 * Fetch any user’s full profile (Member Profile). Returns array of roles.
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const userProfile = await prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        profilePicture: true,
        lastSeen: true,
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
        philanthropy: {
          select: {
            id: true,
            date: true,
            hours: true,
            organization: true,
            notes: true,
          },
        },
        duties: {
          select: {
            id: true,
            dueDate: true,
            done: true,
            duty: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            dueDate: 'asc',
          },
        },
      },
    });

    if (!userProfile) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const totalHours = userProfile.philanthropy.reduce(
      (sum, log) => sum + log.hours,
      0
    );
    const rolesArray = userProfile.userRoles.map((ur) => ur.role);

    return res.json({
      ...userProfile,
      roles: rolesArray,
      totalHours,
    });
  } catch (err) {
    console.error('❌ GET /api/users/:id error:', err);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PATCH /api/users/:id/roles
 * Replace the entire set of roles for a given user. Body: { roleIds: number[] }.
 * Only users with “assign_roles” permission may call this.
 */
router.patch('/:id/roles', authMiddleware, async (req, res) => {
  try {
    const targetUserId = Number(req.params.id);
    const { roleIds } = req.body;

    if (!Array.isArray(roleIds)) {
      return res.status(400).json({ error: 'roleIds must be an array' });
    }
    if (!req.user.permissions.includes('assign_roles')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Verify each role exists
    const rolesFound = await prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true },
    });
    if (rolesFound.length !== roleIds.length) {
      return res.status(404).json({ error: 'One or more roles not found' });
    }

    // Delete all existing UserRole rows for that user
    await prisma.userRole.deleteMany({
      where: { userId: targetUserId },
    });

    // Create new UserRole entries
    const createData = roleIds.map((rid) => ({
      userId: targetUserId,
      roleId: rid,
    }));
    await prisma.userRole.createMany({
      data: createData,
      skipDuplicates: true,
    });

    // Return updated user with roles
    const updatedUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
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

    const rolesArray = updatedUser.userRoles.map((ur) => ur.role);
    return res.json({ ...updatedUser, roles: rolesArray });
  } catch (err) {
    console.error('❌ PATCH /api/users/:id/roles error:', err);
    return res.status(500).json({ error: 'Failed to update roles' });
  }
});

/**
 * DELETE /api/users/profile
 * Permanently delete the authenticated user & clean up avatar.
 */
router.delete('/profile', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Fetch to get existing avatar filename
    const userRecord = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { profilePicture: true },
    });
    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete avatar file
    if (userRecord.profilePicture) {
      const avatarPath = path.join(uploadDir, userRecord.profilePicture);
      if (fs.existsSync(avatarPath)) {
        try {
          fs.unlinkSync(avatarPath);
        } catch (fsErr) {
          console.warn('⚠️ Could not delete avatar:', fsErr);
        }
      }
    }

    // Delete user (cascades to UserRole, duties, logs, etc.)
    await prisma.user.delete({ where: { id: currentUserId } });

    return res.sendStatus(204);
  } catch (err) {
    console.error('❌ DELETE /api/users/profile error:', err);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
