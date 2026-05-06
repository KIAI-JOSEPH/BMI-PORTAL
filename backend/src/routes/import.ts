// BMI UMS - Bulk Import Routes (Excel/Google Sheets)
import { Hono } from 'hono';
import { z } from 'zod';
import { getPocketBase } from '../services/pocketbase.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import type { ApiResponse, Student, Course } from '../types/index.js';

const importRouter = new Hono();

importRouter.use('*', authMiddleware);
importRouter.use('*', requireRole('admin', 'registrar'));

// Strict schema for imported student rows
// ----------- Google Sheet Import Support -----------
// These routes pull data directly from a Google Sheet using
// google-spreadsheets-orm (npm: google-spreadsheets-orm).
// The spreadsheet ID can be supplied in the request body or via
// environment variables GOOGLE_SHEET_ID_STUDENTS / GOOGLE_SHEET_ID_EXAMS.
// The sheet name defaults to "Students" or "Exams" respectively if not provided.
// The data is mapped to the same internal schemas used for file‑based import
// and then persisted through PocketBase just like the bulk JSON import.

const importStudentSchema = z.object({
  firstName: z.string().min(1).optional().default('Unknown'),
  lastName: z.string().min(1).optional().default('Student'),
  email: z.string().email().optional().default('unknown@bmi.edu'),
  phone: z.string().max(30).optional().default('+254 700 000 000'),
  gender: z.enum(['Male', 'Female']).optional().default('Male'),
  faculty: z.string().max(100).optional().default('General'),
  department: z.string().max(100).optional().default('General'),
  academicLevel: z.enum(['Diploma', 'Degree', 'Masters', 'PhD']).optional().default('Degree'),
  admissionYear: z.string().max(4).optional().default(new Date().getFullYear().toString()),
  enrollmentTerm: z.string().max(50).optional().default('Fall ' + new Date().getFullYear()),
  status: z.enum(['Active', 'Applicant', 'On Leave', 'Graduated', 'Suspended']).optional().default('Applicant'),
  careerPath: z.string().max(200).optional().default('Degree in General'),
  avatarColor: z.string().max(50).optional().default('bg-purple-600'),
  photoZoom: z.number().optional().default(1),
  standing: z.enum(['Honor Roll', 'Good', 'Probation', 'Warning']).optional().default('Good'),
  gpa: z.number().min(0).max(4).optional().default(0),
});

// Strict schema for imported course rows
const importCourseSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(20),
  faculty: z.string().min(1).max(100).optional().default('General'),
  department: z.string().min(1).max(100).optional().default('General'),
  level: z.enum(['Undergraduate', 'Postgraduate', 'Diploma', 'Certificate']).optional().default('Undergraduate'),
  credits: z.number().positive().max(200).optional().default(3),
  status: z.enum(['Published', 'Draft', 'Archived']).optional().default('Draft'),
  description: z.string().max(1000).optional().default(''),
  syllabus: z.string().max(2000).optional().default(''),
});
const importExamSchema = z.object({
  studentId: z.string().min(1).max(50),
  studentName: z.string().min(1).max(200),
  course: z.string().min(1).max(200),
  courseCode: z.string().max(20).optional(),
  midterm: z.number().min(0).max(100).optional(),
  final: z.number().min(0).max(100).optional(),
}).catchall(z.union([z.string().max(500), z.number().min(0).max(100)]));

/**
 * POST /api/v1/import/students
 * Bulk import students from parsed Excel data
 */
