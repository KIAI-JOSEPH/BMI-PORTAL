// BMI UMS - Students Routes
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getPocketBase, authenticateAdmin } from '../services/pocketbase.js';
import { authMiddleware, requireRole, getUser } from '../middleware/auth.js';
import { auditMiddleware, logAction } from '../middleware/audit.js';
import { logger } from '../utils/logger.js';
import { generateAvatarColor, parsePagination } from '../utils/helpers.js';
import type { ApiResponse, Student } from '../types/index.js';

const studentsRouter = new Hono();

// Apply auth middleware to all routes
studentsRouter.use('*', authMiddleware);
studentsRouter.use('*', auditMiddleware);

// Validation schemas
const studentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  gender: z.enum(['Male', 'Female']),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(10).optional().or(z.literal('')),
  nationality: z.string().optional(),
  faculty: z.string().min(1),
  department: z.string().min(1),
  careerPath: z.string().min(1),
  academicLevel: z.enum(['Diploma', 'Degree', 'Masters', 'PhD']),
  admissionYear: z.string().min(4),
  enrollmentTerm: z.string().min(1),
  status: z.enum(['Active', 'Applicant', 'On Leave', 'Graduated', 'Suspended']).default('Applicant'),
  standing: z.enum(['Honor Roll', 'Good', 'Probation', 'Warning']).default('Good'),
  gpa: z.number().min(0).max(4).default(0),
});

const updateStudentSchema = studentSchema.partial();

/**
 * GET /api/v1/students
 * List all students with pagination and filtering
 */
studentsRouter.get('/', requireRole('admin', 'registrar', 'faculty', 'staff'), async (c) => {
  try {
    const pb = getPocketBase();
    
    // Check if PocketBase is authenticated, re-authenticate if needed
    if (!pb.authStore.isValid) {
      logger.warn('PocketBase auth expired, re-authenticating...');
      await authenticateAdmin();
    }
    
    // Parse query parameters
    const { page, perPage, offset } = parsePagination(
      c.req.query('page'),
      c.req.query('perPage'),
      { page: 1, perPage: 20, maxPerPage: 100 }
    );
    
    const faculty = c.req.query('faculty');
    const status = c.req.query('status');
    const search = c.req.query('search');

    // Sanitize inputs — strip PocketBase filter special chars to prevent injection
    const safe = (v: string) => v.replace(/["'\\]/g, '');

    // Build filter
    const filters: string[] = [];
    if (faculty) filters.push(`faculty = "${safe(faculty)}"`);
    if (status) filters.push(`status = "${safe(status)}"`);
    if (search) {
      const s = safe(search).substring(0, 100); // cap search length
      filters.push(`(firstName ~ "${s}" || lastName ~ "${s}" || email ~ "${s}")`);
    }
    
    const filterString = filters.length > 0 ? filters.join(' && ') : '';
    
    // Fetch students - only include filter if we have one
    const queryOptions: { sort: string; filter?: string } = { sort: '-created' };
    if (filterString) {
      queryOptions.filter = filterString;
    }
    
    const result = await pb.collection('students').getList(page, perPage, queryOptions);
    
    return c.json<ApiResponse<Student[]>>({
      success: true,
      data: result.items as unknown as Student[],
      meta: {
        page: result.page,
        perPage: result.perPage,
        total: result.totalItems,
      },
    });
    
  } catch (error) {
    logger.error('Get students error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch students',
    }, 500);
  }
});

/**
 * GET /api/v1/students/:id
 * Get a single student by ID
 */
studentsRouter.get('/:id', async (c) => {
    const id = c.req.param('id');
    const user = getUser(c);
    
    // Students can only access their own record
    if (user?.role === 'student' && user.studentId !== id) {
      return c.json({ success: false, error: 'Forbidden' }, 403);
    }
  try {
    const pb = getPocketBase();
    
    const student = await pb.collection('students').getOne(id);
    
    return c.json<ApiResponse<Student>>({
      success: true,
      data: student as unknown as Student,
    });
    
  } catch (error) {
    logger.error('Get student error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Student not found',
    }, 404);
  }
});

