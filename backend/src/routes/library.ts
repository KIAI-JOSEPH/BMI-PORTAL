import { sanitizeFilter } from '../utils/helpers.js';
// BMI UMS - Library Routes
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getPocketBase } from '../services/pocketbase.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { auditMiddleware, logAction } from '../middleware/audit.js';
import { logger } from '../utils/logger.js';
import { parsePagination } from '../utils/helpers.js';
import type { ApiResponse, LibraryItem } from '../types/index.js';

const libraryRouter = new Hono();

// Apply auth middleware
libraryRouter.use('*', authMiddleware);
libraryRouter.use('*', auditMiddleware);

// Validation schemas
const libraryItemSchema = z.object({
  title: z.string().min(2),
  author: z.string().min(1),
  category: z.enum(['Theology', 'ICT', 'Business', 'Education', 'General']),
  type: z.enum(['PDF', 'E-Book', 'Hardcopy', 'Journal', 'Video']),
  status: z.enum(['Digital', 'Available', 'Borrowed', 'Reserved']).default('Available'),
  year: z.string().min(4),
  description: z.string().min(10),
  downloadUrl: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
  isbn: z.string().optional(),
});

const updateLibraryItemSchema = libraryItemSchema.partial();

/**
 * GET /api/v1/library
 * List all library items
 */
libraryRouter.get('/', async (c) => {
  try {
    const pb = getPocketBase();

    const { page, perPage } = parsePagination(
      c.req.query('page'),
      c.req.query('perPage'),
      { page: 1, perPage: 20, maxPerPage: 500 }
    );

    const category = c.req.query('category');
    const type = c.req.query('type');
    const status = c.req.query('status');
    const search = c.req.query('search');

    const filters: string[] = [];
    if (category) filters.push(`category = "${sanitizeFilter(category)}"`);
    if (type) filters.push(`type = "${sanitizeFilter(type)}"`);
    if (status) filters.push(`status = "${sanitizeFilter(status)}"`);
    if (search) {
      const s = sanitizeFilter(search);
      filters.push(`(title ~ "${s}" || author ~ "${s}" || isbn ~ "${s}")`);
    }

    const filterString = filters.join(' && ') || undefined;

    const result = await pb.collection('library_items').getList(page, perPage, {
      filter: filterString,
      sort: '-created',
    });

    return c.json<ApiResponse<LibraryItem[]>>({
      success: true,
      data: result.items as unknown as LibraryItem[],
      meta: {
        page: result.page,
        perPage: result.perPage,
        total: result.totalItems,
      },
    });

  } catch (error) {
    logger.error('Get library items error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch library items',
    }, 500);
  }
});

/**
 * GET /api/v1/library/:id
 * Get a single library item
 */
libraryRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const pb = getPocketBase();

    const item = await pb.collection('library_items').getOne(id);

    return c.json<ApiResponse<LibraryItem>>({
      success: true,
      data: item as unknown as LibraryItem,
    });

  } catch (error) {
    logger.error('Get library item error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Library item not found',
    }, 404);
  }
});

/**
 * POST /api/v1/library
 * Create a new library item
 */
libraryRouter.post(
  '/',
  requireRole('admin', 'registrar', 'staff'),
  zValidator('json', libraryItemSchema),
  logAction('CREATE', 'library'),
  async (c) => {
    try {
      const data = c.req.valid('json');
      const pb = getPocketBase();

      // Generate item ID
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(Math.random() * 900) + 100;
      const itemId = `LIB-${year}-${randomSuffix}`;

      const newItem = await pb.collection('library_items').create({
        id: itemId,
        ...data,
      });

      logger.info('Library item created', { itemId: newItem.id });

      return c.json<ApiResponse<LibraryItem>>({
        success: true,
        data: newItem as unknown as LibraryItem,
        message: 'Library item added successfully',
      }, 201);

    } catch (error) {
      logger.error('Create library item error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to add library item',
      }, 500);
    }
  }
);

/**
 * PATCH /api/v1/library/:id
 * Update a library item
 */
libraryRouter.patch(
  '/:id',
  requireRole('admin', 'registrar', 'staff'),
  zValidator('json', updateLibraryItemSchema),
  logAction('UPDATE', 'library'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const pb = getPocketBase();

      const updated = await pb.collection('library_items').update(id, data);

      logger.info('Library item updated', { itemId: id });

      return c.json<ApiResponse<LibraryItem>>({
        success: true,
        data: updated as unknown as LibraryItem,
        message: 'Library item updated successfully',
      });

    } catch (error) {
      logger.error('Update library item error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to update library item',
      }, 500);
    }
  }
);

