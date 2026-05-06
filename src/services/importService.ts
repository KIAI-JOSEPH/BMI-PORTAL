/**
 * BMI UMS - Excel / Google Sheets Import Service
 * Parses .xlsx, .xls, .csv files and maps columns to system fields.
 * Auto-creates missing students, courses, and dynamic exam fields.
 */
import * as XLSX from 'xlsx';
import { Student, Course } from '../types';

export interface ImportResult<T> {
  success: boolean;
  imported: T[];
  skipped: number;
  errors: string[];
  newStudents: Partial<Student>[];
  newCourses: Partial<Course>[];
  newFields: string[];
}

export interface ExamImportRow {
  studentId: string;
  studentName: string;
  course: string;
  courseCode?: string;
  midterm?: number;
  final?: number;
  [key: string]: string | number | undefined; // dynamic extra columns
}

export interface StudentImportRow {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  faculty?: string;
  department?: string;
  academicLevel?: string;
  admissionYear?: string;
  enrollmentTerm?: string;
  status?: string;
  [key: string]: string | undefined;
}

// ─── Column name aliases ──────────────────────────────────────────────────────
const STUDENT_COLUMN_MAP: Record<string, keyof StudentImportRow> = {
  'first name': 'firstName', 'firstname': 'firstName', 'first_name': 'firstName', 'given name': 'firstName',
  'last name': 'lastName', 'lastname': 'lastName', 'last_name': 'lastName', 'surname': 'lastName', 'family name': 'lastName',
  'email': 'email', 'email address': 'email',
  'phone': 'phone', 'mobile': 'phone', 'phone number': 'phone', 'tel': 'phone',
  'gender': 'gender', 'sex': 'gender',
  'faculty': 'faculty', 'school': 'faculty',
  'department': 'department', 'dept': 'department',
  'level': 'academicLevel', 'academic level': 'academicLevel', 'program level': 'academicLevel',
  'admission year': 'admissionYear', 'year': 'admissionYear', 'intake year': 'admissionYear',
  'term': 'enrollmentTerm', 'enrollment term': 'enrollmentTerm', 'semester': 'enrollmentTerm',
  'status': 'status',
};

const EXAM_COLUMN_MAP: Record<string, keyof ExamImportRow> = {
  'student id': 'studentId', 'studentid': 'studentId', 'student_id': 'studentId', 'id': 'studentId', 'reg no': 'studentId', 'registration': 'studentId',
  'student name': 'studentName', 'studentname': 'studentName', 'name': 'studentName', 'full name': 'studentName',
  'course': 'course', 'subject': 'course', 'module': 'course', 'unit': 'course',
  'course code': 'courseCode', 'code': 'courseCode', 'subject code': 'courseCode',
  'midterm': 'midterm', 'mid term': 'midterm', 'cat': 'midterm', 'continuous assessment': 'midterm',
  'final': 'final', 'final exam': 'final', 'end of term': 'final', 'exam': 'final',
};