/**
 * POST /api/v1/students
 * Create a new student
 */
studentsRouter.post(
  '/',
  requireRole('admin', 'registrar'),
  zValidator('json', studentSchema),
  logAction('CREATE', 'students'),
  async (c) => {
    try {
      const data = c.req.valid('json');
      const pb = getPocketBase();
      
      // Generate student ID (as a custom field, not the PocketBase ID)
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
      const studentId = `BMI-${year}-${randomSuffix}`;
      
      // Generate avatar color
      const avatarColor = generateAvatarColor(`${data.firstName} ${data.lastName}`);
      
      const newStudent = await pb.collection('students').create({
        ...data,
        studentId,  // Store as studentId field, not id
        avatarColor,
        photoZoom: 1,
        photoPosition: { x: 0, y: 0 },
      });
      
      logger.info('Student created', { studentId: newStudent.id });
      
      return c.json<ApiResponse<Student>>({
        success: true,
        data: newStudent as unknown as Student,
        message: 'Student created successfully',
      }, 201);
      
    } catch (error) {
      logger.error('Create student error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to create student',
      }, 500);
    }
  }
);

/**
 * PATCH /api/v1/students/:id
 * Update a student
 */
studentsRouter.patch(
  '/:id',
  requireRole('admin', 'registrar', 'staff'),
  zValidator('json', updateStudentSchema),
  logAction('UPDATE', 'students'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const pb = getPocketBase();
      
      const updated = await pb.collection('students').update(id, data);
      
      logger.info('Student updated', { studentId: id });
      
      return c.json<ApiResponse<Student>>({
        success: true,
        data: updated as unknown as Student,
        message: 'Student updated successfully',
      });
      
    } catch (error) {
      logger.error('Update student error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to update student',
      }, 500);
    }
  }
);

/**
 * DELETE /api/v1/students/:id
 * Delete a student
 */
studentsRouter.delete(
  '/:id',
  requireRole('admin'),
  logAction('DELETE', 'students'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const pb = getPocketBase();
      
      await pb.collection('students').delete(id);
      
      logger.info('Student deleted', { studentId: id });
      
      return c.json<ApiResponse<null>>({
        success: true,
        data: null,
        message: 'Student deleted successfully',
      });
      
    } catch (error) {
      logger.error('Delete student error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to delete student',
      }, 500);
    }
  }
);

/**
 * GET /api/v1/students/stats
 * Get student statistics
 */
studentsRouter.get('/stats/overview', async (c) => {
  try {
    const pb = getPocketBase();
    
    // Get all students
    const allStudents = await pb.collection('students').getFullList();
    const students = allStudents as unknown as Student[];
    
    const stats = {
      total: students.length,
      active: students.filter(s => s.status === 'Active').length,
      applicants: students.filter(s => s.status === 'Applicant').length,
      graduated: students.filter(s => s.status === 'Graduated').length,
      suspended: students.filter(s => s.status === 'Suspended').length,
      byFaculty: {
        Theology: students.filter(s => s.faculty === 'Theology').length,
        ICT: students.filter(s => s.faculty === 'ICT').length,
        Business: students.filter(s => s.faculty === 'Business').length,
        Education: students.filter(s => s.faculty === 'Education').length,
      },
      byLevel: {
        Diploma: students.filter(s => s.academicLevel === 'Diploma').length,
        Degree: students.filter(s => s.academicLevel === 'Degree').length,
        Masters: students.filter(s => s.academicLevel === 'Masters').length,
        PhD: students.filter(s => s.academicLevel === 'PhD').length,
      },
    };
    
    return c.json<ApiResponse<typeof stats>>({
      success: true,
      data: stats,
    });
    
  } catch (error) {
    logger.error('Get student stats error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch statistics',
    }, 500);
  }
});

export default studentsRouter;


