import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { format, differenceInDays } from 'date-fns';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const prisma = new PrismaClient();

// Generate unique document reference number
function generateDocumentReference(): string {
  const date = format(new Date(), 'yyyyMMdd');
  const shortId = uuidv4().substring(0, 8).toUpperCase();
  return `SSR-${date}-${shortId}`;
}

// Generate PDF report - STCW Compliant Sea Service Record Format
router.post('/pdf', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { startDate, endDate, entryIds, title, format: reportFormat } = req.body;
    const documentRef = generateDocumentReference();

    // Get comprehensive user info for STCW compliance
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        fullName: true,
        licenseNumber: true,
        email: true,
        cdcNumber: true,
        cocGrade: true,
        cocIssueDate: true,
        cocExpiryDate: true,
        issuingAuthority: true,
        nationality: true,
        dateOfBirth: true,
        placeOfBirth: true,
        medicalCertNumber: true,
        medicalCertExpiry: true,
        tankerEndorsement: true,
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Build query
    const where: Record<string, unknown> = { userId: req.userId };

    if (entryIds && entryIds.length > 0) {
      where.id = { in: entryIds };
    } else {
      if (startDate) {
        where.startAt = { gte: new Date(startDate) };
      }
      if (endDate) {
        where.endAt = { lte: new Date(endDate) };
      }
    }

    // Get entries with full vessel and company details
    const entries = await prisma.seatimeEntry.findMany({
      where,
      include: {
        vessel: true,
        company: true,
      },
      orderBy: { startAt: 'asc' },
    });

    if (entries.length === 0) {
      throw createError('No entries found for the specified criteria', 404);
    }

    // Calculate totals
    const totalDays = entries.reduce((sum, e) => sum + e.computedDurationDays, 0);
    const totalHours = entries.reduce((sum, e) => sum + e.computedDurationHours, 0);
    const verifiedDays = entries.filter(e => e.isVerified).reduce((sum, e) => sum + e.computedDurationDays, 0);
    const verifiedEntries = entries.filter(e => e.isVerified).length;

    // Group by year
    const byYear: Record<number, { days: number; hours: number }> = {};
    for (const entry of entries) {
      const year = new Date(entry.startAt).getFullYear();
      if (!byYear[year]) {
        byYear[year] = { days: 0, hours: 0 };
      }
      byYear[year].days += entry.computedDurationDays;
      byYear[year].hours += entry.computedDurationHours;
    }

    // Create PDF - A4 Portrait
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      info: {
        Title: 'Sea Service Record',
        Author: user.fullName,
        Subject: 'STCW Compliant Sea Service Documentation',
        Keywords: 'sea service, STCW, maritime, seatime',
        Creator: 'Regulation Manifest',
      },
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="sea-service-record-${format(new Date(), 'yyyy-MM-dd')}.pdf"`);

    doc.pipe(res);

    // ============================================
    // HEADER - Official Sea Service Record Format
    // ============================================
    doc.fontSize(16).font('Helvetica-Bold').text('SEA SERVICE RECORD', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('(In accordance with STCW Convention Regulation I/2)', { align: 'center' });
    doc.moveDown(0.3);

    // Document Reference Number (required for official records)
    doc.fontSize(8).font('Helvetica');
    doc.text(`Document Reference: ${documentRef}`, 40, doc.y, { align: 'right' });
    doc.moveDown(0.5);

    // Horizontal line
    doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(1).stroke();
    doc.moveDown(0.8);

    // ============================================
    // SECTION 1: SEAFARER PARTICULARS (STCW Required)
    // ============================================
    doc.fontSize(11).font('Helvetica-Bold').text('SECTION 1: SEAFARER PARTICULARS');
    doc.moveDown(0.3);

    // Two-column layout for seafarer details
    const leftCol = 40;
    const rightCol = 300;
    let currentY = doc.y;

    doc.fontSize(9).font('Helvetica');

    // Left column
    doc.text(`Full Name: ${user.fullName}`, leftCol, currentY);
    currentY += 14;
    doc.text(`Nationality: ${user.nationality || '________________'}`, leftCol, currentY);
    currentY += 14;
    doc.text(`Date of Birth: ${user.dateOfBirth ? format(user.dateOfBirth, 'dd/MM/yyyy') : '________________'}`, leftCol, currentY);
    currentY += 14;
    doc.text(`Place of Birth: ${user.placeOfBirth || '________________'}`, leftCol, currentY);

    // Right column
    currentY = doc.y - 56;
    doc.text(`CDC/Seafarer ID: ${user.cdcNumber || '________________'}`, rightCol, currentY);
    currentY += 14;
    doc.text(`CoC Number: ${user.licenseNumber || '________________'}`, rightCol, currentY);
    currentY += 14;
    doc.text(`CoC Grade: ${user.cocGrade || '________________'}`, rightCol, currentY);
    currentY += 14;
    doc.text(`Issuing Authority: ${user.issuingAuthority || '________________'}`, rightCol, currentY);

    doc.moveDown(2.5);

    // CoC validity and endorsements
    currentY = doc.y;
    doc.text(`CoC Issue Date: ${user.cocIssueDate ? format(user.cocIssueDate, 'dd/MM/yyyy') : '________'}`, leftCol, currentY);
    doc.text(`CoC Expiry Date: ${user.cocExpiryDate ? format(user.cocExpiryDate, 'dd/MM/yyyy') : '________'}`, rightCol, currentY);
    currentY += 14;
    doc.text(`Medical Cert No: ${user.medicalCertNumber || '________'}`, leftCol, currentY);
    doc.text(`Medical Expiry: ${user.medicalCertExpiry ? format(user.medicalCertExpiry, 'dd/MM/yyyy') : '________'}`, rightCol, currentY);
    currentY += 14;
    if (user.tankerEndorsement) {
      doc.text(`Tanker Endorsement: ${user.tankerEndorsement}`, leftCol, currentY);
    }

    doc.moveDown(1.5);

    // Horizontal line
    doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(0.5).stroke();
    doc.moveDown(0.8);

    // ============================================
    // SECTION 2: SEA SERVICE SUMMARY
    // ============================================
    doc.fontSize(11).font('Helvetica-Bold').text('SECTION 2: SEA SERVICE SUMMARY');
    doc.moveDown(0.3);

    // Report Period
    const reportStart = entries.length > 0 ? format(entries[0].startAt, 'dd MMMM yyyy') : 'N/A';
    const reportEnd = entries.length > 0 ? format(entries[entries.length - 1].endAt, 'dd MMMM yyyy') : 'N/A';

    doc.fontSize(9).font('Helvetica');
    currentY = doc.y;
    doc.text(`Service Period: ${reportStart} to ${reportEnd}`, leftCol, currentY);
    doc.text(`Total Entries: ${entries.length} (${verifiedEntries} verified)`, rightCol, currentY);
    currentY += 14;
    doc.font('Helvetica-Bold');
    doc.text(`Total Sea Service: ${totalDays.toFixed(2)} days (${totalHours.toFixed(2)} hours)`, leftCol, currentY);
    doc.text(`Verified Service: ${verifiedDays.toFixed(2)} days`, rightCol, currentY);
    doc.font('Helvetica');

    doc.moveDown(1.5);

    // Breakdown by Year
    doc.font('Helvetica-Bold').fontSize(9).text('Service by Year:');
    doc.font('Helvetica');
    let yearText = '';
    for (const [year, data] of Object.entries(byYear).sort((a, b) => Number(a[0]) - Number(b[0]))) {
      yearText += `${year}: ${data.days.toFixed(1)} days  |  `;
    }
    doc.text(yearText.slice(0, -4));

    doc.moveDown(1);

    // Horizontal line
    doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(0.5).stroke();
    doc.moveDown(0.8);

    // ============================================
    // SECTION 3: DETAILED SEA SERVICE RECORD
    // ============================================
    doc.fontSize(11).font('Helvetica-Bold').text('SECTION 3: DETAILED SEA SERVICE RECORD');
    doc.moveDown(0.5);

    // Table header with all STCW required fields
    const tableTop = doc.y;
    const c1 = 40;   // Vessel Name
    const c2 = 115;  // IMO/Flag
    const c3 = 175;  // GT
    const c4 = 210;  // Rank
    const c5 = 275;  // Sign On
    const c6 = 330;  // Sign Off
    const c7 = 385;  // Days
    const c8 = 420;  // Voyage
    const c9 = 475;  // Company
    const c10 = 540; // V (Verified)

    doc.fontSize(7).font('Helvetica-Bold');
    doc.text('Vessel Name', c1, tableTop);
    doc.text('IMO/Flag', c2, tableTop);
    doc.text('GT', c3, tableTop);
    doc.text('Rank', c4, tableTop);
    doc.text('Sign On', c5, tableTop);
    doc.text('Sign Off', c6, tableTop);
    doc.text('Days', c7, tableTop);
    doc.text('Voyage', c8, tableTop);
    doc.text('Company', c9, tableTop);
    doc.text('V', c10, tableTop);

    doc.moveTo(40, doc.y + 10).lineTo(555, doc.y + 10).lineWidth(0.5).stroke();
    doc.moveDown(0.8);

    // Table rows
    doc.font('Helvetica').fontSize(7);
    let rowY = doc.y;

    for (const entry of entries) {
      // Check if we need a new page
      if (rowY > 720) {
        doc.addPage();
        rowY = 40;

        // Page header on continuation
        doc.fontSize(9).font('Helvetica-Bold').text('SEA SERVICE RECORD (Continued)', 40, rowY);
        doc.fontSize(8).font('Helvetica').text(`Document Ref: ${documentRef}`, 400, rowY);
        rowY += 20;

        // Repeat table header
        doc.fontSize(7).font('Helvetica-Bold');
        doc.text('Vessel Name', c1, rowY);
        doc.text('IMO/Flag', c2, rowY);
        doc.text('GT', c3, rowY);
        doc.text('Rank', c4, rowY);
        doc.text('Sign On', c5, rowY);
        doc.text('Sign Off', c6, rowY);
        doc.text('Days', c7, rowY);
        doc.text('Voyage', c8, rowY);
        doc.text('Company', c9, rowY);
        doc.text('V', c10, rowY);
        doc.moveTo(40, rowY + 10).lineTo(555, rowY + 10).stroke();
        rowY += 18;
        doc.font('Helvetica');
      }

      const vesselName = entry.vessel.name.length > 12 ? entry.vessel.name.substring(0, 11) + '..' : entry.vessel.name;
      const imoFlag = entry.vessel.imoNumber ? `${entry.vessel.imoNumber}` : (entry.vessel.flag || '-');
      const gt = entry.vessel.grossTonnage ? entry.vessel.grossTonnage.toString() : '-';
      const rankName = entry.rank.length > 10 ? entry.rank.substring(0, 9) + '..' : entry.rank;
      const voyageType = (entry as unknown as Record<string, string>).voyageType || 'Int\'l';
      const companyName = entry.company.name.length > 10 ? entry.company.name.substring(0, 9) + '..' : entry.company.name;

      doc.text(vesselName, c1, rowY, { width: 70 });
      doc.text(imoFlag, c2, rowY, { width: 55 });
      doc.text(gt, c3, rowY, { width: 30 });
      doc.text(rankName, c4, rowY, { width: 60 });
      doc.text(format(entry.startAt, 'dd/MM/yy'), c5, rowY);
      doc.text(format(entry.endAt, 'dd/MM/yy'), c6, rowY);
      doc.text(entry.computedDurationDays.toFixed(1), c7, rowY);
      doc.text(voyageType.substring(0, 6), c8, rowY);
      doc.text(companyName, c9, rowY, { width: 60 });

      // Verified indicator
      if (entry.isVerified) {
        doc.text('✓', c10, rowY);
      }

      rowY += 12;
    }

    // Total row
    doc.moveTo(40, rowY).lineTo(555, rowY).lineWidth(0.5).stroke();
    rowY += 4;
    doc.font('Helvetica-Bold').fontSize(8);
    doc.text('TOTAL SEA SERVICE:', c1, rowY);
    doc.text(`${totalDays.toFixed(2)} days`, c7 - 20, rowY);
    doc.text(`(${verifiedDays.toFixed(2)} verified)`, c8, rowY);

    // ============================================
    // SECTION 4: DECLARATION & CERTIFICATION
    // ============================================
    doc.addPage();
    doc.fontSize(11).font('Helvetica-Bold').text('SECTION 4: DECLARATION & CERTIFICATION');
    doc.moveDown(0.5);

    // Declaration statement (required for official submissions)
    doc.fontSize(9).font('Helvetica');
    doc.text(
      'I hereby declare that the information contained in this Sea Service Record is true and accurate ' +
      'to the best of my knowledge. This record has been prepared in accordance with the requirements ' +
      'of the STCW Convention (Regulation I/2) and is submitted for the purpose of verifying qualifying ' +
      'sea service for Certificate of Competency application/revalidation.',
      { align: 'justify', lineGap: 2 }
    );
    doc.moveDown(1.5);

    // Seafarer signature block
    doc.font('Helvetica-Bold').text('SEAFARER DECLARATION:');
    doc.moveDown(0.5);
    doc.font('Helvetica');
    currentY = doc.y;

    doc.text('Signature: _______________________________', leftCol, currentY);
    doc.text('Date: _______________________________', rightCol, currentY);
    currentY += 30;
    doc.text(`Name: ${user.fullName}`, leftCol, currentY);
    doc.text(`CDC/ID: ${user.cdcNumber || '________________'}`, rightCol, currentY);

    doc.moveDown(3);

    // Company/Master verification block
    doc.font('Helvetica-Bold').text('COMPANY/MASTER VERIFICATION:');
    doc.moveDown(0.5);
    doc.font('Helvetica');
    doc.text(
      'I hereby certify that the sea service entries listed in this record are accurate and ' +
      'that the named seafarer served in the capacities and for the periods stated.',
      { lineGap: 2 }
    );
    doc.moveDown(1);

    currentY = doc.y;
    doc.text('Signature: _______________________________', leftCol, currentY);
    doc.text('Date: _______________________________', rightCol, currentY);
    currentY += 25;
    doc.text('Name: _______________________________', leftCol, currentY);
    doc.text('Title: _______________________________', rightCol, currentY);
    currentY += 25;
    doc.text('Company: _______________________________', leftCol, currentY);
    doc.text('Contact: _______________________________', rightCol, currentY);
    currentY += 30;

    // Company stamp placeholder
    doc.rect(rightCol, currentY, 120, 60).stroke();
    doc.fontSize(8).text('Company Stamp/Seal', rightCol + 25, currentY + 25);

    doc.moveDown(5);

    // Horizontal line
    doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(0.5).stroke();
    doc.moveDown(0.8);

    // ============================================
    // FOOTER - Document Information
    // ============================================
    doc.fontSize(8).fillColor('#666666');
    doc.text('DOCUMENT INFORMATION', { align: 'center' });
    doc.moveDown(0.3);
    doc.text(`Document Reference: ${documentRef}`, { align: 'center' });
    doc.text(`Generated: ${format(new Date(), 'dd MMMM yyyy \'at\' HH:mm:ss')} UTC`, { align: 'center' });
    doc.text('Generated by Regulation Manifest - Maritime Compliance System', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(7);
    doc.text(
      'This document is generated electronically. For official submissions, ensure all signature ' +
      'blocks are completed and company verification is obtained. Retain original service letters ' +
      'for authority inspection.',
      { align: 'center', lineGap: 1 }
    );

    // Create audit log with document reference
    await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        action: 'EXPORT',
        details: JSON.stringify({
          format: 'PDF',
          documentReference: documentRef,
          entriesCount: entries.length,
          verifiedEntries,
          totalDays,
          verifiedDays,
          startDate,
          endDate,
        }),
      },
    });

    doc.end();
  } catch (err) {
    next(err);
  }
});

// Generate CSV report
router.post('/csv', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { startDate, endDate, entryIds } = req.body;

    // Build query
    const where: Record<string, unknown> = { userId: req.userId };

    if (entryIds && entryIds.length > 0) {
      where.id = { in: entryIds };
    } else {
      if (startDate) {
        where.startAt = { gte: new Date(startDate) };
      }
      if (endDate) {
        where.endAt = { lte: new Date(endDate) };
      }
    }

    // Get entries
    const entries = await prisma.seatimeEntry.findMany({
      where,
      include: {
        vessel: true,
        company: true,
      },
      orderBy: { startAt: 'asc' },
    });

    if (entries.length === 0) {
      throw createError('No entries found for the specified criteria', 404);
    }

    // Build CSV
    const headers = [
      'Vessel',
      'IMO Number',
      'Vessel Type',
      'Company',
      'Rank',
      'Watch Schedule',
      'Start Date',
      'End Date',
      'Duration (Days)',
      'Duration (Hours)',
      'Departure Port',
      'Arrival Port',
      'Route',
      'Verified',
      'Verified By',
      'Notes',
    ];

    const rows = entries.map(entry => [
      `"${entry.vessel.name}"`,
      entry.vessel.imoNumber || '',
      entry.vessel.vesselType || '',
      `"${entry.company.name}"`,
      `"${entry.rank}"`,
      entry.watchSchedule || '',
      format(entry.startAt, 'yyyy-MM-dd'),
      format(entry.endAt, 'yyyy-MM-dd'),
      entry.computedDurationDays.toFixed(2),
      entry.computedDurationHours.toFixed(2),
      entry.departurePort || '',
      entry.arrivalPort || '',
      entry.route || '',
      entry.isVerified ? 'Yes' : 'No',
      entry.verifiedBy || '',
      `"${(entry.notes || '').replace(/"/g, '""')}"`,
    ]);

    // Add totals row
    const totalDays = entries.reduce((sum, e) => sum + e.computedDurationDays, 0);
    const totalHours = entries.reduce((sum, e) => sum + e.computedDurationHours, 0);
    rows.push([
      'TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      totalDays.toFixed(2),
      totalHours.toFixed(2),
      '',
      '',
      '',
      '',
      '',
      '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="seatime-report-${format(new Date(), 'yyyy-MM-dd')}.csv"`);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        action: 'EXPORT',
        details: JSON.stringify({
          format: 'CSV',
          entriesCount: entries.length,
          totalDays,
          startDate,
          endDate,
        }),
      },
    });

    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// Get report preview
