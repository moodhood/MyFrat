// server/routes/roles.js

import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/roles
 * Returns a list of all roles (including permissions).
 * Only users with “manage_roles” may call this.
 */
router.get(
  '/',
  authMiddleware,
  authorize('manage_roles'),
  async (_req, res) => {
    try {
      const roles = await prisma.role.findMany({
        select: { 
          id: true, 
          name: true, 
          displayName: true,
          permissions: true 
        },
        orderBy: { displayName: 'asc' },
      });
      return res.json(roles);
    } catch (err) {
      console.error('Error fetching roles:', err);
      return res.status(500).json({ error: 'Unable to fetch roles' });
    }
  }
);

/**
 * PATCH /api/roles/:id
 * Update a role’s displayName or permissions array.
 * Only users with “manage_roles” may call this.
 * Body: { displayName?: string, permissions?: string[] }
 */
router.patch(
  '/:id',
  authMiddleware,
  authorize('manage_roles'),
  async (req, res) => {
    const roleId = parseInt(req.params.id, 10);
    const { displayName, permissions } = req.body;

    if (isNaN(roleId)) {
      return res.status(400).json({ error: 'Invalid role ID' });
    }
    if (
      displayName !== undefined &&
      (typeof displayName !== 'string' || displayName.trim() === '')
    ) {
      return res
        .status(400)
        .json({ error: 'displayName must be a non-empty string' });
    }
    if (
      permissions !== undefined &&
      (!Array.isArray(permissions) ||
        permissions.some((p) => typeof p !== 'string'))
    ) {
      return res
        .status(400)
        .json({ error: 'permissions must be an array of strings' });
    }

    try {
      // Check that role exists
      const existing = await prisma.role.findUnique({
        where: { id: roleId },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Role not found' });
      }

      const updateData = {};
      if (displayName !== undefined) updateData.displayName = displayName;
      if (permissions !== undefined) updateData.permissions = permissions;

      const updated = await prisma.role.update({
        where: { id: roleId },
        data: updateData,
        select: {
          id: true,
          name: true,
          displayName: true,
          permissions: true,
        },
      });

      return res.json(updated);
    } catch (err) {
      console.error('Error updating role:', err);
      if (err.code === 'P2002') {
        // Unique constraint on displayName or name
        return res.status(409).json({ error: 'displayName already in use' });
      }
      return res.status(500).json({ error: 'Failed to update role' });
    }
  }
);

export default router;
