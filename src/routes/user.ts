import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const {
      fullName,
      // STCW/MLC Seafarer Identification
      cdcNumber,
      licenseNumber,
      cocGrade,
      cocIssueDate,
      cocExpiryDate,
      issuingAuthority,
      nationality,
      dateOfBirth,
      placeOfBirth,
      // Medical Certificate
      medicalCertNumber,
      medicalCertIssue,
      medicalCertExpiry,
      // STCW Endorsements
      tankerEndorsement,
      // Settings
      timezone,
      renewalCycleStart,
      targetSeaDays,
      targetSeaHours,
    } = req.body;

    const updateData: Record<string, unknown> = {};

    // Basic profile
    if (fullName !== undefined) updateData.fullName = fullName;
    if (timezone !== undefined) updateData.timezone = timezone;

    // STCW/MLC Seafarer Identification
    if (cdcNumber !== undefined) updateData.cdcNumber = cdcNumber;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
    if (cocGrade !== undefined) updateData.cocGrade = cocGrade;
    if (cocIssueDate !== undefined) updateData.cocIssueDate = cocIssueDate ? new Date(cocIssueDate) : null;
    if (cocExpiryDate !== undefined) updateData.cocExpiryDate = cocExpiryDate ? new Date(cocExpiryDate) : null;
    if (issuingAuthority !== undefined) updateData.issuingAuthority = issuingAuthority;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (placeOfBirth !== undefined) updateData.placeOfBirth = placeOfBirth;

    // Medical Certificate
    if (medicalCertNumber !== undefined) updateData.medicalCertNumber = medicalCertNumber;
    if (medicalCertIssue !== undefined) updateData.medicalCertIssue = medicalCertIssue ? new Date(medicalCertIssue) : null;
    if (medicalCertExpiry !== undefined) updateData.medicalCertExpiry = medicalCertExpiry ? new Date(medicalCertExpiry) : null;

    // STCW Endorsements
    if (tankerEndorsement !== undefined) updateData.tankerEndorsement = tankerEndorsement;

    // Renewal cycle settings
    if (renewalCycleStart !== undefined) updateData.renewalCycleStart = renewalCycleStart ? new Date(renewalCycleStart) : null;
    if (targetSeaDays !== undefined) updateData.targetSeaDays = parseInt(targetSeaDays);
    if (targetSeaHours !== undefined) updateData.targetSeaHours = parseInt(targetSeaHours);

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
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
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Get dashboard stats
router.get('/dashboard', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        renewalCycleStart: true,
        targetSeaDays: true,
        targetSeaHours: true,
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Get date range for renewal cycle (last 5 years by default)
    const cycleStart = user.renewalCycleStart || new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);
    const now = new Date();

    // Get all entries in the cycle
    const entries = await prisma.seatimeEntry.findMany({
      where: {
        userId: req.userId,
        startAt: { gte: cycleStart },
        endAt: { lte: now },
      },
      include: {
        vessel: true,
        company: true,
      },
      orderBy: { startAt: 'desc' },
    });

    // Calculate totals
    const totalDays = entries.reduce((sum, e) => sum + e.computedDurationDays, 0);
    const totalHours = entries.reduce((sum, e) => sum + e.computedDurationHours, 0);
    const verifiedDays = entries.filter(e => e.isVerified).reduce((sum, e) => sum + e.computedDurationDays, 0);
    const verifiedHours = entries.filter(e => e.isVerified).reduce((sum, e) => sum + e.computedDurationHours, 0);

    // Group by year
    const byYear: Record<number, { days: number; hours: number; count: number }> = {};
    for (const entry of entries) {
      const year = new Date(entry.startAt).getFullYear();
      if (!byYear[year]) {
        byYear[year] = { days: 0, hours: 0, count: 0 };
      }
      byYear[year].days += entry.computedDurationDays;
      byYear[year].hours += entry.computedDurationHours;
      byYear[year].count += 1;
    }

    // Group by vessel
    const byVessel: Record<string, { name: string; days: number; hours: number; count: number }> = {};
    for (const entry of entries) {
      if (!byVessel[entry.vesselId]) {
        byVessel[entry.vesselId] = { name: entry.vessel.name, days: 0, hours: 0, count: 0 };
      }
      byVessel[entry.vesselId].days += entry.computedDurationDays;
      byVessel[entry.vesselId].hours += entry.computedDurationHours;
      byVessel[entry.vesselId].count += 1;
    }

    // Group by rank
    const byRank: Record<string, { days: number; hours: number; count: number }> = {};
    for (const entry of entries) {
      if (!byRank[entry.rank]) {
        byRank[entry.rank] = { days: 0, hours: 0, count: 0 };
      }
      byRank[entry.rank].days += entry.computedDurationDays;
      byRank[entry.rank].hours += entry.computedDurationHours;
      byRank[entry.rank].count += 1;
    }

    // Group by company
    const byCompany: Record<string, { name: string; days: number; hours: number; count: number }> = {};
    for (const entry of entries) {
      if (!byCompany[entry.companyId]) {
        byCompany[entry.companyId] = { name: entry.company.name, days: 0, hours: 0, count: 0 };
      }
      byCompany[entry.companyId].days += entry.computedDurationDays;
      byCompany[entry.companyId].hours += entry.computedDurationHours;
      byCompany[entry.companyId].count += 1;
    }

    // Progress toward goal
    const progressDays = Math.min((totalDays / user.targetSeaDays) * 100, 100);
    const progressHours = Math.min((totalHours / user.targetSeaHours) * 100, 100);

    res.json({
      cycleStart,
      cycleEnd: now,
      targetSeaDays: user.targetSeaDays,
      targetSeaHours: user.targetSeaHours,
      totalEntries: entries.length,
      totalDays: Math.round(totalDays * 100) / 100,
      totalHours: Math.round(totalHours * 100) / 100,
      verifiedDays: Math.round(verifiedDays * 100) / 100,
      verifiedHours: Math.round(verifiedHours * 100) / 100,
      unverifiedEntries: entries.filter(e => !e.isVerified).length,
      progressDays: Math.round(progressDays * 100) / 100,
      progressHours: Math.round(progressHours * 100) / 100,
      byYear,
      byVessel: Object.values(byVessel),
      byRank: Object.entries(byRank).map(([rank, data]) => ({ rank, ...data })),
      byCompany: Object.values(byCompany),
      recentEntries: entries.slice(0, 5),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
