import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();

// Get all companies for user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const companies = await prisma.company.findMany({
      where: { userId: req.userId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { seatimeEntries: true },
        },
      },
    });

    res.json(companies);
  } catch (err) {
    next(err);
  }
});

// Get single company
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const company = await prisma.company.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        _count: {
          select: { seatimeEntries: true },
        },
      },
    });

    if (!company) {
      throw createError('Company not found', 404);
    }

    res.json(company);
  } catch (err) {
    next(err);
  }
});

// Create company
router.post('/', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, address, country } = req.body;

    if (!name) {
      throw createError('Company name is required', 400);
    }

    // Check for duplicate
    const existing = await prisma.company.findFirst({
      where: {
        userId: req.userId,
        name: name.trim(),
      },
    });

    if (existing) {
      throw createError('A company with this name already exists', 409);
    }

    const company = await prisma.company.create({
      data: {
        userId: req.userId!,
        name: name.trim(),
        address: address?.trim() || null,
        country: country?.trim() || null,
      },
    });

    res.status(201).json(company);
  } catch (err) {
    next(err);
  }
});

// Update company
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, address, country } = req.body;

    // Check ownership
    const existing = await prisma.company.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!existing) {
      throw createError('Company not found', 404);
    }

    // Check for duplicate name
    if (name && name.trim() !== existing.name) {
      const duplicate = await prisma.company.findFirst({
        where: {
          userId: req.userId,
          name: name.trim(),
          id: { not: req.params.id },
        },
      });

      if (duplicate) {
        throw createError('A company with this name already exists', 409);
      }
    }

    const company = await prisma.company.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() || existing.name,
        address: address !== undefined ? (address?.trim() || null) : existing.address,
        country: country !== undefined ? (country?.trim() || null) : existing.country,
      },
    });

    res.json(company);
  } catch (err) {
    next(err);
  }
});

// Delete company
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    // Check ownership
    const existing = await prisma.company.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        _count: {
          select: { seatimeEntries: true },
        },
      },
    });

    if (!existing) {
      throw createError('Company not found', 404);
    }

    if (existing._count.seatimeEntries > 0) {
      throw createError(
        `Cannot delete company with ${existing._count.seatimeEntries} associated seatime entries`,
        409
      );
    }

    await prisma.company.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
