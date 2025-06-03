// server/index.js

import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { PrismaClient } from "@prisma/client";

import authRouter from "./routes/auth.js";
import userRouter from "./routes/users.js";
import eventRouter from "./routes/events.js";
import dutyRouter from "./routes/duties.js";
import philanthropyRouter from "./routes/philanthropy.js";
import motionRouter from "./routes/motions.js";
import dashboardRouter from "./routes/dashboard.js";
import folderRouter from "./routes/folders.js";
import documentsRouter from "./routes/documents.js";
import rolesRouter from "./routes/roles.js";

import authMiddleware from "./middleware/auth.js";
import errorHandler from "./middleware/errorHandler.js";

// Import the duty scheduler so it starts on server launch
import "./utils/dutyScheduler.js";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3001";

// 1. Enable CORS for our front-end
app.use(cors({ origin: CLIENT_ORIGIN }));

// 2. Parse JSON request bodies
app.use(express.json());

// 3. Serve uploaded files statically
app.use("/uploads", express.static(path.resolve("uploads")));

// 4. Public authentication routes (no token required)
app.use("/api/auth", authRouter);

// 5. Protected routes (require a valid JWT)
app.use("/api/users", authMiddleware, userRouter);
app.use("/api/events", authMiddleware, eventRouter);
app.use("/api/duties", authMiddleware, dutyRouter);
app.use("/api/philanthropy", authMiddleware, philanthropyRouter);
app.use("/api/motions", authMiddleware, motionRouter);
app.use("/api/dashboard", authMiddleware, dashboardRouter);

// 6. File‐system routes (folders first, then documents)
app.use("/api/folders", authMiddleware, folderRouter);
app.use("/api/documents", authMiddleware, documentsRouter);
app.use("/api/roles", authMiddleware, rolesRouter);

// 7. Session‐restore endpoint (alternative to /api/auth/me)
app.get("/api/auth/me", authMiddleware, async (req, res, next) => {
  try {
    const userId = Number(req.user.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        userRoles: {
          select: {
            role: {
              select: {
                name: true,
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Flatten roles array
    const rolesArray = user.userRoles.map((ur) => ({
      name: ur.role.name,
      permissions: ur.role.permissions,
    }));

    // Aggregate all permissions from roles
    const permissionsSet = new Set();
    rolesArray.forEach((role) => {
      role.permissions.forEach((perm) => permissionsSet.add(perm));
    });
    const permissions = Array.from(permissionsSet);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      roles: rolesArray,
      permissions,
    });
  } catch (err) {
    next(err);
  }
});

// 8. 404 handler for any unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// 9. Global error handler
app.use(errorHandler);

// 10. Start listening
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});

// Optional: disconnect Prisma when process is terminated
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
