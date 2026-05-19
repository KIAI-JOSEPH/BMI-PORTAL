/**
 * BMI UMS — Academic Records Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all academic_records queries.
 * Every grade display, transcript, GPA calculation and export flows through here.
 *
 * Collection: academic_records
 * Relations:  student_id → students, course_id → courses → module_id → modules
 */

import { authFetch } from './authService';
import { API_URL } from './config';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AcademicRecord {
  id: string;
  student_id: string;
  course_id: string;
  total_score: number;
  ca_score: number | null;
  exam_score: number | null;
  grade: string;          // A, B+, B, C+, C, D, F
  grade_point: number;    // 4.0, 3.5, 3.0, 2.5, 2.0, 1.0, 0.0
  remarks: string;        // Pass | Fail
  academic_year: string;
  semester: string;
  created: string;
  updated: string;
  // Expanded relations (present when ?expand=student_id,course_id is used)
  expand?: {
    student_id?: {
      id: string;
      student_code: string;
      reg_no: string;
      full_name: string;
      first_name: string;
      last_name: string;
      gender: string;
      campus_id: string;
      admission_no: string;
      expand?: { campus_id?: { id: string; name: string } };
    };
    course_id?: {
      id: string;
      code: string;
      course_code?: string;   // legacy alias
      title: string;
      credit_hours: number;
      credits?: number;       // legacy alias
      category: string;
      module_id: string;
      expand?: {
        module_id?: { id: string; name: string; semester: string; sort_order: number };
      };
    };
  };
}

/** Flat shape returned to UI components */
export interface AcademicRecordFlat {
  id: string;
  studentId: string;
  studentCode: string;
  regNo: string;
  studentName: string;
  gender: string;
  campusName: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  creditHours: number;
  category: string;
  module: string;
  semester: string;
  totalScore: number;
  caScore: number | null;
  examScore: number | null;
  grade: string;
  gradePoint: number;
  remarks: string;
  academicYear: string;
}

export interface GpaRecord {
  studentId: string;
  studentCode: string;
  studentName: string;
  campusName: string;
  module: string;
  totalCreditHours: number;
  totalGradePoints: number;
  gpa: number;
}

export interface AcademicRecordsFilters {
  studentId?: string;
  courseId?: string;
  campusId?: string;
  academicYear?: string;
  semester?: string;
  grade?: string;
  page?: number;
  perPage?: number;
}

// ─── Normaliser ───────────────────────────────────────────────────────────────

export function flattenRecord(r: AcademicRecord | any): AcademicRecordFlat {
  // If the record is already flat (e.g. from a backend that pre-flattens), just return it
  // or cast it to the expected shape.
  const isAlreadyFlat = !r.expand && (r.studentName || r.courseTitle || r.courseName);
  
  const student  = r.expand?.student_id;
  const course   = r.expand?.course_id;
  const module   = course?.expand?.module_id;
  const campus   = student?.expand?.campus_id;

  return {
    id:            r.id,
    studentId:     r.studentId || r.student_id,
    studentCode:   student?.student_code ?? r.studentCode ?? '',
    regNo:         student?.reg_no ?? r.regNo ?? '',
    studentName:   (student?.full_name ??
                   `${student?.first_name ?? ''} ${student?.last_name ?? ''}`.trim()) || 
                   r.studentName || 'Unknown',
    gender:        student?.gender ?? r.gender ?? '',
    campusName:    campus?.name ?? r.campusName ?? '',
    courseId:      r.courseId || r.course_id,
    courseCode:    (course?.code ?? course?.course_code) ?? r.courseCode ?? '',
    courseTitle:   (course?.title ?? r.courseName) || r.courseTitle || '',
    creditHours:   (course?.credit_hours ?? course?.credits ?? r.creditHours ?? r.credits) ?? 0,
    category:      course?.category ?? r.category ?? '',
    module:        module?.name ?? r.module ?? '',
    semester:      r.semester || module?.semester || '',
    totalScore:    (r.total_score ?? r.totalScore ?? r.percentage) ?? 0,
    caScore:       r.ca_score ?? r.caScore ?? null,
    examScore:     r.exam_score ?? r.examScore ?? null,
    grade:         r.grade ?? r.letterGrade ?? '',
    gradePoint:    r.grade_point ?? r.gradePoint ?? 0,
    remarks:       r.remarks ?? '',
    academicYear:  r.academic_year ?? r.academicYear ?? '',
  };
}

// ─── API helpers ──────────────────────────────────────────────────────────────

const EXPAND = 'student_id,student_id.campus_id,course_id,course_id.module_id';

