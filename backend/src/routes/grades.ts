import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { getPocketBase } from '../services/pocketbase.js';
import { authMiddleware, requireRole, getUser } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { sheetsSyncQueue } from '../services/sheetsSyncQueue.js';
import type { ApiResponse } from '../types/index.js';

const gradeRouter = new Hono();
gradeRouter.use('*', authMiddleware);

const GRADE_SCALE = [
  { min: 70, letter: 'A',  points: 4.0 },
  { min: 65, letter: 'B+', points: 3.5 },
  { min: 60, letter: 'B',  points: 3.0 },
  { min: 55, letter: 'C+', points: 2.5 },
  { min: 50, letter: 'C',  points: 2.0 },
  { min: 45, letter: 'D',  points: 1.0 },
  { min: 0,  letter: 'F',  points: 0.0 },
];

function computeGrade(totalScore: number, maxScore = 100) {
  const pct = (totalScore / maxScore) * 100;
  const grade = GRADE_SCALE.find(g => pct >= g.min) ?? GRADE_SCALE[GRADE_SCALE.length - 1];
  return { percentage: pct, letterGrade: grade.letter, gradePoints: grade.points };
}

const GradeSubmitSchema = z.object({
  enrollmentId: z.string().min(1),
  cat1Score: z.number().min(0).max(100).optional(),
  cat2Score: z.number().min(0).max(100).optional(),
  assignmentScore: z.number().min(0).max(100).optional(),
  examScore: z.number().min(0).max(100),
  remarks: z.string().optional(),
}).transform((data) => {
  // Strip percentage if accidentally sent by old client code
  const { percentage, ...clean } = data as any;
  return clean;
});

// GET /api/v1/grades
// Query transcript (?student_id=) or grade sheet (?course_id=&term_id=)
gradeRouter.get('/', async (c) => {
  try {
    const pb = getPocketBase();
    const studentId = c.req.query('student_id') || c.req.query('studentId');
    const courseId = c.req.query('course_id') || c.req.query('courseId');
    const termId = c.req.query('term_id') || c.req.query('termId');

    const filters: string[] = [];
    if (studentId) filters.push(`student_id = "${studentId}"`);
    if (courseId) filters.push(`course_id = "${courseId}"`);
    if (termId) filters.push(`term_id = "${termId}"`);

    const filterString = filters.length > 0 ? filters.join(' && ') : '';

    const grades = await pb.collection('grades').getFullList({
      sort: '-created',
      ...(filterString ? { filter: filterString } : {}),
      expand: 'student_id,course_id,term_id,enrollment_id',
    });

    // Map output to include computed percentage at runtime
    const data = grades.map(g => {
      const pct = (g.total_score / 100) * 100; // Total score out of 100
      return {
        ...g,
        percentage: pct,
      };
    });

    return c.json<ApiResponse<any[]>>({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('List grades error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch grades',
      },
    }, 500);
  }
});

// GET /api/v1/grades/transcript/:studentId
gradeRouter.get('/transcript/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId');
    const pb = getPocketBase();

    const grades = await pb.collection('grades').getFullList({
      filter: `student_id = "${studentId}" && status = "released"`,
      sort: 'academic_year,semester_number',
      expand: 'course_id,term_id',
    });

    const data = grades.map(g => {
      const pct = (g.total_score / 100) * 100;
      return {
        ...g,
        percentage: pct,
      };
    });

    return c.json<ApiResponse<any[]>>({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Get transcript error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch transcript',
      },
    }, 500);
  }
});

// POST /api/v1/grades
gradeRouter.post('/', requireRole('admin', 'registrar', 'faculty'), zValidator('json', GradeSubmitSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const pb = getPocketBase();

    // Fetch the enrollment
    const enrollment = await pb.collection('enrollments').getOne(data.enrollmentId);
    if (!enrollment) {
      return c.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'ENROLLMENT_NOT_FOUND',
          message: 'Enrollment record not found',
        },
      }, 404);
    }

    // Compute grades
    const total = (data.cat1Score ?? 0) + (data.cat2Score ?? 0) +
                  (data.assignmentScore ?? 0) + data.examScore;
    const { letterGrade, gradePoints } = computeGrade(total);

    const user = getUser(c);

    // Save to database (NO percentage field is saved)
    const gradeRecord = await pb.collection('grades').create({
      enrollment_id: enrollment.id,
      student_id: enrollment.student_id,
      course_id: enrollment.course_id,
      term_id: enrollment.term_id,
      academic_year: enrollment.academic_year || '2024/2025',
      semester_number: enrollment.semester_number || 1,
      cat_1_score: data.cat1Score,
      cat_2_score: data.cat2Score,
      assignment_score: data.assignmentScore,
      exam_score: data.examScore,
      total_score: total,
      letter_grade: letterGrade,
      grade_points: gradePoints,
      status: 'submitted',
      remarks: data.remarks,
      graded_by: user?.id,
      graded_at: new Date().toISOString(),
    });

    try {
      sheetsSyncQueue.enqueueGradeSync(gradeRecord.id);
    } catch (err) {
      logger.warn('Failed to enqueue sheets sync (non-blocking):', err);
    }

    return c.json<ApiResponse<any>>({
      success: true,
      data: gradeRecord,
    }, 201);
  } catch (error) {
    logger.error('Submit grade error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to submit grade record',
      },
    }, 500);
  }
});

// PATCH /api/v1/grades/:id/approve
gradeRouter.patch('/:id/approve', requireRole('admin', 'registrar'), async (c) => {
  try {
    const id = c.req.param('id')!;
    const pb = getPocketBase();
    const user = getUser(c);

    const grade = await pb.collection('grades').update(id, {
      status: 'approved',
      approved_by: user?.id,
      approved_at: new Date().toISOString(),
    });

    try {
      sheetsSyncQueue.enqueueGradeSync(grade.id);
    } catch (err) {
      logger.warn('Failed to enqueue sheets sync (non-blocking):', err);
    }

    return c.json<ApiResponse<any>>({
      success: true,
      data: grade,
    });
  } catch (error) {
    logger.error('Approve grade error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to approve grade record',
      },
    }, 500);
  }
});

export default gradeRouter;