router.post('/preview', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { startDate, endDate, entryIds } = req.body;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { fullName: true, licenseNumber: true },
    });

    // Build query
    const where: Record<string, unknown> = { userId: req.userId };

    if (entryIds && entryIds.length > 0) {
      where.id = { in: entryIds };
    } else {
      if (startDate) {
        where.startAt = { gte: new Date(startDate) };
      }
      if (endDate) {
        where.endAt = { lte: new Date(endDate) };
      }
    }

    // Get entries
    const entries = await prisma.seatimeEntry.findMany({
      where,
      include: {
        vessel: true,
        company: true,
      },
      orderBy: { startAt: 'asc' },
    });

    // Calculate totals
    const totalDays = entries.reduce((sum, e) => sum + e.computedDurationDays, 0);
    const totalHours = entries.reduce((sum, e) => sum + e.computedDurationHours, 0);
    const verifiedCount = entries.filter(e => e.isVerified).length;

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
    const byVessel: Record<string, { name: string; days: number; count: number }> = {};
    for (const entry of entries) {
      if (!byVessel[entry.vesselId]) {
        byVessel[entry.vesselId] = { name: entry.vessel.name, days: 0, count: 0 };
      }
      byVessel[entry.vesselId].days += entry.computedDurationDays;
      byVessel[entry.vesselId].count += 1;
    }

    res.json({
      user,
      entriesCount: entries.length,
      verifiedCount,
      totalDays: Math.round(totalDays * 100) / 100,
      totalHours: Math.round(totalHours * 100) / 100,
      dateRange: {
        start: entries.length > 0 ? entries[0].startAt : null,
        end: entries.length > 0 ? entries[entries.length - 1].endAt : null,
      },
      byYear,
      byVessel: Object.values(byVessel),
      entries,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
