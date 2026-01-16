import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';
import {
  calculateDuration,
  checkOverlaps,
  validateEntry,
} from '../utils/seatimeCalculations.js';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'));
    }
  },
});

// Get all seatime entries with filters
router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { startDate, endDate, vesselId, companyId, rank, verified, limit = '100', offset = '0' } = req.query;

    const where: Record<string, unknown> = { userId: req.userId };

    if (startDate) {
      where.startAt = { ...(where.startAt as object || {}), gte: new Date(startDate as string) };
    }
    if (endDate) {
      where.endAt = { ...(where.endAt as object || {}), lte: new Date(endDate as string) };
    }
    if (vesselId) {
      where.vesselId = vesselId;
    }
    if (companyId) {
      where.companyId = companyId;
    }
    if (rank) {
      where.rank = { contains: rank };
    }
    if (verified !== undefined) {
      where.isVerified = verified === 'true';
    }

    const [entries, total] = await Promise.all([
      prisma.seatimeEntry.findMany({
        where,
        include: {
          vessel: true,
          company: true,
          attachments: true,
        },
        orderBy: { startAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.seatimeEntry.count({ where }),
    ]);

    // Calculate totals for filtered entries
    const allFiltered = await prisma.seatimeEntry.findMany({
      where,
      select: { computedDurationDays: true, computedDurationHours: true },
    });

    const totalDays = allFiltered.reduce((sum, e) => sum + e.computedDurationDays, 0);
    const totalHours = allFiltered.reduce((sum, e) => sum + e.computedDurationHours, 0);

    res.json({
      entries,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
      totals: {
        days: Math.round(totalDays * 100) / 100,
        hours: Math.round(totalHours * 100) / 100,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Get calendar entries (optimized for calendar view)
router.get('/calendar', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      throw createError('Year and month are required', 400);
    }

    const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
    const endDate = new Date(parseInt(year as string), parseInt(month as string), 0, 23, 59, 59);

    const entries = await prisma.seatimeEntry.findMany({
      where: {
        userId: req.userId,
        OR: [
          { startAt: { gte: startDate, lte: endDate } },
          { endAt: { gte: startDate, lte: endDate } },
          { AND: [{ startAt: { lte: startDate } }, { endAt: { gte: endDate } }] },
        ],
      },
      include: {
        vessel: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { startAt: 'asc' },
    });

    res.json(entries);
  } catch (err) {
    next(err);
  }
});

// Get single entry
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const entry = await prisma.seatimeEntry.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        vessel: true,
        company: true,
        attachments: true,
      },
    });

    if (!entry) {
      throw createError('Entry not found', 404);
    }

    res.json(entry);
  } catch (err) {
    next(err);
  }
});

// Create entry
router.post('/', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const {
      vesselId,
      companyId,
      rank,
      capacity,
      department,
      watchSchedule,
      startAt,
      endAt,
      // Nature of Service
      voyageType,
      tradingArea,
      cargoType,
      // Route
      departurePort,
      arrivalPort,
      route,
      // Service documentation
      serviceLetterNumber,
      dischargeBookPage,
      signoffReason,
      notes,
      forceOverlap,
      overlapReason,
    } = req.body;

    // Validate entry
    const validation = validateEntry(startAt, endAt, rank, vesselId, companyId);
    if (!validation.isValid) {
      throw createError(validation.errors.join(', '), 400);
    }

    // Calculate duration
    const duration = calculateDuration(startAt, endAt);

    // Check for overlaps
    const existingEntries = await prisma.seatimeEntry.findMany({
      where: { userId: req.userId },
      select: { id: true, startAt: true, endAt: true },
    });

    const overlapResult = checkOverlaps(
      { startAt: new Date(startAt), endAt: new Date(endAt) },
      existingEntries.map(e => ({
        id: e.id,
        startAt: e.startAt,
        endAt: e.endAt,
      }))
    );

    if (overlapResult.hasOverlap && !forceOverlap) {
      return res.status(409).json({
        error: 'This entry overlaps with existing entries',
        overlaps: overlapResult.overlappingEntries,
        requiresConfirmation: true,
      });
    }

    // Create entry
    const entry = await prisma.seatimeEntry.create({
      data: {
        userId: req.userId!,
        vesselId,
        companyId,
        rank,
        capacity: capacity || null,
        department: department || null,
        watchSchedule: watchSchedule || null,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        computedDurationHours: duration.totalHours,
        computedDurationDays: duration.totalDays,
        // Nature of Service
        voyageType: voyageType || null,
        tradingArea: tradingArea || null,
        cargoType: cargoType || null,
        // Route
        departurePort: departurePort || null,
        arrivalPort: arrivalPort || null,
        route: route || null,
        // Service documentation
        serviceLetterNumber: serviceLetterNumber || null,
        dischargeBookPage: dischargeBookPage || null,
        signoffReason: signoffReason || null,
        notes: notes || null,
        hasOverlapApproval: overlapResult.hasOverlap && forceOverlap,
        overlapReason: overlapResult.hasOverlap ? overlapReason : null,
      },
      include: {
        vessel: true,
        company: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        entryId: entry.id,
        action: 'CREATE',
        details: JSON.stringify({ entry }),
      },
    });

    res.status(201).json({
      entry,
      warnings: validation.warnings,
    });
  } catch (err) {
    next(err);
  }
});

