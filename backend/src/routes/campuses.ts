// BMI UMS - Campuses Routes
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getPocketBase, authenticateAdmin } from '../services/pocketbase.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { auditMiddleware, logAction } from '../middleware/audit.js';
import { logger } from '../utils/logger.js';
import { parsePagination, sanitizeFilter } from '../utils/helpers.js';
import type { ApiResponse } from '../types/index.js';

const campusesRouter = new Hono();

interface Campus {
  id: string;
  name: string;
  code: string;
  location: string;
  status: 'active' | 'inactive';
  created: string;
  updated: string;
}

// Apply auth middleware to all routes
campusesRouter.use('*', authMiddleware);
campusesRouter.use('*', auditMiddleware);

// Validation schemas
const campusSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  location: z.string().min(1).max(100),
  status: z.enum(['active', 'inactive']).default('active'),
});

const updateCampusSchema = campusSchema.partial();

/**
 * GET /api/v1/campuses
 * List all campuses with pagination and filtering
 */
campusesRouter.get('/', async (c) => {
  try {
    const pb = getPocketBase();
    
    // Check if PocketBase is authenticated, re-authenticate if needed
    if (!pb.authStore.isValid) {
      logger.warn('PocketBase auth expired, re-authenticating...');
      await authenticateAdmin();
    }
    
    // Parse query parameters
    const { page, perPage } = parsePagination(
      c.req.query('page'),
      c.req.query('perPage'),
      { page: 1, perPage: 50, maxPerPage: 100 }
    );
    
    const status = c.req.query('status');
    const search = c.req.query('search');

    // Build filter
    const filters: string[] = [];
    if (status) filters.push(`status = "${sanitizeFilter(status)}"`);
    if (search) {
      const s = sanitizeFilter(search);
      filters.push(`(name ~ "${s}" || code ~ "${s}" || location ~ "${s}")`);
    }
    
    const filterString = filters.length > 0 ? filters.join(' && ') : '';
    
    // Fetch campuses
    const queryOptions: { sort: string; filter?: string } = { sort: 'name' };
    if (filterString) {
      queryOptions.filter = filterString;
    }
    
    const result = await pb.collection('campuses').getList(page, perPage, queryOptions);
    
    return c.json<ApiResponse<Campus[]>>({
      success: true,
      data: result.items as unknown as Campus[],
      meta: {
        page: result.page,
        perPage: result.perPage,
        total: result.totalItems,
      },
    });
    
  } catch (error) {
    logger.error('Get campuses error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch campuses',
    }, 500);
  }
});

/**
 * GET /api/v1/campuses/all
 * Get all campuses without pagination (for dropdowns)
 */
campusesRouter.get('/all', async (c) => {
  try {
    const pb = getPocketBase();
    
    const campuses = await pb.collection('campuses').getFullList({
      sort: 'name',
      filter: 'status = "active"',
    });
    
    return c.json<ApiResponse<Campus[]>>({
      success: true,
      data: campuses as unknown as Campus[],
    });
    
  } catch (error) {
    logger.error('Get all campuses error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch campuses',
    }, 500);
  }
});

/**
 * GET /api/v1/campuses/:id
 * Get a single campus by ID
 */
campusesRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const pb = getPocketBase();
    
    const campus = await pb.collection('campuses').getOne(id);
    
    return c.json<ApiResponse<Campus>>({
      success: true,
      data: campus as unknown as Campus,
    });
    
  } catch (error) {
    logger.error('Get campus error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Campus not found',
    }, 404);
  }
});

/**
 * GET /api/v1/campuses/:id/students
 * Get all students in a campus
 */
campusesRouter.get('/:id/students', async (c) => {
  try {
    const id = c.req.param('id');
    const pb = getPocketBase();
    
    const { page, perPage } = parsePagination(
      c.req.query('page'),
      c.req.query('perPage'),
      { page: 1, perPage: 20, maxPerPage: 100 }
    );
    
    const result = await pb.collection('students').getList(page, perPage, {
      filter: `campus_code = "${id}"`,
      sort: '-created',
    });
    
    return c.json<ApiResponse<any[]>>({
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        perPage: result.perPage,
        total: result.totalItems,
      },
    });
    
  } catch (error) {
    logger.error('Get campus students error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch campus students',
    }, 500);
  }
});

/**
 * GET /api/v1/campuses/:id/staff
 * Get all staff in a campus
 */
campusesRouter.get('/:id/staff', async (c) => {
  try {
    const id = c.req.param('id');
    const pb = getPocketBase();
    
    const { page, perPage } = parsePagination(
      c.req.query('page'),
      c.req.query('perPage'),
      { page: 1, perPage: 20, maxPerPage: 100 }
    );
    
    const result = await pb.collection('staff').getList(page, perPage, {
      filter: `campus_code = "${id}"`,
      sort: '-created',
    });
    
    return c.json<ApiResponse<any[]>>({
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        perPage: result.perPage,
        total: result.totalItems,
      },
    });
    
  } catch (error) {
    logger.error('Get campus staff error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch campus staff',
    }, 500);
  }
});

