import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();

// Get all categories with regulation counts
router.get('/categories', async (_req: Request, res: Response, next) => {
  try {
    const categories = await prisma.regulationCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { regulations: true },
        },
      },
    });

    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// Get all conventions with chapter counts
router.get('/conventions', async (_req: Request, res: Response, next) => {
  try {
    const conventions = await prisma.convention.findMany({
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: { chapters: true },
        },
      },
    });

    res.json(conventions);
  } catch (err) {
    next(err);
  }
});

// Get single convention with chapters
router.get('/conventions/:code', async (req: Request, res: Response, next) => {
  try {
    const convention = await prisma.convention.findUnique({
      where: { code: req.params.code.toUpperCase() },
      include: {
        chapters: {
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: { regulations: true },
            },
          },
        },
      },
    });

    if (!convention) {
      throw createError('Convention not found', 404);
    }

    res.json(convention);
  } catch (err) {
    next(err);
  }
});

// Get chapters for a convention
router.get('/conventions/:code/chapters', async (req: Request, res: Response, next) => {
  try {
    const convention = await prisma.convention.findUnique({
      where: { code: req.params.code.toUpperCase() },
    });

    if (!convention) {
      throw createError('Convention not found', 404);
    }

    const chapters = await prisma.chapter.findMany({
      where: { conventionId: convention.id },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { regulations: true },
        },
      },
    });

    res.json(chapters);
  } catch (err) {
    next(err);
  }
});

// Get single chapter with regulations
router.get('/chapters/:id', async (req: Request, res: Response, next) => {
  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id: req.params.id },
      include: {
        convention: true,
        regulations: {
          orderBy: { sortOrder: 'asc' },
          include: {
            category: true,
          },
        },
      },
    });

    if (!chapter) {
      throw createError('Chapter not found', 404);
    }

    res.json(chapter);
  } catch (err) {
    next(err);
  }
});

// List regulations with filters and search
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const {
      search,
      categoryId,
      conventionCode,
      chapterId,
      limit = '50',
      offset = '0',
    } = req.query;

    const take = Math.min(parseInt(limit as string) || 50, 100);
    const skip = parseInt(offset as string) || 0;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (chapterId) {
      where.chapterId = chapterId;
    }

    if (conventionCode) {
      const convention = await prisma.convention.findUnique({
        where: { code: (conventionCode as string).toUpperCase() },
        include: { chapters: { select: { id: true } } },
      });

      if (convention) {
        where.chapterId = {
          in: convention.chapters.map((c) => c.id),
        };
      }
    }

    // Search in title, summary, and content
    if (search) {
      const searchTerm = search as string;
      where.OR = [
        { title: { contains: searchTerm } },
        { summary: { contains: searchTerm } },
        { content: { contains: searchTerm } },
        { code: { contains: searchTerm } },
      ];
    }

    const [regulations, total] = await Promise.all([
      prisma.regulation.findMany({
        where,
        take,
        skip,
        orderBy: [{ chapter: { convention: { code: 'asc' } } }, { sortOrder: 'asc' }],
        include: {
          category: true,
          chapter: {
            include: {
              convention: true,
            },
          },
        },
      }),
      prisma.regulation.count({ where }),
    ]);

    res.json({
      regulations,
      pagination: {
        total,
        limit: take,
        offset: skip,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Get single regulation with full details and cross-references
router.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const regulation = await prisma.regulation.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        chapter: {
          include: {
            convention: true,
          },
        },
        relatedFrom: {
          include: {
            toRegulation: {
              include: {
                chapter: {
                  include: {
                    convention: true,
                  },
                },
                category: true,
              },
            },
          },
        },
        relatedTo: {
          include: {
            fromRegulation: {
              include: {
                chapter: {
                  include: {
                    convention: true,
                  },
                },
                category: true,
              },
            },
          },
        },
      },
    });

    if (!regulation) {
      throw createError('Regulation not found', 404);
    }

    // Combine cross-references into a single array
    const crossReferences = [
      ...regulation.relatedFrom.map((r) => ({
        id: r.id,
        regulation: r.toRegulation,
        relationshipType: r.relationshipType,
        notes: r.notes,
        direction: 'outgoing' as const,
      })),
      ...regulation.relatedTo.map((r) => ({
        id: r.id,
        regulation: r.fromRegulation,
        relationshipType: r.relationshipType,
        notes: r.notes,
        direction: 'incoming' as const,
      })),
    ];

    res.json({
      ...regulation,
      crossReferences,
    });
  } catch (err) {
    next(err);
  }
});

// Advanced search endpoint
router.get('/search/advanced', async (req: Request, res: Response, next) => {
  try {
    const { q, categoryIds, conventionCodes, includeContent = 'false' } = req.query;

    if (!q) {
      throw createError('Search query is required', 400);
    }

    const searchTerm = q as string;
    const searchInContent = includeContent === 'true';

    // Build where clause
    const where: Record<string, unknown> = {};

    // Search conditions
    const searchConditions: Array<Record<string, { contains: string }>> = [
      { title: { contains: searchTerm } },
      { summary: { contains: searchTerm } },
      { code: { contains: searchTerm } },
    ];

    if (searchInContent) {
      searchConditions.push({ content: { contains: searchTerm } });
    }

    where.OR = searchConditions;

    // Category filter
    if (categoryIds) {
      const ids = (categoryIds as string).split(',');
      where.categoryId = { in: ids };
    }

    // Convention filter
    if (conventionCodes) {
      const codes = (conventionCodes as string).split(',').map((c) => c.toUpperCase());
      const conventions = await prisma.convention.findMany({
        where: { code: { in: codes } },
        include: { chapters: { select: { id: true } } },
      });

      const chapterIds = conventions.flatMap((c) => c.chapters.map((ch) => ch.id));
      where.chapterId = { in: chapterIds };
    }

    const regulations = await prisma.regulation.findMany({
      where,
      take: 50,
      orderBy: { title: 'asc' },
      include: {
        category: true,
        chapter: {
          include: {
            convention: true,
          },
        },
      },
    });

    // Get facets (counts by category and convention)
    const [categoryFacets, conventionFacets] = await Promise.all([
      prisma.regulation.groupBy({
        by: ['categoryId'],
        where,
        _count: true,
      }),
      prisma.chapter.findMany({
        where: {
          regulations: {
            some: where,
          },
        },
        select: {
          conventionId: true,
          convention: {
            select: { code: true, name: true },
          },
        },
        distinct: ['conventionId'],
      }),
    ]);

    res.json({
      results: regulations,
      total: regulations.length,
      facets: {
        categories: categoryFacets,
        conventions: conventionFacets.map((c) => c.convention),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
