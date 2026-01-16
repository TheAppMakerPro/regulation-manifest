import { describe, it, expect } from 'vitest';
import {
  calculateDuration,
  doRangesOverlap,
  calculateOverlapHours,
  checkOverlaps,
  validateEntry,
  calculateTotalSeatime,
  groupByYear,
} from './seatimeCalculations.js';

describe('calculateDuration', () => {
  it('should calculate duration for a full day', () => {
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-02T00:00:00Z');

    const result = calculateDuration(start, end);

    expect(result.totalHours).toBe(24);
    expect(result.totalDays).toBe(1);
    expect(result.wholeDays).toBe(1);
    expect(result.remainingHours).toBe(0);
  });

  it('should calculate partial days correctly', () => {
    const start = new Date('2024-01-01T08:00:00Z');
    const end = new Date('2024-01-01T20:00:00Z');

    const result = calculateDuration(start, end);

    expect(result.totalHours).toBe(12);
    expect(result.totalDays).toBe(0.5);
    expect(result.wholeDays).toBe(0);
    expect(result.remainingHours).toBe(12);
  });

  it('should handle cross-midnight correctly', () => {
    const start = new Date('2024-01-01T20:00:00Z');
    const end = new Date('2024-01-02T08:00:00Z');

    const result = calculateDuration(start, end);

    expect(result.totalHours).toBe(12);
    expect(result.totalDays).toBe(0.5);
  });

  it('should handle multi-day periods', () => {
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-31T00:00:00Z');

    const result = calculateDuration(start, end);

    expect(result.totalDays).toBe(30);
    expect(result.totalHours).toBe(720);
  });

  it('should work with ISO string inputs', () => {
    const result = calculateDuration('2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z');

    expect(result.totalDays).toBe(1);
  });

  it('should throw error if end is before start', () => {
    const start = new Date('2024-01-02T00:00:00Z');
    const end = new Date('2024-01-01T00:00:00Z');

    expect(() => calculateDuration(start, end)).toThrow('End date must be after start date');
  });
});

describe('doRangesOverlap', () => {
  it('should detect overlapping ranges', () => {
    const range1 = {
      startAt: new Date('2024-01-01'),
      endAt: new Date('2024-01-10'),
    };
    const range2 = {
      startAt: new Date('2024-01-05'),
      endAt: new Date('2024-01-15'),
    };

    expect(doRangesOverlap(range1, range2)).toBe(true);
  });

  it('should detect non-overlapping ranges', () => {
    const range1 = {
      startAt: new Date('2024-01-01'),
      endAt: new Date('2024-01-10'),
    };
    const range2 = {
      startAt: new Date('2024-01-11'),
      endAt: new Date('2024-01-20'),
    };

    expect(doRangesOverlap(range1, range2)).toBe(false);
  });

  it('should detect contained ranges', () => {
    const range1 = {
      startAt: new Date('2024-01-01'),
      endAt: new Date('2024-01-31'),
    };
    const range2 = {
      startAt: new Date('2024-01-10'),
      endAt: new Date('2024-01-20'),
    };

    expect(doRangesOverlap(range1, range2)).toBe(true);
  });
});

describe('calculateOverlapHours', () => {
  it('should calculate overlap hours correctly', () => {
    const range1 = {
      startAt: new Date('2024-01-01T00:00:00Z'),
      endAt: new Date('2024-01-10T00:00:00Z'),
    };
    const range2 = {
      startAt: new Date('2024-01-05T00:00:00Z'),
      endAt: new Date('2024-01-15T00:00:00Z'),
    };

    const overlapHours = calculateOverlapHours(range1, range2);

    expect(overlapHours).toBe(120); // 5 days = 120 hours
  });

  it('should return 0 for non-overlapping ranges', () => {
    const range1 = {
      startAt: new Date('2024-01-01'),
      endAt: new Date('2024-01-05'),
    };
    const range2 = {
      startAt: new Date('2024-01-10'),
      endAt: new Date('2024-01-15'),
    };

    expect(calculateOverlapHours(range1, range2)).toBe(0);
  });
});