// Update entry
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const {
      vesselId,
      companyId,
      rank,
      capacity,
      department,
      watchSchedule,
      startAt,
      endAt,
      // Nature of Service
      voyageType,
      tradingArea,
      cargoType,
      // Route
      departurePort,
      arrivalPort,
      route,
      // Service documentation
      serviceLetterNumber,
      dischargeBookPage,
      signoffReason,
      notes,
      forceOverlap,
      overlapReason,
    } = req.body;

    // Check ownership
    const existing = await prisma.seatimeEntry.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!existing) {
      throw createError('Entry not found', 404);
    }

    // Use existing values if not provided
    const finalVesselId = vesselId || existing.vesselId;
    const finalCompanyId = companyId || existing.companyId;
    const finalRank = rank || existing.rank;
    const finalStartAt = startAt ? new Date(startAt) : existing.startAt;
    const finalEndAt = endAt ? new Date(endAt) : existing.endAt;

    // Validate entry
    const validation = validateEntry(finalStartAt, finalEndAt, finalRank, finalVesselId, finalCompanyId);
    if (!validation.isValid) {
      throw createError(validation.errors.join(', '), 400);
    }

    // Calculate duration
    const duration = calculateDuration(finalStartAt, finalEndAt);

    // Check for overlaps (excluding current entry)
    const existingEntries = await prisma.seatimeEntry.findMany({
      where: { userId: req.userId },
      select: { id: true, startAt: true, endAt: true },
    });

    const overlapResult = checkOverlaps(
      { startAt: finalStartAt, endAt: finalEndAt },
      existingEntries.map(e => ({
        id: e.id,
        startAt: e.startAt,
        endAt: e.endAt,
      })),
      req.params.id
    );

    if (overlapResult.hasOverlap && !forceOverlap && !existing.hasOverlapApproval) {
      return res.status(409).json({
        error: 'This entry overlaps with existing entries',
        overlaps: overlapResult.overlappingEntries,
        requiresConfirmation: true,
      });
    }

    // Update entry
    const entry = await prisma.seatimeEntry.update({
      where: { id: req.params.id },
      data: {
        vesselId: finalVesselId,
        companyId: finalCompanyId,
        rank: finalRank,
        capacity: capacity !== undefined ? capacity : existing.capacity,
        department: department !== undefined ? department : existing.department,
        watchSchedule: watchSchedule !== undefined ? watchSchedule : existing.watchSchedule,
        startAt: finalStartAt,
        endAt: finalEndAt,
        computedDurationHours: duration.totalHours,
        computedDurationDays: duration.totalDays,
        // Nature of Service
        voyageType: voyageType !== undefined ? voyageType : existing.voyageType,
        tradingArea: tradingArea !== undefined ? tradingArea : existing.tradingArea,
        cargoType: cargoType !== undefined ? cargoType : existing.cargoType,
        // Route
        departurePort: departurePort !== undefined ? departurePort : existing.departurePort,
        arrivalPort: arrivalPort !== undefined ? arrivalPort : existing.arrivalPort,
        route: route !== undefined ? route : existing.route,
        // Service documentation
        serviceLetterNumber: serviceLetterNumber !== undefined ? serviceLetterNumber : existing.serviceLetterNumber,
        dischargeBookPage: dischargeBookPage !== undefined ? dischargeBookPage : existing.dischargeBookPage,
        signoffReason: signoffReason !== undefined ? signoffReason : existing.signoffReason,
        notes: notes !== undefined ? notes : existing.notes,
        hasOverlapApproval: overlapResult.hasOverlap || existing.hasOverlapApproval,
        overlapReason: overlapResult.hasOverlap ? (overlapReason || existing.overlapReason) : existing.overlapReason,
      },
      include: {
        vessel: true,
        company: true,
        attachments: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        entryId: entry.id,
        action: 'UPDATE',
        details: JSON.stringify({ before: existing, after: entry }),
      },
    });

    res.json({
      entry,
      warnings: validation.warnings,
    });
  } catch (err) {
    next(err);
  }
});

