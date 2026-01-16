import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();

// Register
router.post('/register', async (req: Request, res: Response, next) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      throw createError('Email, password, and full name are required', 400);
    }

    if (password.length < 6) {
      throw createError('Password must be at least 6 characters', 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw createError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        timezone: 'UTC',
        renewalCycleStart: new Date(),
        targetSeaDays: 365,
        targetSeaHours: 8760,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        // STCW/MLC fields
        cdcNumber: true,
        licenseNumber: true,
        cocGrade: true,
        cocIssueDate: true,
        cocExpiryDate: true,
        issuingAuthority: true,
        nationality: true,
        dateOfBirth: true,
        placeOfBirth: true,
        medicalCertNumber: true,
        medicalCertIssue: true,
        medicalCertExpiry: true,
        tankerEndorsement: true,
        // Settings
        timezone: true,
        renewalCycleStart: true,
        targetSeaDays: true,
        targetSeaHours: true,
        createdAt: true,
      },
    });

    const token = generateToken(user.id);

    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
});

// Login
router.post('/login', async (req: Request, res: Response, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw createError('Email and password are required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        // STCW/MLC fields
        cdcNumber: true,
        licenseNumber: true,
        cocGrade: true,
        cocIssueDate: true,
        cocExpiryDate: true,
        issuingAuthority: true,
        nationality: true,
        dateOfBirth: true,
        placeOfBirth: true,
        medicalCertNumber: true,
        medicalCertIssue: true,
        medicalCertExpiry: true,
        tankerEndorsement: true,
        // Settings
        timezone: true,
        renewalCycleStart: true,
        targetSeaDays: true,
        targetSeaHours: true,
        passwordHash: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw createError('Invalid credentials', 401);
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw createError('Invalid credentials', 401);
    }

    const token = generateToken(user.id);

    // Remove passwordHash from response
    const { passwordHash, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword, token });
  } catch (err) {
    next(err);
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        // STCW/MLC fields
        cdcNumber: true,
        licenseNumber: true,
        cocGrade: true,
        cocIssueDate: true,
        cocExpiryDate: true,
        issuingAuthority: true,
        nationality: true,
        dateOfBirth: true,
        placeOfBirth: true,
        medicalCertNumber: true,
        medicalCertIssue: true,
        medicalCertExpiry: true,
        stcwEndorsements: true,
        tankerEndorsement: true,
        // Settings
        timezone: true,
        renewalCycleStart: true,
        targetSeaDays: true,
        targetSeaHours: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