/**
 * GET /api/v1/campuses/:id/courses
 * Get all courses in a campus
 */
campusesRouter.get('/:id/courses', async (c) => {
  try {
    const id = c.req.param('id');
    const pb = getPocketBase();
    
    const { page, perPage } = parsePagination(
      c.req.query('page'),
      c.req.query('perPage'),
      { page: 1, perPage: 20, maxPerPage: 100 }
    );
    
    const result = await pb.collection('courses').getList(page, perPage, {
      filter: `campus_code = "${id}"`,
      sort: 'course_code',
    });
    
    return c.json<ApiResponse<any[]>>({
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        perPage: result.perPage,
        total: result.totalItems,
      },
    });
    
  } catch (error) {
    logger.error('Get campus courses error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch campus courses',
    }, 500);
  }
});

/**
 * GET /api/v1/campuses/:id/stats
 * Get campus statistics
 */
campusesRouter.get('/:id/stats', async (c) => {
  try {
    const id = c.req.param('id');
    const pb = getPocketBase();
    
    // Get campus details
    const campus = await pb.collection('campuses').getOne(id);
    
    // Get counts
    const studentsCount = await pb.collection('students').getList(1, 1, {
      filter: `campus_code = "${id}"`,
    });
    
    const staffCount = await pb.collection('staff').getList(1, 1, {
      filter: `campus_code = "${id}"`,
    });
    
    const coursesCount = await pb.collection('courses').getList(1, 1, {
      filter: `campus_code = "${id}"`,
    });
    
    const stats = {
      campus: campus as unknown as Campus,
      students: studentsCount.totalItems,
      staff: staffCount.totalItems,
      courses: coursesCount.totalItems,
    };
    
    return c.json<ApiResponse<typeof stats>>({
      success: true,
      data: stats,
    });
    
  } catch (error) {
    logger.error('Get campus stats error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch campus statistics',
    }, 500);
  }
});

/**
 * POST /api/v1/campuses
 * Create a new campus
 */
campusesRouter.post(
  '/',
  requireRole('admin'),
  zValidator('json', campusSchema),
  logAction('CREATE', 'campuses'),
  async (c) => {
    try {
      const validData = c.req.valid('json');
      const pb = getPocketBase();
      
      const newCampus = await pb.collection('campuses').create(validData);
      
      logger.info('Campus created', { campusId: newCampus.id });
      
      return c.json<ApiResponse<Campus>>({
        success: true,
        data: newCampus as unknown as Campus,
        message: 'Campus created successfully',
      }, 201);
      
    } catch (error) {
      logger.error('Create campus error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to create campus',
      }, 500);
    }
  }
);

/**
 * PATCH /api/v1/campuses/:id
 * Update a campus
 */
campusesRouter.patch(
  '/:id',
  requireRole('admin'),
  zValidator('json', updateCampusSchema),
  logAction('UPDATE', 'campuses'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const pb = getPocketBase();
      
      const updated = await pb.collection('campuses').update(id, data);
      
      logger.info('Campus updated', { campusId: id });
      
      return c.json<ApiResponse<Campus>>({
        success: true,
        data: updated as unknown as Campus,
        message: 'Campus updated successfully',
      });
      
    } catch (error) {
      logger.error('Update campus error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to update campus',
      }, 500);
    }
  }
);

/**
 * DELETE /api/v1/campuses/:id
 * Delete a campus
 */
campusesRouter.delete(
  '/:id',
  requireRole('admin'),
  logAction('DELETE', 'campuses'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const pb = getPocketBase();
      
      // Check if campus has students, staff, or courses
      const students = await pb.collection('students').getList(1, 1, {
        filter: `campus_code = "${id}"`,
      });
      
      const staff = await pb.collection('staff').getList(1, 1, {
        filter: `campus_code = "${id}"`,
      });
      
      const courses = await pb.collection('courses').getList(1, 1, {
        filter: `campus_code = "${id}"`,
      });
      
      if (students.totalItems > 0 || staff.totalItems > 0 || courses.totalItems > 0) {
        return c.json<ApiResponse<never>>({
          success: false,
          error: 'Cannot delete campus with associated students, staff, or courses',
        }, 400);
      }
      
      await pb.collection('campuses').delete(id);
      
      logger.info('Campus deleted', { campusId: id });
      
      return c.json<ApiResponse<null>>({
        success: true,
        data: null,
        message: 'Campus deleted successfully',
      });
      
    } catch (error) {
      logger.error('Delete campus error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to delete campus',
      }, 500);
    }
  }
);

export default campusesRouter;
