import { Hono } from 'hono';
import { z } from 'zod';
import { getPocketBase } from '../services/pocketbase.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const importRouter = new Hono();
importRouter.use('*', authMiddleware);
importRouter.use('*', requireRole('admin', 'registrar'));

const importItemSchema = z.object({
    type: z.enum(['student', 'course', 'grade', 'staff']),
    data: z.record(z.unknown()),
});

const importRequestSchema = z.object({
    items: z.array(importItemSchema).max(500, 'Maximum 500 items per import'),
});

function calculateGrade(percentage: number) {
  let gradeLetter = 'F';
  let gpa = 0.0;
  if (percentage >= 90) { gradeLetter = 'A'; gpa = 4.0; }
  else if (percentage >= 80) { gradeLetter = 'B'; gpa = 3.0; }
  else if (percentage >= 70) { gradeLetter = 'C'; gpa = 2.0; }
  else if (percentage >= 60) { gradeLetter = 'D'; gpa = 1.0; }
  return { grade_letter: gradeLetter, gpa };
}

const sanitize = (v: string): string => v.replace(/["'\\]/g, '').substring(0, 100);

importRouter.post('/v2', async (c) => {
  try {
    const rawBody = await c.req.json();
    const parseResult = importRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return c.json({ success: false, error: 'Invalid request format', details: parseResult.error.issues }, 400);
    }
    const data = parseResult.data;
    const pb = getPocketBase();
    
    // We will build maps of Codes -> PB IDs
    const maps = {
      faculties: new Map<string, string>(),
      departments: new Map<string, string>(),
      programs: new Map<string, string>(),
      courses: new Map<string, string>(),
      staff: new Map<string, string>(),
      students: new Map<string, string>(),
      enrollments: new Map<string, string>(),
    };

    const results = {
      faculties: 0, departments: 0, programs: 0, courses: 0,
      program_courses: 0, staff: 0, students: 0, enrollments: 0, grades: 0
    };

    // Helper to find or create
    async function findOrCreate(collection: string, filterField: string, filterValue: string, createData: any, mapKey?: keyof typeof maps, mapCode?: string) {
      if (!filterValue) return null;
      try {
        const safeValue = sanitize(String(filterValue));
        const existing = await pb.collection(collection).getFirstListItem(`${filterField}="${safeValue}"`);
        if (mapKey && mapCode) maps[mapKey].set(mapCode, existing.id);
        return existing;
      } catch (e) {
        // Not found, create
        try {
          const created = await pb.collection(collection).create(createData);
          if (mapKey && mapCode) maps[mapKey].set(mapCode, created.id);
          results[collection as keyof typeof results]++;
          return created;
        } catch (createErr: any) {
          logger.error(`Failed to create ${collection}: ${createErr.message}`, createData);
          return null;
        }
      }
    }

    logger.info('Starting V2 Relational Import');

    // 1. Faculties
    for (const row of data.faculties || []) {
      await findOrCreate('faculties', 'faculty_code', row.faculty_code, row, 'faculties', row.faculty_code);
    }

    // 2. Departments
    for (const row of data.departments || []) {
      const facId = maps.faculties.get(row.faculty_code);
      if (facId) await findOrCreate('departments', 'dept_code', row.dept_code, { ...row, faculty_code: facId }, 'departments', row.dept_code);
    }

    // 3. Programs
    for (const row of data.programs || []) {
      const deptId = maps.departments.get(row.dept_code);
      if (deptId) await findOrCreate('programs', 'program_code', row.program_code, { ...row, dept_code: deptId }, 'programs', row.program_code);
    }

    // 4. Courses
    for (const row of data.courses || []) {
      await findOrCreate('courses', 'course_code', row.course_code, row, 'courses', row.course_code);
    }

    // 5. Program Courses
    for (const row of data.program_courses || []) {
      const progId = maps.programs.get(row.program_code);
      const crsId = maps.courses.get(row.course_code);
      if (progId && crsId) {
        try {
          await pb.collection('program_courses').getFirstListItem(`program_code="${progId}" && course_code="${crsId}"`);
        } catch (e) {
           try {
             await pb.collection('program_courses').create({ ...row, program_code: progId, course_code: crsId });
             results.program_courses++;
           } catch (e) { /* ignore */ }
        }
      }
    }

    // 6. Staff
    for (const row of data.staff || []) {
      const deptId = maps.departments.get(row.dept_code);
      if (deptId) await findOrCreate('staff', 'staff_number', row.staff_number, { ...row, dept_code: deptId }, 'staff', row.staff_number);
    }

    // 7. Students
    for (const row of data.students || []) {
      const progId = maps.programs.get(row.program_code);
      if (progId) await findOrCreate('students', 'student_number', row.student_number, { ...row, program_code: progId }, 'students', row.student_number);
    }

    // 8. Enrollments
    for (const row of data.enrollments || []) {
      const studentId = maps.students.get(row.student_number);
      const courseId = maps.courses.get(row.course_code);
      if (studentId && courseId) {
        try {
          const ex = await pb.collection('enrollments').getFirstListItem(`student_number="${studentId}" && course_code="${courseId}" && academic_year="${row.academic_year}" && semester="${row.semester}"`);
          maps.enrollments.set(`${row.student_number}_${row.course_code}`, ex.id);
        } catch (e) {
          try {
            const created = await pb.collection('enrollments').create({ ...row, student_number: studentId, course_code: courseId });
            maps.enrollments.set(`${row.student_number}_${row.course_code}`, created.id);
            results.enrollments++;
          } catch(e) {}
        }
      }
    }

    // 9. Grades
    for (const row of data.grades || []) {
      const enrollmentId = maps.enrollments.get(`${row.student_number}_${row.course_code}`);
      if (enrollmentId) {
        const { grade_letter, gpa } = calculateGrade(Number(row.percentage));
        try {
          await pb.collection('grades').getFirstListItem(`enrollment_id="${enrollmentId}"`);
        } catch (e) {
          try {
            await pb.collection('grades').create({
              enrollment_id: enrollmentId,
              percentage: Number(row.percentage),
              grade_letter,
              gpa
            });
            results.grades++;
          } catch(e) {}
        }
      }
    }

    logger.info('V2 Import completed successfully', results);
    return c.json({ success: true, results });
  } catch (error: any) {
    logger.error('V2 import failed', error);
    return c.json({ success: false, error: 'Import processing failed' }, 500);
  }
});

export default importRouter;
