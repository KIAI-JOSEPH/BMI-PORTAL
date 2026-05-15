/**
 * BMI UMS - Attendance Routes
 * API-backed CRUD for attendance tracking (previously localStorage-only).
 */
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { getPocketBase } from '../services/pocketbase.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import type { ApiResponse } from '../types/index.js';

const attendanceRouter = new Hono();
attendanceRouter.use('*', authMiddleware);

const attendanceRecordSchema = z.object({
  courseId: z.string().min(1),
  date: z.string(),
  records: z.array(z.object({
    studentId: z.string().min(1),
    studentName: z.string().min(1),
    status: z.enum(['Present', 'Absent', 'Late', 'Excused']),
  })).min(1),
});

// GET /api/v1/attendance
attendanceRouter.get('/', async (c) => {
  try {
    const pb = getPocketBase();
    const courseId = c.req.query('courseId');
    const date = c.req.query('date');

    let filter = '';
    if (courseId) filter += `courseId = "${courseId}"`;
    if (date) filter += (filter ? ' && ' : '') + `date = "${date}"`;

    const records = await pb.collection('attendance_records').getList(1, 100, {
      sort: '-date',
      ...(filter ? { filter } : {}),
    });
    return c.json<ApiResponse<any>>({ success: true, data: records.items });
  } catch (error) {
    logger.error('List attendance error:', error);
    return c.json<ApiResponse<never>>({ success: false, error: 'Failed to fetch attendance' }, 500);
  }
});

// POST /api/v1/attendance
attendanceRouter.post('/', requireRole('admin', 'faculty', 'staff'), zValidator('json', attendanceRecordSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const pb = getPocketBase();
    const record = await pb.collection('attendance_records').create(data);
    return c.json<ApiResponse<any>>({ success: true, data: record }, 201);
  } catch (error) {
    logger.error('Create attendance record error:', error);
    return c.json<ApiResponse<never>>({ success: false, error: 'Failed to create attendance record' }, 500);
  }
});

// PATCH /api/v1/attendance/:id
attendanceRouter.patch('/:id', requireRole('admin', 'faculty', 'staff'), zValidator('json', attendanceRecordSchema.partial()), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const pb = getPocketBase();
    const record = await pb.collection('attendance_records').update(id, data);
    return c.json<ApiResponse<any>>({ success: true, data: record });
  } catch (error) {
    logger.error('Update attendance record error:', error);
    return c.json<ApiResponse<never>>({ success: false, error: 'Failed to update attendance record' }, 500);
  }
});

export default attendanceRouter;
