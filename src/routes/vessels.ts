import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();

// Get all vessels for user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const vessels = await prisma.vessel.findMany({
      where: { userId: req.userId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { seatimeEntries: true },
        },
      },
    });

    res.json(vessels);
  } catch (err) {
    next(err);
  }
});

// Get single vessel
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const vessel = await prisma.vessel.findFirst({
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

    if (!vessel) {
      throw createError('Vessel not found', 404);
    }

    res.json(vessel);
  } catch (err) {
    next(err);
  }
});

// Create vessel
router.post('/', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, imoNumber, vesselType, flag, grossTonnage } = req.body;

    if (!name) {
      throw createError('Vessel name is required', 400);
    }

    // Check for duplicate
    const existing = await prisma.vessel.findFirst({
      where: {
        userId: req.userId,
        name: name.trim(),
      },
    });

    if (existing) {
      throw createError('A vessel with this name already exists', 409);
    }

    const vessel = await prisma.vessel.create({
      data: {
        userId: req.userId!,
        name: name.trim(),
        imoNumber: imoNumber?.trim() || null,
        vesselType: vesselType?.trim() || null,
        flag: flag?.trim() || null,
        grossTonnage: grossTonnage ? parseInt(grossTonnage) : null,
      },
    });

    res.status(201).json(vessel);
  } catch (err) {
    next(err);
  }
});

// Update vessel
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, imoNumber, vesselType, flag, grossTonnage } = req.body;

    // Check ownership
    const existing = await prisma.vessel.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!existing) {
      throw createError('Vessel not found', 404);
    }

    // Check for duplicate name
    if (name && name.trim() !== existing.name) {
      const duplicate = await prisma.vessel.findFirst({
        where: {
          userId: req.userId,
          name: name.trim(),
          id: { not: req.params.id },
        },
      });

      if (duplicate) {
        throw createError('A vessel with this name already exists', 409);
      }
    }

    const vessel = await prisma.vessel.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() || existing.name,
        imoNumber: imoNumber !== undefined ? (imoNumber?.trim() || null) : existing.imoNumber,
        vesselType: vesselType !== undefined ? (vesselType?.trim() || null) : existing.vesselType,
        flag: flag !== undefined ? (flag?.trim() || null) : existing.flag,
        grossTonnage: grossTonnage !== undefined ? (grossTonnage ? parseInt(grossTonnage) : null) : existing.grossTonnage,
      },
    });

    res.json(vessel);
  } catch (err) {
    next(err);
  }
});

// Delete vessel
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    // Check ownership
    const existing = await prisma.vessel.findFirst({
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
      throw createError('Vessel not found', 404);
    }

    if (existing._count.seatimeEntries > 0) {
      throw createError(
        `Cannot delete vessel with ${existing._count.seatimeEntries} associated seatime entries`,
        409
      );
    }

    await prisma.vessel.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
