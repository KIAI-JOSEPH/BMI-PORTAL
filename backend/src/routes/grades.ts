/**
 * BMI UMS - Grades API Routes (New Grading System)
 * Handles comprehensive grade management with weighted assessments
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { getPocketBase } from '../services/pocketbase.js';
import { logger } from '../utils/logger.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

import { calculateGradeResult } from '../utils/grading.js';
import { sanitizeFilter, parseName } from '../utils/helpers.js';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const gradeRouter = new Hono();
gradeRouter.use('*', authMiddleware);

type GradeComponentScore = {
  componentId: string;
  componentType: string;
  score: number;
  maxScore: number;
  weight: number;
  gradedAt?: string;
  feedback?: string;
};

function calculatePercentageFromComponents(components: GradeComponentScore[]): number {
  // Weighted average normalized to 0-100.
  // Formula matches the frontend WeightedGradeCalculator:
  // final = Σ((score/maxScore) * weight) / Σ(weight) * 100
  const totalWeight = components.reduce((sum, c) => sum + (c.weight || 0), 0);
  if (totalWeight <= 0) return 0;
  const weightedSum = components.reduce((sum, c) => {
    const normalized = c.maxScore > 0 ? c.score / c.maxScore : 0;
    return sum + normalized * (c.weight || 0);
  }, 0);
  return (weightedSum / totalWeight) * 100;
}

function mapExpandedGradeToFrontendShape(
  expanded: any,
  options: {
    components?: GradeComponentScore[];
    gradingScaleType?: string;
    status?: string;
    createdBy?: string;
  }
) {
  const student = expanded.expand?.student_id;
  const course   = expanded.expand?.course_id;
  const module   = course?.expand?.module_id;
  // campus may be nested under student expand
  const campus   = student?.expand?.campus_id;

  const percentage = typeof expanded.total_score === 'number' ? expanded.total_score : 0;
  const gradeCalc  = calculateGradeResult(percentage);

  const gradePoints  = typeof expanded.grade_point === 'number' ? expanded.grade_point : gradeCalc.gradePoints;
  const letterGrade  = expanded.grade || gradeCalc.letterGrade;
  const creditHours  = typeof course?.credit_hours === 'number'
    ? course.credit_hours
    : (typeof course?.credits === 'number' ? course.credits : 0);

  const names = parseName(student?.full_name || expanded.student_full_name);
  const studentName = student
    ? (`${student.first_name || names.first || ''} ${student.last_name || names.last || ''}`.trim() || student.full_name || 'Unknown')
    : 'Unknown Student';

  return {
    // ── Identity ──────────────────────────────────────────────────────────────
    id:         expanded.id,
    studentId:  student?.id  || expanded.student_id || '',
    courseId:   course?.id   || expanded.course_id  || '',

    // ── Student ───────────────────────────────────────────────────────────────
    studentName,
    studentCode:  student?.student_code || '',
    regNo:        student?.reg_no       || '',
    admissionNo:  student?.admission_no || student?.student_number || student?.student_code || 'Unknown',
    gender:       student?.gender       || '',
    campusName:   campus?.name          || '',
    campusId:     student?.campus_id    || '',

    // ── Course ────────────────────────────────────────────────────────────────
    courseCode: course?.code || course?.course_code || '',
    courseName: course?.title || course?.name || 'Unknown Course',
    credits:    creditHours,
    creditHours,
    category:   course?.category || '',
    module:     module?.name     || '',

    // ── Academic period ───────────────────────────────────────────────────────
    academicYear: expanded.academic_year || '2025',
    semester:     expanded.semester || module?.semester || '',

    // ── Grading ───────────────────────────────────────────────────────────────
    numericGrade:    percentage,
    percentage,
    total_score:     percentage,
    letterGrade,
    grade:           letterGrade,
    gradePoints,
    grade_point:     gradePoints,
    gpa:             gradePoints,
    remarks:         expanded.remarks || (percentage >= 50 ? 'Pass' : 'Fail'),
    ca_score:        expanded.ca_score  ?? null,
    exam_score:      expanded.exam_score ?? null,

    // ── Component scores (empty for bulk-imported data) ───────────────────────
    components:       options.components || [],
    gradingScaleId:   options.gradingScaleType || 'US_4_0',
    gradingScaleType: options.gradingScaleType || 'US_4_0',

    // ── Flags ─────────────────────────────────────────────────────────────────
    isRetake: false,
    status:   options.status || 'Verified',

    // ── Audit ─────────────────────────────────────────────────────────────────
    createdAt:      expanded.created,
    updatedAt:      expanded.updated,
    createdBy:      options.createdBy || 'system',
    lastModifiedBy: options.createdBy || 'system',
  };
}

// Component score schema
const componentScoreSchema = z.object({
  componentId: z.string(),
  componentType: z.string(),
  score: z.number().min(0),
  maxScore: z.number().min(1),
  weight: z.number().min(0).max(100),
  gradedAt: z.string().optional(),
  feedback: z.string().optional(),
});

// New comprehensive grade validation schema - relaxed for creation
const gradeSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  studentName: z.string().optional(),
  admissionNo: z.string().optional(),
  courseId: z.string().optional(),
  courseCode: z.string().min(1, 'Course code is required'),
  courseName: z.string().optional(),
  credits: z.number().optional(),
  gradingScaleId: z.string().optional(),
  gradingScaleType: z.string().optional(),
  components: z.array(componentScoreSchema).optional(),
  numericGrade: z.number().optional(),
  percentage: z.number().optional(), // Alias for numericGrade
  letterGrade: z.string().optional(),
  gradePoints: z.number().optional(),
  isRetake: z.boolean().optional().default(false),
  retakeAttemptNumber: z.number().optional(),
  replacedGradeId: z.string().optional(),
  academicYear: z.string(),
  semester: z.enum(['Fall', 'Spring', 'Summer']),
  status: z.string().optional().default('Pending Review'),
  percentileRank: z.number().optional(),
  specialGrade: z.string().optional(),
  incompleteDeadline: z.string().optional(),
  createdBy: z.string().optional(),
});

/**
 * POST /api/v1/grades
 * Create a new grade record with weighted assessments
 */