// ─── Parse any file into rows ─────────────────────────────────────────────────
export function parseFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
          defval: '',
          raw: false,
        });
        resolve(rows);
      } catch (err) {
        reject(new Error('Failed to parse file. Ensure it is a valid .xlsx, .xls, or .csv file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Normalize a column header ────────────────────────────────────────────────
function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[_\-]+/g, ' ');
}

// ─── Map raw rows → StudentImportRow ─────────────────────────────────────────
export function mapStudentRows(rows: Record<string, string>[]): {
  mapped: StudentImportRow[];
  unknownColumns: string[];
} {
  const unknownColumns: string[] = [];
  const mapped = rows.map((row) => {
    const result: StudentImportRow = { firstName: '', lastName: '', email: '' };
    for (const [rawKey, value] of Object.entries(row)) {
      const norm = normalizeKey(rawKey);
      const mapped_key = STUDENT_COLUMN_MAP[norm];
      if (mapped_key) {
        result[mapped_key] = String(value).trim();
      } else if (value && !unknownColumns.includes(rawKey)) {
        unknownColumns.push(rawKey);
      }
    }
    return result;
  });
  return { mapped, unknownColumns };
}

// ─── Map raw rows → ExamImportRow ────────────────────────────────────────────
export function mapExamRows(rows: Record<string, string>[]): {
  mapped: ExamImportRow[];
  dynamicColumns: string[];
} {
  const dynamicColumns: string[] = [];
  const mapped = rows.map((row) => {
    const result: ExamImportRow = { studentId: '', studentName: '', course: '' };
    for (const [rawKey, value] of Object.entries(row)) {
      const norm = normalizeKey(rawKey);
      const mappedKey = EXAM_COLUMN_MAP[norm];
      if (mappedKey) {
        if (mappedKey === 'midterm' || mappedKey === 'final') {
          result[mappedKey] = parseFloat(String(value)) || 0;
        } else {
          result[mappedKey] = String(value).trim();
        }
      } else if (value) {
        // Dynamic column (e.g. "Assignment 1", "Project", "Practical")
        const numVal = parseFloat(String(value));
        result[rawKey] = isNaN(numVal) ? String(value).trim() : numVal;
        if (!dynamicColumns.includes(rawKey)) dynamicColumns.push(rawKey);
      }
    }
    return result;
  });
  return { mapped, dynamicColumns };
}

// ─── Process student import ───────────────────────────────────────────────────
export function processStudentImport(
  rows: StudentImportRow[],
  existingStudents: Student[]
): ImportResult<Student> {
  const result: ImportResult<Student> = {
    success: true,
    imported: [],
    skipped: 0,
    errors: [],
    newStudents: [],
    newCourses: [],
    newFields: [],
  };

  const existingEmails = new Set(existingStudents.map(s => s.email.toLowerCase()));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed + header row

    if (!row.firstName || !row.lastName) {
      result.errors.push(`Row ${rowNum}: Missing first or last name — skipped`);
      result.skipped++;
      continue;
    }

    if (!row.email) {
      // Auto-generate email if missing
      row.email = `${row.firstName.toLowerCase()}.${row.lastName.toLowerCase()}@bmi.edu`;
    }

    const emailLower = row.email.toLowerCase();
    if (existingEmails.has(emailLower)) {
      result.skipped++;
      continue;
    }

    const avatarColors = ['bg-purple-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600'];
    const newStudent: Student = {
      id: `BMI-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone || '+254 700 000 000',
      gender: (row.gender === 'Female' ? 'Female' : 'Male') as 'Male' | 'Female',
      faculty: row.faculty || 'General',
      department: row.department || 'General',
      careerPath: `${row.academicLevel || 'Degree'} in ${row.faculty || 'General'}`,
      academicLevel: (['Diploma', 'Degree', 'Masters', 'PhD'].includes(row.academicLevel || '')
        ? row.academicLevel
        : 'Degree') as Student['academicLevel'],
      admissionYear: row.admissionYear || new Date().getFullYear().toString(),
      enrollmentTerm: row.enrollmentTerm || 'Fall 2024',
      status: (['Active', 'Applicant', 'On Leave', 'Graduated', 'Suspended'].includes(row.status || '')
        ? row.status
        : 'Active') as Student['status'],
      standing: 'Good',
      gpa: 0,
      avatarColor: avatarColors[result.imported.length % avatarColors.length],
      photoZoom: 1,
      photoPosition: { x: 0, y: 0 },
    };

    existingEmails.add(emailLower);
    result.imported.push(newStudent);
    result.newStudents.push(newStudent);
  }

  return result;
}

// ─── Process exam/grade import ────────────────────────────────────────────────
export function processExamImport(
  rows: ExamImportRow[],
  dynamicColumns: string[],
  existingStudents: Student[],
  existingCourses: Course[]
): ImportResult<ExamImportRow> {
  const result: ImportResult<ExamImportRow> = {
    success: true,
    imported: [],
    skipped: 0,
    errors: [],
    newStudents: [],
    newCourses: [],
    newFields: dynamicColumns,
  };

  const studentMap = new Map<string, Student>();
  existingStudents.forEach(s => {
    studentMap.set(s.id.toLowerCase(), s);
    studentMap.set(s.email.toLowerCase(), s);
    studentMap.set(`${s.firstName} ${s.lastName}`.toLowerCase(), s);
  });

  const courseMap = new Map<string, Course>();
  existingCourses.forEach(c => {
    courseMap.set(c.name.toLowerCase(), c);
    courseMap.set(c.code.toLowerCase(), c);
  });

  const newStudentEmails = new Set<string>();
  const newCourseNames = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    if (!row.course) {
      result.errors.push(`Row ${rowNum}: Missing course name — skipped`);
      result.skipped++;
      continue;
    }

    // Resolve or auto-create student
    const studentKey = (row.studentId || row.studentName || '').toLowerCase();
    if (!studentMap.has(studentKey) && studentKey) {
      // Auto-create student
      const nameParts = row.studentName?.split(' ') || ['Unknown', 'Student'];
      const email = `${nameParts[0]?.toLowerCase() || 'student'}.${nameParts[1]?.toLowerCase() || 'unknown'}@bmi.edu`;
      if (!newStudentEmails.has(email)) {
        const newStudent: Partial<Student> = {
          id: row.studentId || `BMI-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
          firstName: nameParts[0] || 'Unknown',
          lastName: nameParts.slice(1).join(' ') || 'Student',
          email,
          phone: '+254 700 000 000',
          gender: 'Male',
          faculty: 'General',
          department: 'General',
          careerPath: 'Degree in General',
          academicLevel: 'Degree',
          admissionYear: new Date().getFullYear().toString(),
          enrollmentTerm: 'Fall 2024',
          status: 'Active',
          standing: 'Good',
          gpa: 0,
          avatarColor: 'bg-gray-600',
          photoZoom: 1,
        };
        result.newStudents.push(newStudent);
        newStudentEmails.add(email);
        studentMap.set(studentKey, newStudent as Student);
      }
    }

    // Resolve or auto-create course
    const courseKey = row.course.toLowerCase();
    if (!courseMap.has(courseKey) && !newCourseNames.has(courseKey)) {
      const newCourse: Partial<Course> = {
        id: `CRS-${Math.floor(Math.random() * 9000) + 1000}`,
        name: row.course,
        code: row.courseCode || row.course.split(' ').map(w => w[0]).join('').toUpperCase(),
        faculty: 'General',
        department: 'General',
        level: 'Undergraduate',
        credits: 3,
        status: 'Published',
        description: `Auto-created from import: ${row.course}`,
        syllabus: '',
      };
      result.newCourses.push(newCourse);
      newCourseNames.add(courseKey);
      courseMap.set(courseKey, newCourse as Course);
    }

    result.imported.push(row);
  }

  return result;
}

