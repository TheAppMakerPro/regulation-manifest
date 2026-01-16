import { differenceInHours, differenceInMinutes, parseISO, isValid, isBefore, isAfter, areIntervalsOverlapping } from 'date-fns';

export interface TimeRange {
  startAt: Date;
  endAt: Date;
}

export interface SeatimeDuration {
  totalHours: number;
  totalDays: number;
  wholeDays: number;
  remainingHours: number;
}

export interface OverlapResult {
  hasOverlap: boolean;
  overlappingEntries: Array<{
    id: string;
    startAt: Date;
    endAt: Date;
    overlapHours: number;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Calculate seatime duration from start and end dates
 * Handles partial days and cross-midnight scenarios
 */
export function calculateDuration(startAt: Date | string, endAt: Date | string): SeatimeDuration {
  const start = typeof startAt === 'string' ? parseISO(startAt) : startAt;
  const end = typeof endAt === 'string' ? parseISO(endAt) : endAt;

  if (!isValid(start) || !isValid(end)) {
    throw new Error('Invalid date provided');
  }

  if (isBefore(end, start)) {
    throw new Error('End date must be after start date');
  }

  const totalMinutes = differenceInMinutes(end, start);
  const totalHours = totalMinutes / 60;
  const totalDays = totalHours / 24;

  // Round to 2 decimal places for precision
  const roundedHours = Math.round(totalHours * 100) / 100;
  const roundedDays = Math.round(totalDays * 100) / 100;

  return {
    totalHours: roundedHours,
    totalDays: roundedDays,
    wholeDays: Math.floor(totalDays),
    remainingHours: Math.round((totalDays % 1) * 24 * 100) / 100,
  };
}

/**
 * Check if two time ranges overlap
 */
export function doRangesOverlap(range1: TimeRange, range2: TimeRange): boolean {
  return areIntervalsOverlapping(
    { start: range1.startAt, end: range1.endAt },
    { start: range2.startAt, end: range2.endAt }
  );
}

/**
 * Calculate overlap hours between two ranges
 */
export function calculateOverlapHours(range1: TimeRange, range2: TimeRange): number {
  if (!doRangesOverlap(range1, range2)) {
    return 0;
  }

  const overlapStart = isAfter(range1.startAt, range2.startAt) ? range1.startAt : range2.startAt;
  const overlapEnd = isBefore(range1.endAt, range2.endAt) ? range1.endAt : range2.endAt;

  return differenceInHours(overlapEnd, overlapStart);
}

/**
 * Check for overlaps with existing entries
 */
export function checkOverlaps(
  newEntry: TimeRange,
  existingEntries: Array<{ id: string } & TimeRange>,
  excludeId?: string
): OverlapResult {
  const overlappingEntries: OverlapResult['overlappingEntries'] = [];

  for (const entry of existingEntries) {
    if (excludeId && entry.id === excludeId) {
      continue;
    }

    if (doRangesOverlap(newEntry, entry)) {
      overlappingEntries.push({
        id: entry.id,
        startAt: entry.startAt,
        endAt: entry.endAt,
        overlapHours: calculateOverlapHours(newEntry, entry),
      });
    }
  }

  return {
    hasOverlap: overlappingEntries.length > 0,
    overlappingEntries,
  };
}

/**
 * Validate a seatime entry
 */
export function validateEntry(
  startAt: Date | string,
  endAt: Date | string,
  rank: string,
  vesselId: string,
  companyId: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Parse dates
  const start = typeof startAt === 'string' ? parseISO(startAt) : startAt;
  const end = typeof endAt === 'string' ? parseISO(endAt) : endAt;

  // Check required fields
  if (!rank || rank.trim() === '') {
    errors.push('Rank/Position is required');
  }

  if (!vesselId) {
    errors.push('Vessel is required');
  }

  if (!companyId) {
    errors.push('Company is required');
  }

  // Validate dates
  if (!isValid(start)) {
    errors.push('Invalid start date');
  }

  if (!isValid(end)) {
    errors.push('Invalid end date');
  }

  if (isValid(start) && isValid(end)) {
    if (isBefore(end, start)) {
      errors.push('End date must be after start date');
    }

    // Check for future dates
    const now = new Date();
    if (isAfter(end, now)) {
      warnings.push('End date is in the future');
    }

    // Check for unrealistic duration
    const duration = calculateDuration(start, end);

    if (duration.totalDays > 365) {
      warnings.push('Duration exceeds 1 year - please verify');
    }

    if (duration.totalHours < 1) {
      warnings.push('Duration is less than 1 hour');
    }

    // Check for very old entries
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    if (isBefore(start, fiveYearsAgo)) {
      warnings.push('Entry is older than 5 years - may be outside renewal cycle');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate total seatime from multiple entries
 */
export function calculateTotalSeatime(entries: Array<{ computedDurationHours: number; computedDurationDays: number }>): {
  totalHours: number;
  totalDays: number;
} {
  const totalHours = entries.reduce((sum, entry) => sum + entry.computedDurationHours, 0);
  const totalDays = entries.reduce((sum, entry) => sum + entry.computedDurationDays, 0);

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    totalDays: Math.round(totalDays * 100) / 100,
  };
}

/**
 * Group entries by year and calculate totals
 */
export function groupByYear(entries: Array<{
  startAt: Date;
  computedDurationHours: number;
  computedDurationDays: number;
}>): Map<number, { hours: number; days: number; count: number }> {
  const grouped = new Map<number, { hours: number; days: number; count: number }>();

  for (const entry of entries) {
    const year = new Date(entry.startAt).getFullYear();
    const existing = grouped.get(year) || { hours: 0, days: 0, count: 0 };

    grouped.set(year, {
      hours: existing.hours + entry.computedDurationHours,
      days: existing.days + entry.computedDurationDays,
      count: existing.count + 1,
    });
  }

  return grouped;
}

/**
 * Group entries by vessel and calculate totals
 */
export function groupByVessel(entries: Array<{
  vesselId: string;
  computedDurationHours: number;
  computedDurationDays: number;
}>): Map<string, { hours: number; days: number; count: number }> {
  const grouped = new Map<string, { hours: number; days: number; count: number }>();

  for (const entry of entries) {
    const existing = grouped.get(entry.vesselId) || { hours: 0, days: 0, count: 0 };

    grouped.set(entry.vesselId, {
      hours: existing.hours + entry.computedDurationHours,
      days: existing.days + entry.computedDurationDays,
      count: existing.count + 1,
    });
  }

  return grouped;
}

/**
 * Group entries by rank and calculate totals
 */
export function groupByRank(entries: Array<{
  rank: string;
  computedDurationHours: number;
  computedDurationDays: number;
}>): Map<string, { hours: number; days: number; count: number }> {
  const grouped = new Map<string, { hours: number; days: number; count: number }>();

  for (const entry of entries) {
    const existing = grouped.get(entry.rank) || { hours: 0, days: 0, count: 0 };

    grouped.set(entry.rank, {
      hours: existing.hours + entry.computedDurationHours,
      days: existing.days + entry.computedDurationDays,
      count: existing.count + 1,
    });
  }

  return grouped;
}