describe('checkOverlaps', () => {
  const existingEntries = [
    {
      id: '1',
      startAt: new Date('2024-01-01'),
      endAt: new Date('2024-01-10'),
    },
    {
      id: '2',
      startAt: new Date('2024-02-01'),
      endAt: new Date('2024-02-15'),
    },
  ];

  it('should detect overlaps with existing entries', () => {
    const newEntry = {
      startAt: new Date('2024-01-05'),
      endAt: new Date('2024-01-15'),
    };

    const result = checkOverlaps(newEntry, existingEntries);

    expect(result.hasOverlap).toBe(true);
    expect(result.overlappingEntries).toHaveLength(1);
    expect(result.overlappingEntries[0].id).toBe('1');
  });

  it('should not flag overlaps with excluded entry', () => {
    const newEntry = {
      startAt: new Date('2024-01-05'),
      endAt: new Date('2024-01-15'),
    };

    const result = checkOverlaps(newEntry, existingEntries, '1');

    expect(result.hasOverlap).toBe(false);
  });

  it('should handle no overlaps', () => {
    const newEntry = {
      startAt: new Date('2024-03-01'),
      endAt: new Date('2024-03-15'),
    };

    const result = checkOverlaps(newEntry, existingEntries);

    expect(result.hasOverlap).toBe(false);
    expect(result.overlappingEntries).toHaveLength(0);
  });
});

describe('validateEntry', () => {
  it('should validate a correct entry', () => {
    const result = validateEntry(
      new Date('2024-01-01'),
      new Date('2024-01-31'),
      'Second Officer',
      'vessel-1',
      'company-1'
    );

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should require rank', () => {
    const result = validateEntry(
      new Date('2024-01-01'),
      new Date('2024-01-31'),
      '',
      'vessel-1',
      'company-1'
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Rank/Position is required');
  });

  it('should require vesselId', () => {
    const result = validateEntry(
      new Date('2024-01-01'),
      new Date('2024-01-31'),
      'Second Officer',
      '',
      'company-1'
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Vessel is required');
  });

  it('should warn about unrealistic duration', () => {
    const result = validateEntry(
      new Date('2020-01-01'),
      new Date('2022-01-01'),
      'Second Officer',
      'vessel-1',
      'company-1'
    );

    expect(result.warnings).toContain('Duration exceeds 1 year - please verify');
  });
});

describe('calculateTotalSeatime', () => {
  it('should sum up all entries correctly', () => {
    const entries = [
      { computedDurationHours: 720, computedDurationDays: 30 },
      { computedDurationHours: 480, computedDurationDays: 20 },
      { computedDurationHours: 240, computedDurationDays: 10 },
    ];

    const result = calculateTotalSeatime(entries);

    expect(result.totalHours).toBe(1440);
    expect(result.totalDays).toBe(60);
  });

  it('should handle empty array', () => {
    const result = calculateTotalSeatime([]);

    expect(result.totalHours).toBe(0);
    expect(result.totalDays).toBe(0);
  });
});

describe('groupByYear', () => {
  it('should group entries by year', () => {
    const entries = [
      { startAt: new Date('2023-06-01'), computedDurationHours: 720, computedDurationDays: 30 },
      { startAt: new Date('2023-10-01'), computedDurationHours: 480, computedDurationDays: 20 },
      { startAt: new Date('2024-03-01'), computedDurationHours: 240, computedDurationDays: 10 },
    ];

    const result = groupByYear(entries);

    expect(result.get(2023)?.days).toBe(50);
    expect(result.get(2023)?.count).toBe(2);
    expect(result.get(2024)?.days).toBe(10);
    expect(result.get(2024)?.count).toBe(1);
  });
});