/**
 * GET /api/v1/grades  (backed by academic_records collection)
 * Returns flat records ready for display.
 */
export async function getAcademicRecords(
  filters: AcademicRecordsFilters = {}
): Promise<{ items: AcademicRecordFlat[]; total: number; page: number; perPage: number }> {
  const params = new URLSearchParams();
  if (filters.studentId)   params.set('studentId',   filters.studentId);
  if (filters.courseId)    params.set('courseId',    filters.courseId);
  if (filters.campusId)    params.set('campus_id',   filters.campusId);
  if (filters.academicYear)params.set('academicYear',filters.academicYear);
  if (filters.semester)    params.set('semester',    filters.semester);
  if (filters.grade)       params.set('grade',       filters.grade);
  params.set('page',    String(filters.page    ?? 1));
  params.set('perPage', String(filters.perPage ?? 500));
  params.set('expand',  EXPAND);

  const res  = await authFetch(`${API_URL}/grades?${params}`);
  const body = await res.json();

  if (!body.success) throw new Error(body.error ?? 'Failed to fetch academic records');

  const rawItems = Array.isArray(body.data)
    ? body.data
    : (body.data?.items ?? []);
  const items: AcademicRecordFlat[] = rawItems.map(flattenRecord);
  
  return {
    items,
    total:   body.meta?.total    ?? body.data?.total    ?? body.data?.totalItems ?? items.length,
    page:    body.meta?.page     ?? body.data?.page     ?? 1,
    perPage: body.meta?.perPage  ?? body.data?.perPage  ?? items.length,
  };
}

/**
 * All grades for a specific student (used by Transcripts + student profile).
 */
export async function getStudentAcademicRecords(
  studentId: string
): Promise<AcademicRecordFlat[]> {
  const result = await getAcademicRecords({ studentId, perPage: 200 });
  return result.items;
}

/**
 * Compute per-student, per-module GPA from a list of flat records.
 */
export function computeGpa(records: AcademicRecordFlat[]): GpaRecord[] {
  const byStudentModule = new Map<string, {
    studentId: string; studentCode: string; studentName: string; campusName: string;
    module: string; credits: number; points: number;
  }>();

  for (const r of records) {
    const key = `${r.studentId}__${r.module}`;
    const existing = byStudentModule.get(key);
    if (existing) {
      existing.credits += r.creditHours;
      existing.points  += r.gradePoint * r.creditHours;
    } else {
      byStudentModule.set(key, {
        studentId:   r.studentId,
        studentCode: r.studentCode,
        studentName: r.studentName,
        campusName:  r.campusName,
        module:      r.module,
        credits:     r.creditHours,
        points:      r.gradePoint * r.creditHours,
      });
    }
  }

  return Array.from(byStudentModule.values()).map(v => ({
    studentId:         v.studentId,
    studentCode:       v.studentCode,
    studentName:       v.studentName,
    campusName:        v.campusName,
    module:            v.module,
    totalCreditHours:  v.credits,
    totalGradePoints:  parseFloat(v.points.toFixed(2)),
    gpa:               v.credits > 0 ? parseFloat((v.points / v.credits).toFixed(2)) : 0,
  }));
}

/**
 * Single-student overall GPA (across all modules).
 */
export function computeOverallGpa(records: AcademicRecordFlat[]): number {
  const totalCredits = records.reduce((s, r) => s + r.creditHours, 0);
  const totalPoints  = records.reduce((s, r) => s + r.gradePoint * r.creditHours, 0);
  return totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
}

/**
 * Create a new academic record.
 */
export async function createAcademicRecord(data: {
  student_id: string;
  course_id: string;
  total_score: number;
  ca_score?: number;
  exam_score?: number;
  academic_year?: string;
}): Promise<AcademicRecordFlat> {
  const res  = await authFetch(`${API_URL}/grades`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!body.success) throw new Error(body.error ?? 'Failed to create record');
  return flattenRecord(body.data);
}

/**
 * Update an existing academic record.
 */
export async function updateAcademicRecord(
  id: string,
  data: Partial<{ total_score: number; ca_score: number; exam_score: number }>
): Promise<AcademicRecordFlat> {
  const res  = await authFetch(`${API_URL}/grades/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!body.success) throw new Error(body.error ?? 'Failed to update record');
  return flattenRecord(body.data);
}

/**
 * Delete an academic record.
 */
export async function deleteAcademicRecord(id: string): Promise<void> {
  const res  = await authFetch(`${API_URL}/grades/${id}`, { method: 'DELETE' });
  const body = await res.json();
  if (!body.success) throw new Error(body.error ?? 'Failed to delete record');
}