// Verify entry (STCW/MLC compliant verification)
router.post('/:id/verify', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { verifiedBy, verifierTitle, verifierEmail, companyStamp } = req.body;

    // Check ownership
    const existing = await prisma.seatimeEntry.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!existing) {
      throw createError('Entry not found', 404);
    }

    const entry = await prisma.seatimeEntry.update({
      where: { id: req.params.id },
      data: {
        isVerified: true,
        verifiedBy: verifiedBy || null,
        verifierTitle: verifierTitle || null,
        verifierEmail: verifierEmail || null,
        verifiedAt: new Date(),
        companyStamp: companyStamp || false,
      },
      include: {
        vessel: true,
        company: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        entryId: entry.id,
        action: 'VERIFY',
        details: JSON.stringify({ verifiedBy, verifierTitle, verifierEmail, companyStamp }),
      },
    });

    res.json(entry);
  } catch (err) {
    next(err);
  }
});

// Unverify entry
router.post('/:id/unverify', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    // Check ownership
    const existing = await prisma.seatimeEntry.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!existing) {
      throw createError('Entry not found', 404);
    }

    const entry = await prisma.seatimeEntry.update({
      where: { id: req.params.id },
      data: {
        isVerified: false,
        verifiedBy: null,
        verifiedAt: null,
      },
      include: {
        vessel: true,
        company: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        entryId: entry.id,
        action: 'UNVERIFY',
      },
    });

    res.json(entry);
  } catch (err) {
    next(err);
  }
});

// Delete entry
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    // Check ownership
    const existing = await prisma.seatimeEntry.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: { attachments: true },
    });

    if (!existing) {
      throw createError('Entry not found', 404);
    }

    // Create audit log before deletion
    await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        action: 'DELETE',
        details: JSON.stringify({ deletedEntry: existing }),
      },
    });

    // Delete entry (attachments will cascade)
    await prisma.seatimeEntry.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Upload attachment
router.post('/:id/attachments', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response, next) => {
  try {
    // Check ownership
    const existing = await prisma.seatimeEntry.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!existing) {
      throw createError('Entry not found', 404);
    }

    if (!req.file) {
      throw createError('No file uploaded', 400);
    }

    const attachment = await prisma.attachment.create({
      data: {
        entryId: req.params.id,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        storagePath: req.file.path,
        fileSize: req.file.size,
      },
    });

    res.status(201).json(attachment);
  } catch (err) {
    next(err);
  }
});

// Delete attachment
router.delete('/:id/attachments/:attachmentId', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    // Check ownership
    const existing = await prisma.seatimeEntry.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!existing) {
      throw createError('Entry not found', 404);
    }

    const attachment = await prisma.attachment.findFirst({
      where: {
        id: req.params.attachmentId,
        entryId: req.params.id,
      },
    });

    if (!attachment) {
      throw createError('Attachment not found', 404);
    }

    await prisma.attachment.delete({
      where: { id: req.params.attachmentId },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Import CSV
router.post('/import', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response, next) => {
  try {
    if (!req.file) {
      throw createError('No file uploaded', 400);
    }

    // Read CSV file
    const fs = await import('fs/promises');
    const content = await fs.readFile(req.file.path, 'utf-8');
    const lines = content.trim().split('\n');

    if (lines.length < 2) {
      throw createError('CSV file must have headers and at least one data row', 400);
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        // Required fields
        if (!row['vessel'] || !row['company'] || !row['rank'] || !row['start'] || !row['end']) {
          throw new Error(`Row ${i}: Missing required fields`);
        }

        // Find or create vessel
        let vessel = await prisma.vessel.findFirst({
          where: { userId: req.userId, name: row['vessel'] },
        });
        if (!vessel) {
          vessel = await prisma.vessel.create({
            data: { userId: req.userId!, name: row['vessel'] },
          });
        }

        // Find or create company
        let company = await prisma.company.findFirst({
          where: { userId: req.userId, name: row['company'] },
        });
        if (!company) {
          company = await prisma.company.create({
            data: { userId: req.userId!, name: row['company'] },
          });
        }

        const startAt = new Date(row['start']);
        const endAt = new Date(row['end']);
        const duration = calculateDuration(startAt, endAt);

        await prisma.seatimeEntry.create({
          data: {
            userId: req.userId!,
            vesselId: vessel.id,
            companyId: company.id,
            rank: row['rank'],
            watchSchedule: row['watch'] || null,
            startAt,
            endAt,
            computedDurationHours: duration.totalHours,
            computedDurationDays: duration.totalDays,
            departurePort: row['departure'] || null,
            arrivalPort: row['arrival'] || null,
            route: row['route'] || null,
            notes: row['notes'] || null,
          },
        });

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push((err as Error).message);
      }
    }

    // Clean up uploaded file
    const fs2 = await import('fs/promises');
    await fs2.unlink(req.file.path);

    res.json(results);
  } catch (err) {
    next(err);
  }
});

export default router;
