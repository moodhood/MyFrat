import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  throw new Error('❌ JWT_SECRET is not set. Check your .env file.');
}

export default async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7); // Remove 'Bearer '

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const userId = payload.userId || payload.id;
  if (!userId) {
    return res.status(401).json({ error: 'Invalid token payload' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: {
          select: { permissions: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      permissions: user.role?.permissions || []
    };

    next();
  } catch (err) {
    console.error('❌ Error in auth middleware:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