/**
 * DELETE /api/v1/library/:id
 * Delete a library item
 */
libraryRouter.delete(
  '/:id',
  requireRole('admin'),
  logAction('DELETE', 'library'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const pb = getPocketBase();

      await pb.collection('library_items').delete(id);

      logger.info('Library item deleted', { itemId: id });

      return c.json<ApiResponse<null>>({
        success: true,
        data: null,
        message: 'Library item deleted successfully',
      });

    } catch (error) {
      logger.error('Delete library item error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to delete library item',
      }, 500);
    }
  }
);

/**
 * POST /api/v1/library/:id/borrow
 * Mark item as borrowed
 */
libraryRouter.post(
  '/:id/borrow',
  requireRole('admin', 'registrar', 'staff'),
  logAction('UPDATE', 'library'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const pb = getPocketBase();

      const item = await pb.collection('library_items').getOne(id) as unknown as LibraryItem;

      if (item.status !== 'Available' && item.status !== 'Digital') {
        return c.json<ApiResponse<never>>({
          success: false,
          error: `Item is currently ${item.status.toLowerCase()}`,
        }, 400);
      }

      const updated = await pb.collection('library_items').update(id, {
        status: 'Borrowed',
      });

      logger.info('Library item borrowed', { itemId: id });

      return c.json<ApiResponse<LibraryItem>>({
        success: true,
        data: updated as unknown as LibraryItem,
        message: 'Item marked as borrowed',
      });

    } catch (error) {
      logger.error('Borrow library item error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to borrow item',
      }, 500);
    }
  }
);

/**
 * POST /api/v1/library/:id/return
 * Mark item as returned
 */
libraryRouter.post(
  '/:id/return',
  requireRole('admin', 'registrar', 'staff'),
  logAction('UPDATE', 'library'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const pb = getPocketBase();

      const item = await pb.collection('library_items').getOne(id) as unknown as LibraryItem;

      const newStatus = item.type === 'PDF' || item.type === 'E-Book' || item.type === 'Video'
        ? 'Digital'
        : 'Available';

      const updated = await pb.collection('library_items').update(id, {
        status: newStatus,
      });

      logger.info('Library item returned', { itemId: id });

      return c.json<ApiResponse<LibraryItem>>({
        success: true,
        data: updated as unknown as LibraryItem,
        message: 'Item marked as returned',
      });

    } catch (error) {
      logger.error('Return library item error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to return item',
      }, 500);
    }
  }
);

/**
 * GET /api/v1/library/stats/overview
 * Get library statistics
 */
libraryRouter.get('/stats/overview', async (c) => {
  try {
    const pb = getPocketBase();

    const allItems = await pb.collection('library_items').getFullList();
    const items = allItems as unknown as LibraryItem[];

    const stats = {
      total: items.length,
      byCategory: {
        Theology: items.filter(i => i.category === 'Theology').length,
        ICT: items.filter(i => i.category === 'ICT').length,
        Business: items.filter(i => i.category === 'Business').length,
        Education: items.filter(i => i.category === 'Education').length,
        General: items.filter(i => i.category === 'General').length,
      },
      byType: {
        PDF: items.filter(i => i.type === 'PDF').length,
        'E-Book': items.filter(i => i.type === 'E-Book').length,
        Hardcopy: items.filter(i => i.type === 'Hardcopy').length,
        Journal: items.filter(i => i.type === 'Journal').length,
        Video: items.filter(i => i.type === 'Video').length,
      },
      byStatus: {
        Digital: items.filter(i => i.status === 'Digital').length,
        Available: items.filter(i => i.status === 'Available').length,
        Borrowed: items.filter(i => i.status === 'Borrowed').length,
        Reserved: items.filter(i => i.status === 'Reserved').length,
      },
    };

    return c.json<ApiResponse<typeof stats>>({
      success: true,
      data: stats,
    });

  } catch (error) {
    logger.error('Get library stats error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch statistics',
    }, 500);
  }
});

/**
 * GET /api/v1/library/categories
 * Get all library categories
 */
libraryRouter.get('/meta/categories', async (c) => {
  return c.json<ApiResponse<string[]>>({
    success: true,
    data: ['Theology', 'ICT', 'Business', 'Education', 'General'],
  });
});

export default libraryRouter;
