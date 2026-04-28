// BMI UMS - Staff Routes
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getPocketBase } from '../services/pocketbase.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { auditMiddleware, logAction } from '../middleware/audit.js';
import { logger } from '../utils/logger.js';
import { generateAvatarColor, parsePagination } from '../utils/helpers.js';
import type { ApiResponse, StaffMember } from '../types/index.js';

const staffRouter = new Hono();

// Apply auth middleware
staffRouter.use('*', authMiddleware);
staffRouter.use('*', auditMiddleware);

// Validation schemas
const staffSchema = z.object({
  name: z.string().min(2),
  role: z.string().min(1),
  department: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  status: z.enum(['Full-time', 'Part-time', 'On Leave']).default('Full-time'),
  category: z.enum(['Academic', 'Administrative', 'Management']).default('Academic'),
  specialization: z.string().min(1),
  office: z.string().min(1),
  officeHours: z.string().min(1),
  joinDate: z.string().min(1),
});

const updateStaffSchema = staffSchema.partial();

/**
 * GET /api/v1/staff
 * List all staff with pagination and filtering
 */
staffRouter.get('/', async (c) => {
  try {
    const pb = getPocketBase();
    
    const { page, perPage } = parsePagination(
      c.req.query('page'),
      c.req.query('perPage'),
      { page: 1, perPage: 20, maxPerPage: 100 }
    );
    
    const department = c.req.query('department');
    const category = c.req.query('category');
    const status = c.req.query('status');
    const search = c.req.query('search');
    
    // Build filter
    const filters: string[] = [];
    if (department) filters.push(`department = "${department}"`);
    if (category) filters.push(`category = "${category}"`);
    if (status) filters.push(`status = "${status}"`);
    if (search) {
      filters.push(`(name ~ "${search}" || email ~ "${search}" || role ~ "${search}")`);
    }
    
    const filterString = filters.join(' && ') || undefined;
    
    const result = await pb.collection('staff').getList(page, perPage, {
      filter: filterString,
      sort: '-created',
    });
    
    return c.json<ApiResponse<StaffMember[]>>({
      success: true,
      data: result.items as unknown as StaffMember[],
      meta: {
        page: result.page,
        perPage: result.perPage,
        total: result.totalItems,
      },
    });
    
  } catch (error) {
    logger.error('Get staff error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch staff',
    }, 500);
  }
});

/**
 * GET /api/v1/staff/:id
 * Get a single staff member
 */
staffRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const pb = getPocketBase();
    
    const staff = await pb.collection('staff').getOne(id);
    
    return c.json<ApiResponse<StaffMember>>({
      success: true,
      data: staff as unknown as StaffMember,
    });
    
  } catch (error) {
    logger.error('Get staff member error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Staff member not found',
    }, 404);
  }
});

/**
 * POST /api/v1/staff
 * Create a new staff member
 */
staffRouter.post(
  '/',
  requireRole('admin', 'registrar'),
  zValidator('json', staffSchema),
  logAction('CREATE', 'staff'),
  async (c) => {
    try {
      const data = c.req.valid('json');
      const pb = getPocketBase();
      
      // Generate staff ID
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(Math.random() * 900) + 100;
      const staffId = `STF-${year}-${randomSuffix}`;
      
      // Generate avatar color
      const avatarColor = generateAvatarColor(data.name);
      
      const newStaff = await pb.collection('staff').create({
        id: staffId,
        ...data,
        avatarColor,
      });
      
      logger.info('Staff member created', { staffId: newStaff.id });
      
      return c.json<ApiResponse<StaffMember>>({
        success: true,
        data: newStaff as unknown as StaffMember,
        message: 'Staff member created successfully',
      }, 201);
      
    } catch (error) {
      logger.error('Create staff error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to create staff member',
      }, 500);
    }
  }
);

/**
 * PATCH /api/v1/staff/:id
 * Update a staff member
 */
staffRouter.patch(
  '/:id',
  requireRole('admin', 'registrar'),
  zValidator('json', updateStaffSchema),
  logAction('UPDATE', 'staff'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const pb = getPocketBase();
      
      const updated = await pb.collection('staff').update(id, data);
      
      logger.info('Staff member updated', { staffId: id });
      
      return c.json<ApiResponse<StaffMember>>({
        success: true,
        data: updated as unknown as StaffMember,
        message: 'Staff member updated successfully',
      });
      
    } catch (error) {
      logger.error('Update staff error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to update staff member',
      }, 500);
    }
  }
);

/**
 * DELETE /api/v1/staff/:id
 * Delete a staff member
 */
staffRouter.delete(
  '/:id',
  requireRole('admin'),
  logAction('DELETE', 'staff'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const pb = getPocketBase();
      
      await pb.collection('staff').delete(id);
      
      logger.info('Staff member deleted', { staffId: id });
      
      return c.json<ApiResponse<null>>({
        success: true,
        data: null,
        message: 'Staff member deleted successfully',
      });
      
    } catch (error) {
      logger.error('Delete staff error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to delete staff member',
      }, 500);
    }
  }
);

/**
 * GET /api/v1/staff/stats/overview
 * Get staff statistics
 */
staffRouter.get('/stats/overview', async (c) => {
  try {
    const pb = getPocketBase();
    
    const allStaff = await pb.collection('staff').getFullList();
    const staff = allStaff as unknown as StaffMember[];
    
    const stats = {
      total: staff.length,
      byCategory: {
        Academic: staff.filter(s => s.category === 'Academic').length,
        Administrative: staff.filter(s => s.category === 'Administrative').length,
        Management: staff.filter(s => s.category === 'Management').length,
      },
      byStatus: {
        'Full-time': staff.filter(s => s.status === 'Full-time').length,
        'Part-time': staff.filter(s => s.status === 'Part-time').length,
        'On Leave': staff.filter(s => s.status === 'On Leave').length,
      },
      byDepartment: staff.reduce((acc, s) => {
        acc[s.department] = (acc[s.department] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
    
    return c.json<ApiResponse<typeof stats>>({
      success: true,
      data: stats,
    });
    
  } catch (error) {
    logger.error('Get staff stats error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch statistics',
    }, 500);
  }
});

/**
 * GET /api/v1/staff/departments
 * Get all unique departments
 */
staffRouter.get('/meta/departments', async (c) => {
  try {
    const pb = getPocketBase();
    const staff = await pb.collection('staff').getFullList() as unknown as StaffMember[];
    
    const departments = [...new Set(staff.map(s => s.department))].sort();
    
    return c.json<ApiResponse<string[]>>({
      success: true,
      data: departments,
    });
    
  } catch (error) {
    logger.error('Get departments error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch departments',
    }, 500);
  }
});

export default staffRouter;