// ─── Generate template download ───────────────────────────────────────────────
export async function importFromGoogle(type: 'students' | 'exams', payload: Record<string, any> = {}): Promise<any> {
  const url = `/api/v1/import/${type}/google`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export function downloadTemplate(type: 'students' | 'exams'): void {
  const wb = XLSX.utils.book_new();

  if (type === 'students') {
    const data = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Gender', 'Faculty', 'Department', 'Academic Level', 'Admission Year', 'Enrollment Term', 'Status'],
      ['John', 'Doe', 'john.doe@bmi.edu', '+254 700 000 001', 'Male', 'Theology', 'Biblical Studies', 'Degree', '2024', 'Fall 2024', 'Active'],
      ['Jane', 'Smith', 'jane.smith@bmi.edu', '+254 700 000 002', 'Female', 'ICT', 'Computer Science', 'Masters', '2024', 'Fall 2024', 'Active'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
  } else {
    const data = [
      ['Student ID', 'Student Name', 'Course', 'Course Code', 'Midterm', 'Final', 'Assignment 1', 'Project'],
      ['BMI-2024-1001', 'John Doe', 'Systematic Theology I', 'THEO101', '85', '90', '78', '88'],
      ['BMI-2024-1002', 'Jane Smith', 'Introduction to Web Dev', 'CS101', '72', '80', '85', '90'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Exams & Grades');
  }

  XLSX.writeFile(wb, type === 'students' ? 'bmi_students_template.xlsx' : 'bmi_exams_template.xlsx');
}
