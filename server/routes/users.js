import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!req.user?.id) {
      return cb(new Error("User ID missing in auth middleware"));
    }
    const filename = `user-${req.user.id}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WEBP images are allowed"));
    }
    cb(null, true);
  },
});

// Custom error handler for multer-specific issues
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes("Only JPG")) {
    console.error("❌ Multer error:", err.message);
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

router.patch(
  "/profile",
  authMiddleware,
  upload.single("profilePicture"),
  multerErrorHandler,
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
          name: true,
          email: true,
          phone: true,
          birthday: true,
          address: true,
          profilePicture: true,
          passwordHash: true, // ✅ Important fix
          role: {
            select: {
              name: true,
              permissions: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (req.file) {
        if (user.profilePicture) {
          const oldPath = path.join(uploadDir, user.profilePicture);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
        updates.profilePicture = req.file.filename;
        console.log("📁 Uploaded profile picture:", req.file.filename);
      }

      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: "Current password required" });
        }
        if (newPassword !== confirmPassword) {
          return res.status(400).json({ error: "New passwords do not match" });
        }

        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
          return res.status(401).json({ error: "Invalid current password" });
        }

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
          role: {
            select: {
              name: true,
              permissions: true,
            },
          },
        },
      });

      return res.status(200).json({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        birthday: updated.birthday,
        address: updated.address,
        profilePicture: updated.profilePicture,
        createdAt: updated.createdAt,
        role: {
          name: updated.role.name,
          permissions: updated.role.permissions,
        },
      });
    } catch (err) {
      console.error("❌ PATCH /profile error:", {
        message: err.message,
        stack: err.stack,
      });

      try {
        res.status(500).json({ error: "Internal server error" });
      } catch (responseError) {
        console.error("❌ Failed to send error response:", responseError);
      }
    }
  }
);

export default router;