importRouter.post('/students', async (c) => {
  try {
    const body = await c.req.json();
    const { students } = body as { students: Partial<Student>[] };

    if (!Array.isArray(students) || students.length === 0) {
      return c.json<ApiResponse<never>>({ success: false, error: 'No students provided' }, 400);
    }

    if (students.length > 500) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Max 500 students per import. Split into smaller batches.' }, 400);
    }

    const pb = getPocketBase();
    const imported: Student[] = [];
    const errors: string[] = [];

    for (let i = 0; i < students.length; i++) {
      const row = students[i];
      const parsed = importStudentSchema.safeParse(row);
      if (!parsed.success) {
        errors.push(`Row ${i + 1} (${(row as any).email || 'unknown'}): ${parsed.error.issues.map(e => e.message).join(', ')}`);
        continue;
      }
      try {
        const created = await pb.collection('students').create(parsed.data);
        imported.push(created as unknown as Student);
      } catch (err: any) {
        errors.push(`Row ${i + 1} (${parsed.data.email}): ${err.message || 'Failed to create'}`);
      }
    }

    logger.info('Bulk student import completed', { imported: imported.length, errors: errors.length });

    return c.json<ApiResponse<{ imported: Student[]; errors: string[] }>>({
      success: true,
      data: { imported, errors },
      message: `Imported ${imported.length} students. ${errors.length} errors.`,
    });

  } catch (error) {
    logger.error('Bulk student import error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to import students',
    }, 500);
  }
});

/**
 * POST /api/v1/import/courses
 * Bulk import courses from parsed Excel data
 */
importRouter.post('/courses', async (c) => {
  try {
    const body = await c.req.json();
    const { courses } = body as { courses: Partial<Course>[] };

    if (!Array.isArray(courses) || courses.length === 0) {
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'No courses provided',
      }, 400);
    }

    const pb = getPocketBase();
    const imported: Course[] = [];
    const errors: string[] = [];

    for (const course of courses) {
      const parsed = importCourseSchema.safeParse(course);
      if (!parsed.success) {
        errors.push(`${(course as any).name || 'unknown'}: ${parsed.error.issues.map(e => e.message).join(', ')}`);
        continue;
      }
      try {
        const created = await pb.collection('courses').create(parsed.data);
        imported.push(created as unknown as Course);
      } catch (err: any) {
        errors.push(`${parsed.data.name}: ${err.message || 'Failed to create'}`);
      }
    }

    logger.info('Bulk course import completed', { imported: imported.length, errors: errors.length });

    return c.json<ApiResponse<{ imported: Course[]; errors: string[] }>>({
      success: true,
      data: { imported, errors },
      message: `Imported ${imported.length} courses. ${errors.length} errors.`,
    });

  } catch (error) {
    logger.error('Bulk course import error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to import courses',
    }, 500);
  }
});

/**
 * POST /api/v1/import/exams
 * Bulk import exam records with dynamic fields
 * Creates a new collection if needed with dynamic schema
 */
importRouter.post('/exams', async (c) => {
  try {
    const body = await c.req.json();
    const { exams, collectionName, dynamicFields } = body as {
      exams: Record<string, any>[];
      collectionName: string;
      dynamicFields: string[];
    };

    if (!Array.isArray(exams) || exams.length === 0) {
      return c.json<ApiResponse<never>>({ success: false, error: 'No exam records provided' }, 400);
    }

    if (exams.length > 1000) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Max 1000 exam records per import.' }, 400);
    }

    // Sanitize collection name to prevent injection
    const safeCollectionName = (collectionName || `exams_${Date.now()}`).replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 50);

    const pb = getPocketBase();
    const finalCollectionName = safeCollectionName;

    // Check if collection exists, create with dynamic schema if not
    let collection;
    try {
      collection = await pb.collections.getOne(finalCollectionName);
    } catch {
      // Collection doesn't exist — create it with dynamic schema
      logger.info('Creating new exam collection', { name: finalCollectionName, dynamicFields });

      const fields = [
        { name: 'studentId', type: 'text', required: true },
        { name: 'studentName', type: 'text', required: true },
        { name: 'course', type: 'text', required: true },
        { name: 'courseCode', type: 'text', required: false },
        { name: 'midterm', type: 'number', required: false },
        { name: 'final', type: 'number', required: false },
        ...dynamicFields.map(field => ({
          name: field.replace(/[^a-zA-Z0-9_]/g, '_'),
          type: 'number',
          required: false,
        })),
      ];

      collection = await pb.collections.create({
        name: finalCollectionName,
        type: 'base',
        schema: fields,
      });
    }

    // Insert exam records with validation
    const imported: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < exams.length; i++) {
      const row = exams[i];
      const parsed = importExamSchema.safeParse(row);
      if (!parsed.success) {
        errors.push(`Row ${i + 1}: ${parsed.error.issues.map(e => e.message).join(', ')}`);
        continue;
      }
      try {
        const created = await pb.collection(finalCollectionName).create(parsed.data);
        imported.push(created);
      } catch (err: any) {
        errors.push(`Row ${i + 1} (${(row as any).studentId || 'unknown'}): ${err.message || 'Failed to create'}`);
      }
    }

    logger.info('Bulk exam import completed', {
      collection: finalCollectionName,
      imported: imported.length,
      errors: errors.length,
    });

    return c.json<ApiResponse<{ imported: any[]; errors: string[]; collectionName: string }>>({
      success: true,
      data: { imported, errors, collectionName: finalCollectionName },
      message: `Imported ${imported.length} exam records into ${finalCollectionName}. ${errors.length} errors.`,
    });

  } catch (error) {
    logger.error('Bulk exam import error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to import exams',
    }, 500);
  }
});

