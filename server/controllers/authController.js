import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const { JWT_SECRET, JWT_EXPIRES_IN } = process.env

export async function register(req, res, next) {
  try {
    const { email, password, name } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: "Email already in use" })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { email, passwordHash, name }
    })

    return res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    })
  } catch (err) {
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthday: true,
        address: true,           // ✅ added
        profilePicture: true,    // ✅ added
        createdAt: true,
        passwordHash: true,
        role: {
          select: {
            name: true,
            permissions: true
          }
        }
      }
    })

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN || "7d" }
    )

    // ✅ Send full user details including address and profilePicture
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        birthday: user.birthday,
        address: user.address,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        role: {
          name: user.role?.name,
          permissions: user.role?.permissions || []
        }
      }
    })
  } catch (err) {
    next(err)
  }
}