gradeRouter.post('/', requireRole('admin', 'registrar', 'faculty', 'staff'), async (c) => {
  try {
    const body = await c.req.json();
    const parsed = gradeSchema.safeParse(body);
    
    if (!parsed.success) {
      return c.json<ApiResponse<never>>({
        success: false,
        error: `Validation error: ${parsed.error.issues.map(e => e.message).join(', ')}`,
      }, 400);
    }

    const pb = getPocketBase();
    const data = parsed.data;

    // 1. Data Enrichment & Relational Mapping
    let studentId = data.studentId;
    let courseCode = data.courseCode;
    
    // Resolve/Create studentId if missing
    let studentUuid: string;
    try {
      const student = await pb.collection('students').getFirstListItem(`student_number="${studentId}" || id="${studentId}"`);
      studentUuid = student.id;
    } catch (e) {
      // Auto-create missing student (Permissive Mode)
      try {
        // Find first available program to satisfy relation requirement
        let programId = 'GENERAL';
        try {
          const programs = await pb.collection('programs').getList(1, 1);
          if (programs.items.length > 0) {
            programId = programs.items[0].id;
          }
        } catch (pe) {}

        const student = await pb.collection('students').create({
          student_number: studentId,
          first_name: data.studentName?.split(' ')[0] || 'Unknown',
          last_name: data.studentName?.split(' ').slice(1).join(' ') || 'Student',
          email: `${studentId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'student'}@example.com`,
          status: 'Active',
          program_code: programId,
        });
        studentUuid = student.id;
      } catch (err: any) {
        logger.error('Failed to auto-create student:', err);
        return c.json({ success: false, error: `Student ${studentId} not found and auto-creation failed: ${err.message}` }, 404);
      }
    }

    // Resolve/Create courseId if missing
    let courseUuid: string;
    try {
      const course = await pb.collection('courses').getFirstListItem(`course_code="${courseCode}"`);
      courseUuid = course.id;
    } catch (e) {
      // Auto-create missing course (Permissive Mode)
      try {
        const course = await pb.collection('courses').create({
          course_code: courseCode,
          title: data.courseName || courseCode,
          credits: data.credits || 3,
        });
        courseUuid = course.id;
      } catch (err) {
        courseUuid = courseCode; // Fallback
      }
    }

    // 2. Find or Create Enrollment
    let enrollmentId: string;
    try {
      // Try to find by UUIDs
      const enrollment = await pb.collection('enrollments').getFirstListItem(
        `student_number="${studentUuid}" && course_code="${courseUuid}" && academic_year="${data.academicYear}" && semester="${data.semester}"`
      );
      enrollmentId = enrollment.id;
    } catch (e) {
      // Create enrollment
      try {
        const enrollment = await pb.collection('enrollments').create({
          student_number: studentUuid,
          course_code: courseUuid,
          academic_year: data.academicYear,
          semester: data.semester,
        });
        enrollmentId = enrollment.id;
      } catch (err: any) {
        return c.json({ success: false, error: `Failed to link enrollment: ${err.message}` }, 500);
      }
    }

    // 3. Calculate Grade
    const numericGrade =
      data.numericGrade ??
      data.percentage ??
      (data.components && data.components.length > 0 ? calculatePercentageFromComponents(data.components as any) : 0);
    const { letterGrade, gradePoints } = calculateGradeResult(numericGrade);

    // 4. Create Grade Record (Relational)
    const gradeRecord = {
      enrollment_id: enrollmentId,
      percentage: numericGrade,
      grade_letter: letterGrade,
      gpa: gradePoints,
    };

    // Check if grade already exists for this enrollment
    try {
      const existing = await pb.collection('grades').getFirstListItem(`enrollment_id="${enrollmentId}"`);
      if (existing && !data.isRetake) {
        return c.json({ success: false, error: 'Grade already exists for this enrollment. Use update or mark as retake.' }, 409);
      }
    } catch (err) {}

    const created = await pb.collection('grades').create(gradeRecord);
    
    // 5. Fetch with expansion for the frontend
    const expanded = await pb.collection('grades').getOne(created.id, {
      expand: 'enrollment_id.student_number,enrollment_id.course_code',
    });

    const user = (c as any).get('user') as { email?: string; sub?: string } | undefined;
    const responseData = mapExpandedGradeToFrontendShape(expanded, {
      components: data.components as unknown as GradeComponentScore[] | undefined,
      gradingScaleType: data.gradingScaleType,
      status: data.status,
      createdBy: user?.email || user?.sub,
    });

    logger.info('Grade created and expanded', { gradeId: created.id });

    return c.json({
      success: true,
      data: responseData,
      message: 'Grade saved successfully',
    });

  } catch (error: any) {
    logger.error('Grade creation error:', error);
    return c.json({ success: false, error: 'Failed to create grade' }, 500);
  }
});