/**
 * POST /api/v1/import/students/google
 * Pull student data from a Google Sheet and bulk‑create records.
 */
importRouter.post('/students/google', async (c) => {
  try {
    const body = await c.req.json();
    const spreadsheetId = body.spreadsheetId || process.env.GOOGLE_SHEET_ID_STUDENTS;
    const sheetName = body.sheetName || 'Students';
    if (!spreadsheetId) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Google Sheet ID not provided' }, 400);
    }
    // Google auth – service account credentials via env vars JSON string
    const auth = new (await import('google-auth-library')).GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const { GoogleSpreadsheetOrm } = await import('google-spreadsheets-orm');
    const orm = new GoogleSpreadsheetOrm<Record<string, any>>({
      spreadsheetId,
      sheet: sheetName,
      auth,
    });
    const rows = await orm.all();

    // Simple mapper – expects column headers that roughly match the importStudentSchema fields.
    const mapRow = (row: any) => ({
      firstName: row['First Name'] || row.firstName || row.first_name,
      lastName: row['Last Name'] || row.lastName || row.last_name,
      email: row['Email'] || row.email,
      phone: row['Phone'] || row.phone,
      gender: row['Gender'] || row.gender,
      faculty: row['Faculty'] || row.faculty,
      department: row['Department'] || row.department,
      academicLevel: row['Academic Level'] || row.academicLevel,
      admissionYear: row['Admission Year'] || row.admissionYear,
      enrollmentTerm: row['Enrollment Term'] || row.enrollmentTerm,
      status: row['Status'] || row.status,
      careerPath: row['Career Path'] || row.careerPath,
      standing: row['Standing'] || row.standing,
      gpa: row['GPA'] !== undefined ? Number(row['GPA']) : undefined,
      avatarColor: row['Avatar Color'] || undefined,
      photoZoom: row['Photo Zoom'] !== undefined ? Number(row['Photo Zoom']) : undefined,
    });

    const mappedRows = rows.map(mapRow);
    const pb = getPocketBase();
    const imported: Student[] = [];
    const errors: string[] = [];
    for (let i = 0; i < mappedRows.length; i++) {
      const parsed = importStudentSchema.safeParse(mappedRows[i]);
      if (!parsed.success) {
        errors.push(`Row ${i + 1}: ${parsed.error.issues.map(e => e.message).join(', ')}`);
        continue;
      }
      try {
        const created = await pb.collection('students').create(parsed.data);
        imported.push(created as unknown as Student);
      } catch (e: any) {
        errors.push(`Row ${i + 1}: ${e.message || 'Create failed'}`);
      }
    }
    return c.json<ApiResponse<{ imported: Student[]; errors: string[] }>>({
      success: true,
      data: { imported, errors },
      message: `Imported ${imported.length} students from Google Sheet. ${errors.length} errors.`,
    });
  } catch (error) {
    logger.error('Google Sheet student import error:', error);
    return c.json<ApiResponse<never>>({ success: false, error: 'Failed to import students from Google Sheet' }, 500);
  }
});

