// src/middleware/auth.js

import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  throw new Error('❌ JWT_SECRET is not set in .env');
}

export default async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const userId = payload.id;
  if (!userId) {
    return res.status(401).json({ error: 'Invalid token payload' });
  }

  try {
    // FETCH userRoles → role.permissions for ALL assigned roles
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
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

    if (!userRecord) {
      return res.status(401).json({ error: 'User not found (maybe deleted)' });
    }

    // Update lastSeen timestamp
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeen: new Date() },
    });

    // Flatten roles → array of role objects
    const rolesArray = userRecord.userRoles.map((ur) => ur.role);

    // Flatten permissions (dedupe by Set)
    const permissionsSet = new Set();
    rolesArray.forEach((role) => {
      if (Array.isArray(role.permissions)) {
        role.permissions.forEach((perm) => permissionsSet.add(perm));
      }
    });
    const permissions = Array.from(permissionsSet);

    req.user = {
      id: userRecord.id,
      email: userRecord.email,
      roles: rolesArray,
      permissions,
    };

    next();
  } catch (err) {
    console.error('❌ Auth middleware failed:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