/**
 * GET /api/v1/grades
 * Get all grades with relational expansion
 */
gradeRouter.get('/', requireRole('admin', 'registrar', 'faculty', 'staff', 'student'), async (c) => {
  try {
    const pb = getPocketBase();
    const query = c.req.query();
    
    const page = parseInt(query.page || '1');
    const perPage = Math.min(parseInt(query.perPage || '50'), 500);
    const studentId   = query.studentId;
    const campusId    = query.campus_id;
    const academicYear = query.academicYear;
    const semester    = query.semester;
    const grade       = query.grade;

    // Build PocketBase filter
    const filterParts: string[] = [];
    if (studentId)    filterParts.push(`student_id = "${sanitizeFilter(studentId)}"`);
    if (campusId)     filterParts.push(`student_id.campus_id = "${sanitizeFilter(campusId)}"`);
    if (academicYear) filterParts.push(`academic_year = "${sanitizeFilter(academicYear)}"`);
    if (semester)     filterParts.push(`semester = "${sanitizeFilter(semester)}"`);
    if (grade)        filterParts.push(`grade = "${sanitizeFilter(grade)}"`);
    const filter = filterParts.join(' && ');

    const result = await pb.collection('academic_records').getList(page, perPage, {
      ...(filter ? { filter } : {}),
      expand: 'student_id,student_id.campus_id,course_id,course_id.module_id',
      sort: 'student_id.full_name,course_id.code',
    });

    // Map the expanded relational data to the frontend Grade shape
    const items = result.items.map((record) =>
      mapExpandedGradeToFrontendShape(record, {
        status: 'Verified',
        gradingScaleType: 'US_4_0',
        components: [],
        createdBy: 'system',
      })
    );

    return c.json({
      success: true,
      data: {
        ...result,
        items,
      },
    });

  } catch (error: any) {
    logger.error('Grade fetch error:', error);
    return c.json({ success: false, error: 'Failed to fetch grades' }, 500);
  }
});