/**
 * POST /api/v1/import/exams/google
 * Pull exam/grade data from a Google Sheet and bulk‑create records.
 */
importRouter.post('/exams/google', async (c) => {
  try {
    const body = await c.req.json();
    const spreadsheetId = body.spreadsheetId || process.env.GOOGLE_SHEET_ID_EXAMS;
    const sheetName = body.sheetName || 'Exams';
    if (!spreadsheetId) {
      return c.json<ApiResponse<never>>({ success: false, error: 'Google Sheet ID not provided' }, 400);
    }
    const auth = new (await import('google-auth-library')).GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const { GoogleSpreadsheetOrm } = await import('google-spreadsheets-orm');
    const orm = new GoogleSpreadsheetOrm<Record<string, any>>({
      spreadsheetId,
      sheet: sheetName,
      auth,
    });
    const rows = await orm.all();

    const mapRow = (row: any) => ({
      studentId: row['Student ID'] || row.studentId || row.student_id,
      studentName: row['Student Name'] || row.studentName,
      course: row['Course'] || row.course,
      courseCode: row['Course Code'] || row.courseCode,
      midterm: row['Midterm'] !== undefined ? Number(row['Midterm']) : undefined,
      final: row['Final'] !== undefined ? Number(row['Final']) : undefined,
      // keep any additional columns as dynamic fields
      ...Object.fromEntries(Object.entries(row).filter(([k]) => !['Student ID','Student Name','Course','Course Code','Midterm','Final'].includes(k))),
    });
    const mappedRows = rows.map(mapRow);
    const pb = getPocketBase();
    const imported: any[] = [];
    const errors: string[] = [];
    for (let i = 0; i < mappedRows.length; i++) {
      const parsed = importExamSchema.safeParse(mappedRows[i]);
      if (!parsed.success) {
        errors.push(`Row ${i + 1}: ${parsed.error.issues.map(e => e.message).join(', ')}`);
        continue;
      }
      try {
        // Use the collection name supplied (or default) – client decides collectionName via request
        const collectionName = body.collectionName || `exams_${new Date().getFullYear()}`;
        // Ensure collection exists – reuse the same logic from existing /exams import route
        let collection;
        try {
          collection = await pb.collections.getOne(collectionName);
        } catch {
          // create collection dynamically
          const dynamicFields = Object.keys(parsed.data).filter(k => !['studentId','studentName','course','courseCode','midterm','final'].includes(k));
          const fields = [
            { name: 'studentId', type: 'text', required: true },
            { name: 'studentName', type: 'text', required: true },
            { name: 'course', type: 'text', required: true },
            { name: 'courseCode', type: 'text', required: false },
            { name: 'midterm', type: 'number', required: false },
            { name: 'final', type: 'number', required: false },
            ...dynamicFields.map(f => ({ name: f.replace(/[^a-zA-Z0-9_]/g, '_'), type: 'number', required: false })),
          ];
          collection = await pb.collections.create({ name: collectionName, type: 'base', schema: fields });
        }
        const created = await pb.collection(collectionName).create(parsed.data);
        imported.push(created);
      } catch (e: any) {
        errors.push(`Row ${i + 1}: ${e.message || 'Create failed'}`);
      }
    }
    return c.json<ApiResponse<{ imported: any[]; errors: string[]; collectionName: string }>>({
      success: true,
      data: { imported, errors, collectionName: body.collectionName || `exams_${new Date().getFullYear()}` },
      message: `Imported ${imported.length} exam records. ${errors.length} errors.`,
    });
  } catch (error) {
    logger.error('Google Sheet exam import error:', error);
    return c.json<ApiResponse<never>>({ success: false, error: 'Failed to import exams from Google Sheet' }, 500);
  }
});



export default importRouter;
