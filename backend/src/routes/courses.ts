// BMI UMS - Courses Routes
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getPocketBase } from '../services/pocketbase.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { auditMiddleware, logAction } from '../middleware/audit.js';
import { logger } from '../utils/logger.js';
import { parsePagination } from '../utils/helpers.js';
import type { ApiResponse, Course } from '../types/index.js';

const coursesRouter = new Hono();

// Apply auth middleware
coursesRouter.use('*', authMiddleware);
coursesRouter.use('*', auditMiddleware);

// Validation schemas
const courseSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(3),
  faculty: z.string().min(1),
  department: z.string().min(1),
  level: z.enum(['Undergraduate', 'Postgraduate', 'Diploma', 'Certificate']),
  credits: z.number().positive(),
  status: z.enum(['Published', 'Draft', 'Archived']).default('Draft'),
  description: z.string().min(10),
  syllabus: z.string().min(10),
});

const updateCourseSchema = courseSchema.partial();

/**
 * GET /api/v1/courses
 * List all courses with pagination and filtering
 */
coursesRouter.get('/', async (c) => {
  try {
    const pb = getPocketBase();
    
    const { page, perPage } = parsePagination(
      c.req.query('page'),
      c.req.query('perPage'),
      { page: 1, perPage: 20, maxPerPage: 100 }
    );
    
    const faculty = c.req.query('faculty');
    const level = c.req.query('level');
    const status = c.req.query('status');
    const search = c.req.query('search');

    const safe = (v: string) => v.replace(/["'\\]/g, '').substring(0, 100);
    const filters: string[] = [];
    if (faculty) filters.push(`faculty = "${safe(faculty)}"`);
    if (level) filters.push(`level = "${safe(level)}"`);
    if (status) filters.push(`status = "${safe(status)}"`);
    if (search) {
      const s = safe(search);
      filters.push(`(name ~ "${s}" || code ~ "${s}" || description ~ "${s}")`);
    }
    
    const filterString = filters.join(' && ') || undefined;
    
    const result = await pb.collection('courses').getList(page, perPage, {
      filter: filterString,
      sort: '-created',
    });
    
    return c.json<ApiResponse<Course[]>>({
      success: true,
      data: result.items as unknown as Course[],
      meta: {
        page: result.page,
        perPage: result.perPage,
        total: result.totalItems,
      },
    });
    
  } catch (error) {
    logger.error('Get courses error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch courses',
    }, 500);
  }
});

/**
 * GET /api/v1/courses/:id
 * Get a single course
 */
coursesRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const pb = getPocketBase();
    
    const course = await pb.collection('courses').getOne(id);
    
    return c.json<ApiResponse<Course>>({
      success: true,
      data: course as unknown as Course,
    });
    
  } catch (error) {
    logger.error('Get course error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Course not found',
    }, 404);
  }
});

/**
 * POST /api/v1/courses
 * Create a new course
 */
coursesRouter.post(
  '/',
  requireRole('admin', 'registrar', 'staff'),
  zValidator('json', courseSchema),
  logAction('CREATE', 'courses'),
  async (c) => {
    try {
      const data = c.req.valid('json');
      const pb = getPocketBase();
      
      // Check for duplicate course code
      const existing = await pb.collection('courses').getList(1, 1, {
        filter: `code = "${data.code}"`,
      });
      
      if (existing.items.length > 0) {
        return c.json<ApiResponse<never>>({
          success: false,
          error: 'Course code already exists',
        }, 409);
      }
      
      const newCourse = await pb.collection('courses').create(data);
      
      logger.info('Course created', { courseId: newCourse.id });
      
      return c.json<ApiResponse<Course>>({
        success: true,
        data: newCourse as unknown as Course,
        message: 'Course created successfully',
      }, 201);
      
    } catch (error) {
      logger.error('Create course error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to create course',
      }, 500);
    }
  }
);

/**
 * PATCH /api/v1/courses/:id
 * Update a course
 */
coursesRouter.patch(
  '/:id',
  requireRole('admin', 'registrar', 'staff'),
  zValidator('json', updateCourseSchema),
  logAction('UPDATE', 'courses'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const pb = getPocketBase();
      
      const updated = await pb.collection('courses').update(id, data);
      
      logger.info('Course updated', { courseId: id });
      
      return c.json<ApiResponse<Course>>({
        success: true,
        data: updated as unknown as Course,
        message: 'Course updated successfully',
      });
      
    } catch (error) {
      logger.error('Update course error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to update course',
      }, 500);
    }
  }
);

/**
 * DELETE /api/v1/courses/:id
 * Delete a course
 */
coursesRouter.delete(
  '/:id',
  requireRole('admin'),
  logAction('DELETE', 'courses'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const pb = getPocketBase();
      
      await pb.collection('courses').delete(id);
      
      logger.info('Course deleted', { courseId: id });
      
      return c.json<ApiResponse<null>>({
        success: true,
        data: null,
        message: 'Course deleted successfully',
      });
      
    } catch (error) {
      logger.error('Delete course error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to delete course',
      }, 500);
    }
  }
);

/**
 * GET /api/v1/courses/stats/overview
 * Get course statistics — paginated counts, no full table scan
 */
coursesRouter.get('/stats/overview', async (c) => {
  try {
    const pb = getPocketBase();

    const [
      all, ug, pg, dip, cert,
      published, draft, archived,
    ] = await Promise.all([
      pb.collection('courses').getList(1, 1),
      pb.collection('courses').getList(1, 1, { filter: 'level = "Undergraduate"' }),
      pb.collection('courses').getList(1, 1, { filter: 'level = "Postgraduate"' }),
      pb.collection('courses').getList(1, 1, { filter: 'level = "Diploma"' }),
      pb.collection('courses').getList(1, 1, { filter: 'level = "Certificate"' }),
      pb.collection('courses').getList(1, 1, { filter: 'status = "Published"' }),
      pb.collection('courses').getList(1, 1, { filter: 'status = "Draft"' }),
      pb.collection('courses').getList(1, 1, { filter: 'status = "Archived"' }),
    ]);

    // Fetch credits for sum (bounded to 1000 courses)
    const creditRecords = await pb.collection('courses').getList(1, 1000, { fields: 'faculty,credits' });
    const courses = creditRecords.items as unknown as Course[];

    const stats = {
      total: all.totalItems,
      byLevel: {
        Undergraduate: ug.totalItems,
        Postgraduate: pg.totalItems,
        Diploma: dip.totalItems,
        Certificate: cert.totalItems,
      },
      byStatus: {
        Published: published.totalItems,
        Draft: draft.totalItems,
        Archived: archived.totalItems,
      },
      byFaculty: courses.reduce((acc: Record<string, number>, c: Course) => {
        acc[c.faculty] = (acc[c.faculty] || 0) + 1;
        return acc;
      }, {}),
      totalCredits: courses.reduce((sum: number, c: Course) => sum + (c.credits || 0), 0),
    };

    return c.json<ApiResponse<typeof stats>>({ success: true, data: stats });

  } catch (error) {
    logger.error('Get course stats error:', error);
    return c.json<ApiResponse<never>>({ success: false, error: 'Failed to fetch statistics' }, 500);
  }
});

export default coursesRouter;
