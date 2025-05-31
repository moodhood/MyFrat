// server/routes/folders.js

import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/folders — list “root” folders & documents
router.get('/', authMiddleware, async (req, res) => {
  try {
    const parentId = null;
    const [folders, documents] = await Promise.all([
      prisma.folder.findMany({
        where: { parentId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.document.findMany({
        where: { folderId: parentId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return res.json({ folders, documents });
  } catch (err) {
    console.error('Error listing root contents:', err);
    return res.status(500).json({ error: 'Failed to fetch contents' });
  }
});

// GET /api/folders/:id — list subfolders & documents
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid folder ID' });
    }

    const [folders, documents] = await Promise.all([
      prisma.folder.findMany({
        where: { parentId: id },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.document.findMany({
        where: { folderId: id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.json({ folders, documents });
  } catch (err) {
    console.error('Error listing folder contents:', err);
    return res.status(500).json({ error: 'Failed to fetch folder contents' });
  }
});

// POST /api/folders — create a new folder
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Only an officer (or role with manage_folders) may create
    if (!req.user.permissions.includes('manage_folders')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { name, parentId } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    let pid = null;
    if (parentId !== undefined && parentId !== null) {
      pid = parseInt(parentId, 10);
      if (isNaN(pid)) {
        return res.status(400).json({ error: 'Invalid parentId' });
      }
      const parent = await prisma.folder.findUnique({ where: { id: pid } });
      if (!parent) {
        return res.status(400).json({ error: 'Parent folder not found' });
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        parentId: pid,
        createdBy: req.user.id,
      },
    });
    return res.status(201).json(folder);
  } catch (err) {
    console.error('Error creating folder:', err);
    return res.status(500).json({ error: 'Failed to create folder' });
  }
});

// DELETE /api/folders/:id — delete only if empty
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Only an officer (or role with manage_folders) may delete
    if (!req.user.permissions.includes('manage_folders')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid folder ID' });
    }

    // Check for subfolders or documents
    const [subCount, docCount] = await Promise.all([
      prisma.folder.count({ where: { parentId: id } }),
      prisma.document.count({ where: { folderId: id } }),
    ]);

    if (subCount > 0 || docCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete non-empty folder. Remove all items first.',
      });
    }

    await prisma.folder.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error('Error deleting folder:', err);
    return res.status(500).json({ error: 'Failed to delete folder' });
  }
});

export default router;
