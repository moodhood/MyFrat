// server/routes/documents.js

import express from 'express';
import multer from 'multer';
import path from 'path';
import { unlink } from 'fs/promises';
import libre from 'libreoffice-convert';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Only allow these extensions:
const ALLOWED_EXT = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.png',
  '.jpg',
  '.jpeg',
  '.mp4',
  '.mov',
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) =>
    cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return cb(new Error(`Unsupported file type: ${ext}`));
    }
    cb(null, true);
  },
});

// GET /api/documents?folderId=:id — list documents
router.get('/', authMiddleware, async (req, res) => {
  try {
    let folderId = null;
    if (req.query.folderId != null) {
      folderId = parseInt(req.query.folderId, 10);
      if (isNaN(folderId)) {
        return res.status(400).json({ error: 'Invalid folderId' });
      }
    }

    // No `select` here, so `pdfUrl` comes along automatically
    const docs = await prisma.document.findMany({
      where: { folderId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(docs);
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ error: 'Unable to fetch documents' });
  }
});

// POST /api/documents — upload a new document (and convert Office → PDF)
router.post(
  '/',
  authMiddleware,
  upload.single('file'),
  async (req, res) => {
    try {
      // Only allow users with "manage_documents"
      if (!req.user.permissions.includes('manage_documents')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
      }

      const { category } = req.body;
      let folderId = null;
      if (req.body.folderId != null) {
        const fid = parseInt(req.body.folderId, 10);
        if (isNaN(fid)) {
          return res.status(400).json({ error: 'Invalid folderId' });
        }
        // Optional: verify the folder actually exists
        const folder = await prisma.folder.findUnique({ where: { id: fid } });
        if (!folder) {
          return res.status(400).json({ error: 'Target folder not found' });
        }
        folderId = fid;
      }

      // Build the original file URL
      const originalUrl = `/uploads/${req.file.filename}`;
      let pdfUrl = null;

      // Check if it's an Office file that we want to convert to PDF
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext)) {
        try {
          // Read the file into a buffer
          const inputPath = path.resolve('uploads', req.file.filename);
          const fileBuffer = await fsReadFile(inputPath);
          
          // Convert to PDF (LibreOffice must be installed on the server)
          const pdfBuffer = await new Promise((resolve, reject) => {
            libre.convert(fileBuffer, '.pdf', undefined, (err, done) => {
              if (err) return reject(err);
              resolve(done);
            });
          });

          // Write the PDF file next to the original
          const outputFilename = req.file.filename.replace(ext, '.pdf');
          const outputPath = path.resolve('uploads', outputFilename);
          await fsWriteFile(outputPath, pdfBuffer);

          pdfUrl = `/uploads/${outputFilename}`;
        } catch (convErr) {
          // If LibreOffice isn't installed, or conversion fails, just log and continue
          console.warn('Conversion to PDF failed:', convErr.message || convErr);
          // pdfUrl remains null
        }
      }

      // Create the DB record, including pdfUrl (or null)
      const doc = await prisma.document.create({
        data: {
          name: req.file.originalname,
          url: originalUrl,
          category: category?.trim() || null,
          folderId,
          pdfUrl,
        },
      });

      return res.status(201).json(doc);
    } catch (err) {
      console.error('Error uploading document:', err);
      if (err.message.startsWith('Unsupported file type')) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to upload document' });
    }
  }
);

// DELETE /api/documents/:id — remove a document + its PDF if present
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Only allow users with "manage_documents"
    if (!req.user.permissions.includes('manage_documents')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const docId = parseInt(req.params.id, 10);
    if (isNaN(docId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    // Fetch the document to obtain its URLs
    const doc = await prisma.document.findUnique({ where: { id: docId } });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete the DB record first
    await prisma.document.delete({ where: { id: docId } });

    // Attempt to delete the original file from disk
    const originalFilePath = path.resolve('uploads', path.basename(doc.url));
    try {
      await unlink(originalFilePath);
    } catch (fsErr) {
      console.warn('Could not delete original file from disk:', fsErr.message);
      // we don’t fail the entire request if unlink fails, since the DB row is already gone
    }

    // If we generated a PDF (pdfUrl is non-null), delete that too
    if (doc.pdfUrl) {
      const pdfFilePath = path.resolve('uploads', path.basename(doc.pdfUrl));
      try {
        await unlink(pdfFilePath);
      } catch (pdfErr) {
        console.warn('Could not delete PDF file from disk:', pdfErr.message);
      }
    }

    return res.status(204).send();
  } catch (err) {
    console.error('Error deleting document:', err);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;


// Helper functions to read/write with fs/promises
import { readFile as fsReadFile, writeFile as fsWriteFile } from 'fs/promises';
