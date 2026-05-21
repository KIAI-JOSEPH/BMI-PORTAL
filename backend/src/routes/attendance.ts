import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { getPocketBase } from '../services/pocketbase.js';
import { authMiddleware, requireRole, getUser } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import type { ApiResponse } from '../types/index.js';

const attendanceRouter = new Hono();
attendanceRouter.use('*', authMiddleware);

const bulkAttendanceSchema = z.object({
  course_id: z.string().min(1),
  term_id: z.string().min(1),
  session_date: z.string().min(1),
  week_number: z.number().int().positive().optional(),
  session_type: z.enum(['lecture', 'seminar', 'lab', 'practicum', 'field_education', 'thesis', 'intensive', 'online']).optional().default('lecture'),
  records: z.array(z.object({
    enrollment_id: z.string().min(1),
    student_id: z.string().min(1),
    status: z.enum(['present', 'absent', 'excused', 'late']),
    notes: z.string().optional(),
  })).min(1),
});

// GET /api/v1/attendance
attendanceRouter.get('/', async (c) => {
  try {
    const pb = getPocketBase();
    const courseId = c.req.query('course_id') || c.req.query('courseId');
    const date = c.req.query('date') || c.req.query('session_date');

    const filters: string[] = [];
    if (courseId) filters.push(`course_id = "${courseId}"`);
    if (date) filters.push(`session_date ~ "${date}"`); // Use prefix/regex or exact date match

    const filterString = filters.length > 0 ? filters.join(' && ') : '';

    const records = await pb.collection('attendance_records').getFullList({
      sort: '-session_date',
      ...(filterString ? { filter: filterString } : {}),
      expand: 'student_id,course_id,enrollment_id,term_id',
    });

    return c.json<ApiResponse<any[]>>({
      success: true,
      data: records,
    });
  } catch (error) {
    logger.error('List attendance error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch attendance records',
      },
    }, 500);
  }
});

// GET /api/v1/attendance/student/:id
// Get a student's attendance summary and history
attendanceRouter.get('/student/:id', async (c) => {
  try {
    const studentId = c.req.param('id');
    const pb = getPocketBase();

    const records = await pb.collection('attendance_records').getFullList({
      filter: `student_id = "${studentId}"`,
      sort: '-session_date',
      expand: 'course_id',
    });

    // Compute summary
    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      excused: records.filter(r => r.status === 'excused').length,
      late: records.filter(r => r.status === 'late').length,
      rate: 0,
    };

    if (summary.total > 0) {
      // Present and Late are considered attended
      const attended = summary.present + summary.late;
      summary.rate = Math.round((attended / (summary.total - summary.excused)) * 100);
    }

    return c.json<ApiResponse<any>>({
      success: true,
      data: {
        summary,
        history: records,
      },
    });
  } catch (error) {
    logger.error('Student attendance error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch student attendance summary',
      },
    }, 500);
  }
});

// POST /api/v1/attendance/bulk
// Submit/update attendance in bulk for a class session
attendanceRouter.post('/bulk', requireRole('admin', 'registrar', 'faculty', 'staff'), zValidator('json', bulkAttendanceSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const pb = getPocketBase();
    const user = getUser(c);

    const createdRecords: any[] = [];

    for (const record of data.records) {
      // Find if duplicate record exists for this student on this day
      let existingRecord;
      try {
        existingRecord = await pb.collection('attendance_records').getFirstListItem(
          `student_id = "${record.student_id}" && course_id = "${data.course_id}" && session_date ~ "${data.session_date.split('T')[0]}"`
        );
      } catch {
        existingRecord = null;
      }

      const payload = {
        enrollment_id: record.enrollment_id,
        student_id: record.student_id,
        course_id: data.course_id,
        term_id: data.term_id,
        session_date: data.session_date,
        week_number: data.week_number,
        session_type: data.session_type,
        status: record.status,
        notes: record.notes,
        recorded_by: user?.id,
      };

      if (existingRecord) {
        // Update existing record
        const updated = await pb.collection('attendance_records').update(existingRecord.id, payload);
        createdRecords.push(updated);
      } else {
        // Create new record
        const created = await pb.collection('attendance_records').create(payload);
        createdRecords.push(created);
      }
    }

    return c.json<ApiResponse<any[]>>({
      success: true,
      data: createdRecords,
    }, 201);
  } catch (error) {
    logger.error('Bulk attendance error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to record session attendance',
      },
    }, 500);
  }
});

export default attendanceRouter;
