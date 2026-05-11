import { randomBytes } from 'crypto';
import { sanitizeFilter } from '../utils/helpers';
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

function mapStaffRecord(record: Record<string, unknown>): StaffMember {
  const fn = String(record.first_name ?? '');
  const ln = String(record.last_name ?? '');
  const full = `${fn} ${ln}`.trim();
  return {
    id: String(record.id),
    name: full || String(record.name ?? 'Staff'),
    role: String(record.role ?? ''),
    department: String(record.department ?? ''),
    email: String(record.email ?? ''),
    phone: String(record.phone ?? ''),
    status: (record.status as StaffMember['status']) || 'Full-time',
    category: (record.category as StaffMember['category']) || 'Academic',
    specialization: String(record.specialization ?? ''),
    office: String(record.office ?? ''),
    officeHours: String(record.office_hours ?? record.officeHours ?? ''),
    avatarColor: String(record.avatar_color ?? record.avatarColor ?? 'bg-purple-700'),
    joinDate: String(record.join_date ?? record.joinDate ?? ''),
    created: String(record.created ?? ''),
    updated: String(record.updated ?? ''),
  } as StaffMember;
}

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

type StaffCreate = z.infer<typeof staffSchema>;
type StaffUpdate = z.infer<typeof updateStaffSchema>;

function staffDtoToPb(data: StaffCreate, id: string, avatarColor: string) {
  const parts = data.name.trim().split(/\s+/);
  const first_name = parts[0] || 'Staff';
  const last_name = parts.slice(1).join(' ') || 'Member';
  return {
    id,
    staff_number: id,
    first_name,
    last_name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    department: data.department,
    category: data.category,
    specialization: data.specialization,
    office: data.office,
    office_hours: data.officeHours,
    status: data.status,
    join_date: data.joinDate,
    avatar_color: avatarColor,
  };
}

function patchDtoToPb(data: StaffUpdate): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  if (data.officeHours !== undefined) {
    out.office_hours = data.officeHours;
    delete out.officeHours;
  }
  if (data.joinDate !== undefined) {
    out.join_date = data.joinDate;
    delete out.joinDate;
  }
  if (data.name !== undefined) {
    const parts = data.name.trim().split(/\s+/);
    out.first_name = parts[0] || 'Staff';
    out.last_name = parts.slice(1).join(' ') || 'Member';
    delete out.name;
  }
  return out;
}

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
      { page: 1, perPage: 20, maxPerPage: 500 }
    );
    
    const department = c.req.query('department');
    const category = c.req.query('category');
    const status = c.req.query('status');
    const search = c.req.query('search');

    const filters: string[] = [];
    if (department) filters.push(`department = "${sanitizeFilter(department)}"`);
    if (category) filters.push(`category = "${sanitizeFilter(category)}"`);
    if (status) filters.push(`status = "${sanitizeFilter(status)}"`);
    if (search) {
      const s = sanitizeFilter(search);
      filters.push(`(first_name ~ "${s}" || last_name ~ "${s}" || email ~ "${s}" || role ~ "${s}")`);
    }
    
    const filterString = filters.join(' && ') || undefined;
    
    const result = await pb.collection('staff').getList(page, perPage, {
      filter: filterString,
      sort: '-created',
    });
    
    return c.json<ApiResponse<StaffMember[]>>({
      success: true,
      data: result.items.map((r) => mapStaffRecord(r as unknown as Record<string, unknown>)),
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
 * GET /api/v1/staff/stats/overview
 * (Registered before /:id so "stats" is not captured as an id.)
 */
staffRouter.get('/stats/overview', async (c) => {
  try {
    const pb = getPocketBase();

    const [all, academic, admin, mgmt, fulltime, parttime, onleave] = await Promise.all([
      pb.collection('staff').getList(1, 1),
      pb.collection('staff').getList(1, 1, { filter: 'category = "Academic"' }),
      pb.collection('staff').getList(1, 1, { filter: 'category = "Administrative"' }),
      pb.collection('staff').getList(1, 1, { filter: 'category = "Management"' }),
      pb.collection('staff').getList(1, 1, { filter: 'status = "Full-time"' }),
      pb.collection('staff').getList(1, 1, { filter: 'status = "Part-time"' }),
      pb.collection('staff').getList(1, 1, { filter: 'status = "On Leave"' }),
    ]);

    const deptRecords = await pb.collection('staff').getList(1, 500, { fields: 'department' });
    const byDepartment = deptRecords.items.reduce((acc: Record<string, number>, s) => {
      const rec = s as unknown as { department?: string };
      const d = String(rec.department || '');
      if (d) acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});

    const stats = {
      total: all.totalItems,
      byCategory: {
        Academic: academic.totalItems,
        Administrative: admin.totalItems,
        Management: mgmt.totalItems,
      },
      byStatus: {
        'Full-time': fulltime.totalItems,
        'Part-time': parttime.totalItems,
        'On Leave': onleave.totalItems,
      },
      byDepartment,
    };

    return c.json<ApiResponse<typeof stats>>({ success: true, data: stats });
  } catch (error) {
    logger.error('Get staff stats error:', error);
    return c.json<ApiResponse<never>>({ success: false, error: 'Failed to fetch statistics' }, 500);
  }
});

staffRouter.get('/meta/departments', async (c) => {
  try {
    const pb = getPocketBase();
    const records = await pb.collection('staff').getList(1, 500, { fields: 'department' });
    const departments = [
      ...new Set(
        records.items
          .map((s) => String((s as { department?: string }).department || ''))
          .filter(Boolean)
      ),
    ].sort();
    return c.json<ApiResponse<string[]>>({ success: true, data: departments });
  } catch (error) {
    logger.error('Get departments error:', error);
    return c.json<ApiResponse<never>>({ success: false, error: 'Failed to fetch departments' }, 500);
  }
});

/**
 * GET /api/v1/staff/:id
 * Get a single staff member
 */
staffRouter.get('/:id', async (c) => {
  try {
    const pb = getPocketBase();
    
    const id = c.req.param('id');
    const staff = await pb.collection('staff').getOne(id);
    
    return c.json<ApiResponse<StaffMember>>({
      success: true,
      data: mapStaffRecord(staff as unknown as Record<string, unknown>),
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
      const randomSuffix = randomBytes(2).readUInt16BE(0) % 900 + 100;
      const staffId = `STF-${year}-${randomSuffix}`;
      
      // Generate avatar color
      const avatarColor = generateAvatarColor(data.name);
      
      const newStaff = await pb.collection('staff').create(
        staffDtoToPb(data, staffId, avatarColor)
      );
      
      logger.info('Staff member created', { staffId: newStaff.id });
      
      return c.json<ApiResponse<StaffMember>>({
        success: true,
        data: mapStaffRecord(newStaff as unknown as Record<string, unknown>),
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
      
      const updated = await pb.collection('staff').update(id, patchDtoToPb(data));
      
      logger.info('Staff member updated', { staffId: id });
      
      return c.json<ApiResponse<StaffMember>>({
        success: true,
        data: mapStaffRecord(updated as unknown as Record<string, unknown>),
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

export default staffRouter;