/**
 * GET /api/v1/grades/:id
 * Get a specific grade by ID
 */
gradeRouter.get('/:id', requireRole('admin', 'registrar', 'faculty', 'staff', 'student'), async (c) => {
  try {
    const id = c.req.param('id');
    const pb = getPocketBase();
    
    const expanded = await pb.collection('academic_records').getOne(id, {
      expand: 'student_id,course_id,course_id.module_id',
    });

    const responseData = mapExpandedGradeToFrontendShape(expanded, {
      status: 'Verified',
      gradingScaleType: 'US_4_0',
      components: [],
      createdBy: 'system',
    });

    return c.json<ApiResponse<typeof responseData>>({
      success: true,
      data: responseData,
    });

  } catch (error: any) {
    logger.error('Grade fetch error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Grade not found',
    }, 404);
  }
});

/**
 * PUT /api/v1/grades/:id
 * Update an existing grade record.
 * Note: PocketBase `grades` collection currently persists only percentage/letter/gpa,
 * so assessment components are not stored, but are returned to match UI expectations.
 */
const gradeUpdateInputSchema = z.object({
  components: z.array(componentScoreSchema).optional(),
  numericGrade: z.number().optional(),
  percentage: z.number().optional(),
  letterGrade: z.string().optional(),
  gradePoints: z.number().optional(),
  status: z.string().optional(),
  gradingScaleType: z.string().optional(),
});

async function updateGradeHandler(c: any, id: string) {
  const body = await c.req.json();
  const parsed = gradeUpdateInputSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: `Validation error: ${parsed.error.issues.map((e) => e.message).join(', ')}` },
      400
    );
  }

  const pb = getPocketBase();
  const data = parsed.data;

  const percentage =
    data.percentage ??
    data.numericGrade ??
    (data.components && data.components.length > 0
      ? calculatePercentageFromComponents(data.components as unknown as GradeComponentScore[])
      : 0);

  const calculated = calculateGradeResult(percentage);
  const nextLetterGrade = data.letterGrade ?? calculated.letterGrade;
  const nextGradePoints = typeof data.gradePoints === 'number' ? data.gradePoints : calculated.gradePoints;

  await pb.collection('grades').update(id, {
    percentage,
    grade_letter: nextLetterGrade,
    gpa: nextGradePoints,
  });

  const expanded = await pb.collection('grades').getOne(id, {
    expand: 'enrollment_id.student_number,enrollment_id.course_code',
  });

  const user = (c as any).get('user') as { email?: string; sub?: string } | undefined;
  const responseData = mapExpandedGradeToFrontendShape(expanded, {
    components: data.components as unknown as GradeComponentScore[] | undefined,
    gradingScaleType: data.gradingScaleType,
    status: data.status,
    createdBy: user?.email || user?.sub,
  });

  return c.json({
    success: true,
    data: responseData,
    message: 'Grade updated successfully',
  });
}

gradeRouter.put('/:id', requireRole('admin', 'registrar', 'faculty', 'staff'), async (c) => {
  const id = c.req.param('id');
  return updateGradeHandler(c, id);
});

// Backward-compatible alias for older/alternate clients
gradeRouter.patch('/:id', requireRole('admin', 'registrar', 'faculty', 'staff'), async (c) => {
  const id = c.req.param('id');
  return updateGradeHandler(c, id);
});

/**
 * DELETE /api/v1/grades/:id
 * Delete a grade record
 */
gradeRouter.delete('/:id', requireRole('admin', 'registrar'), async (c) => {
  try {
    const id = c.req.param('id');
    const pb = getPocketBase();
    
    await pb.collection('grades').delete(id);
    
    logger.info('Grade deleted successfully', { gradeId: id });

    return c.json<ApiResponse<{ id: string }>>({
      success: true,
      data: { id },
      message: 'Grade deleted successfully',
    });

  } catch (error: any) {
    logger.error('Grade deletion error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to delete grade',
    }, 500);
  }
});

/**
 * GET /api/v1/grades/gpa/summary
 * Aggregate GPA per student per module from academic_records.
 * Query params: campusId?, academicYear?
 */
