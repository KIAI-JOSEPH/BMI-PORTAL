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

function mapCourseRecord(record: Record<string, unknown>): Course {
  return {
    id: String(record.id),
    name: String(record.title ?? record.name ?? ''),
    code: String(record.course_code ?? record.code ?? ''),
    faculty: String(record.faculty ?? ''),
    department: String(record.department ?? ''),
    level: (record.level as Course['level']) || 'Undergraduate',
    credits: Number(record.credits ?? 0),
    status: (record.status as Course['status']) || 'Published',
    description: String(record.description ?? ''),
    syllabus: String(record.syllabus ?? ''),
    created: String(record.created ?? ''),
    updated: String(record.updated ?? ''),
  } as Course;
}

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

type CourseCreate = z.infer<typeof courseSchema>;
type CourseUpdate = z.infer<typeof updateCourseSchema>;

function courseDtoToPb(data: CourseCreate) {
  return {
    course_code: data.code,
    title: data.name,
    credits: data.credits,
    faculty: data.faculty,
    department: data.department,
    level: data.level,
    status: data.status,
    description: data.description,
    syllabus: data.syllabus,
    is_elective: false,
  };
}

function coursePatchToPb(data: CourseUpdate): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.name !== undefined) out.title = data.name;
  if (data.code !== undefined) out.course_code = data.code;
  if (data.faculty !== undefined) out.faculty = data.faculty;
  if (data.department !== undefined) out.department = data.department;
  if (data.level !== undefined) out.level = data.level;
  if (data.credits !== undefined) out.credits = data.credits;
  if (data.status !== undefined) out.status = data.status;
  if (data.description !== undefined) out.description = data.description;
  if (data.syllabus !== undefined) out.syllabus = data.syllabus;
  return out;
}

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
      { page: 1, perPage: 20, maxPerPage: 500 }
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
      filters.push(`(title ~ "${s}" || course_code ~ "${s}" || description ~ "${s}")`);
    }
    
    const filterString = filters.join(' && ') || undefined;
    
    const result = await pb.collection('courses').getList(page, perPage, {
      filter: filterString,
      sort: '-created',
    });
    
    return c.json<ApiResponse<Course[]>>({
      success: true,
      data: result.items.map((r) => mapCourseRecord(r as unknown as Record<string, unknown>)),
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
 * GET /api/v1/courses/stats/overview (before /:id)
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

    const creditRecords = await pb.collection('courses').getList(1, 1000, { fields: 'faculty,credits' });
    const courses = creditRecords.items.map((r) => mapCourseRecord(r as unknown as Record<string, unknown>));

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
        const f = c.faculty || 'Unknown';
        acc[f] = (acc[f] || 0) + 1;
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
      data: mapCourseRecord(course as unknown as Record<string, unknown>),
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
        filter: `course_code = "${data.code.replace(/["'\\]/g, '')}"`,
      });
      
      if (existing.items.length > 0) {
        return c.json<ApiResponse<never>>({
          success: false,
          error: 'Course code already exists',
        }, 409);
      }
      
      const newCourse = await pb.collection('courses').create(courseDtoToPb(data));
      
      logger.info('Course created', { courseId: newCourse.id });
      
      return c.json<ApiResponse<Course>>({
        success: true,
        data: mapCourseRecord(newCourse as unknown as Record<string, unknown>),
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
      
      const updated = await pb.collection('courses').update(id, coursePatchToPb(data));
      
      logger.info('Course updated', { courseId: id });
      
      return c.json<ApiResponse<Course>>({
        success: true,
        data: mapCourseRecord(updated as unknown as Record<string, unknown>),
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

export default coursesRouter;