gradeRouter.get('/gpa/summary', requireRole('admin', 'registrar', 'faculty', 'staff'), async (c) => {
  try {
    const pb        = getPocketBase();
    const campusId  = c.req.query('campusId');
    const year      = c.req.query('academicYear');

    const filterParts: string[] = [];
    if (campusId) filterParts.push(`student_id.campus_id = "${sanitizeFilter(campusId)}"`);
    if (year)     filterParts.push(`academic_year = "${sanitizeFilter(year)}"`);
    const filter = filterParts.join(' && ');

    // Fetch all matching records with full expand (up to 2000)
    const records = await pb.collection('academic_records').getFullList({
      filter,
      expand: 'student_id,student_id.campus_id,course_id,course_id.module_id',
    });

    // Aggregate per student+module
    const map = new Map<string, {
      studentId: string; studentCode: string; studentName: string; campusName: string;
      module: string; credits: number; points: number;
    }>();

    for (const r of records) {
      const student  = (r as any).expand?.student_id;
      const course   = (r as any).expand?.course_id;
      const module   = course?.expand?.module_id;
      const campus   = student?.expand?.campus_id;

      const credits     = typeof course?.credit_hours === 'number' ? course.credit_hours
                        : (typeof course?.credits === 'number' ? course.credits : 0);
      const gradePoint  = typeof (r as any).grade_point === 'number' ? (r as any).grade_point : 0;

      const key = `${(r as any).student_id}__${module?.name || 'Unknown'}`;
      const existing = map.get(key);
      if (existing) {
        existing.credits += credits;
        existing.points  += gradePoint * credits;
      } else {
        map.set(key, {
          studentId:   (r as any).student_id,
          studentCode: student?.student_code || '',
          studentName: student?.full_name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim(),
          campusName:  campus?.name || '',
          module:      module?.name || 'Unknown',
          credits,
          points:      gradePoint * credits,
        });
      }
    }

    const summary = Array.from(map.values()).map(v => ({
      studentId:        v.studentId,
      studentCode:      v.studentCode,
      studentName:      v.studentName,
      campusName:       v.campusName,
      module:           v.module,
      totalCreditHours: v.credits,
      totalGradePoints: parseFloat(v.points.toFixed(2)),
      gpa:              v.credits > 0 ? parseFloat((v.points / v.credits).toFixed(2)) : 0,
    }));

    // Sort by campus, student name, module
    summary.sort((a, b) =>
      a.campusName.localeCompare(b.campusName) ||
      a.studentName.localeCompare(b.studentName) ||
      a.module.localeCompare(b.module)
    );

    return c.json({ success: true, data: summary, total: summary.length });
  } catch (error: any) {
    logger.error('GPA summary error:', error);
    return c.json({ success: false, error: 'Failed to compute GPA summary' }, 500);
  }
});

/**
 * GET /api/v1/grades/student/:studentId/transcript
 * Full academic transcript for one student — all records fully expanded.
 */
gradeRouter.get('/student/:studentId/transcript',
  requireRole('admin', 'registrar', 'faculty', 'staff', 'student'), async (c) => {
  try {
    const pb        = getPocketBase();
    const studentId = sanitizeFilter(c.req.param('studentId'));

    const records = await pb.collection('academic_records').getFullList({
      filter:  `student_id = "${studentId}"`,
      expand:  'student_id,student_id.campus_id,course_id,course_id.module_id',
      sort:    'course_id.code',
    });

    const items = records.map((r) =>
      mapExpandedGradeToFrontendShape(r, { status: 'Verified', gradingScaleType: 'US_4_0' })
    );

    // Compute GPA
    const totalCredits = items.reduce((s, r) => s + (r.creditHours || 0), 0);
    const totalPoints  = items.reduce((s, r) => s + (r.gradePoints || 0) * (r.creditHours || 0), 0);
    const overallGpa   = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;

    return c.json({
      success: true,
      data: {
        items,
        total:      items.length,
        overallGpa,
        totalCredits,
        totalPoints: parseFloat(totalPoints.toFixed(2)),
      },
    });
  } catch (error: any) {
    logger.error('Transcript fetch error:', error);
    return c.json({ success: false, error: 'Failed to fetch transcript' }, 500);
  }
});

export { gradeRouter };