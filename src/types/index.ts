// ─── ENUMS ──────────────────────────────────────────────────────────────────

export type ProgramLevel = 'certificate' | 'diploma' | 'bachelor' | 'master' | 'doctorate';

export type StudyMode = 'full_time' | 'part_time' | 'distance' | 'hybrid';

export type CourseCategory =
  | 'biblical' | 'theological' | 'ministerial' | 'counseling'
  | 'leadership' | 'worship' | 'apologetics' | 'missiology'
  | 'practical' | 'general' | 'research';

export type CourseType = 'core' | 'elective' | 'audit';

export type TeachingFormat =
  | 'lecture' | 'seminar' | 'lab' | 'practicum'
  | 'field_education' | 'thesis' | 'intensive' | 'online';

export type AcademicStanding =
  | 'good_standing' | 'probation' | 'suspended'
  | 'graduated' | 'withdrawn' | 'deferred';

export type StudentStatus =
  | 'active' | 'inactive' | 'graduated'
  | 'suspended' | 'withdrawn' | 'deferred';

export type EnrollmentStatus =
  | 'enrolled' | 'dropped' | 'completed' | 'failed' | 'incomplete' | 'auditing';

export type GradingStatus =
  | 'pending' | 'submitted' | 'moderated' | 'approved' | 'released';

export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late';

export type TermStatus =
  | 'upcoming' | 'registration' | 'active' | 'exam' | 'grading' | 'closed';

export type StaffRole =
  | 'admin' | 'registrar' | 'lecturer' | 'dean'
  | 'chaplain' | 'librarian' | 'finance' | 'hostel_warden' | 'medical' | 'support';

export type ContractType =
  | 'full_time' | 'part_time' | 'adjunct' | 'visiting' | 'emeritus';

export type SponsorType =
  | 'self' | 'church' | 'organization' | 'scholarship' | 'government';

export type ThesisStatus =
  | 'proposal' | 'approved' | 'in_progress' | 'submitted'
  | 'under_review' | 'passed' | 'failed' | 'resubmission';

// ─── NEW ENTITY TYPES ────────────────────────────────────────────────────────

export interface Faculty {
  id: string;
  code: string;
  name: string;
  short_name: string;
  dean_id?: string;
  email?: string;
  description: string;
  is_active: boolean;
  created: string;
  updated: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  faculty_id: string;
  head_id?: string;
  email?: string;
  description: string;
  is_active: boolean;
  created: string;
  updated: string;
}

export interface Program {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
  degree_type: string;
  level: ProgramLevel;
  faculty_id: string;
  department_id: string;
  duration_years: number;
  total_credit_hours: number;
  total_semesters: number;
  mode_of_study: StudyMode;
  accreditation_body: string;
  entry_requirements: string;
  description: string;
  is_active: boolean;
  created: string;
  updated: string;
}

export interface AcademicTerm {
  id: string;
  code: string;
  academic_year: string;
  semester_number: number;
  term_type: "semester" | "trimester" | "intensive";
  start_date: string;
  end_date: string;
  registration_start: string;
  registration_end: string;
  exam_start: string;
  exam_end: string;
  results_release_date?: string;
  status: TermStatus;
  is_current: boolean;
  created: string;
  updated: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  program_id: string;
  term_id: string;
  academic_year: string;
  semester_number: number;
  enrollment_date: string;
  status: EnrollmentStatus;
  created: string;
  updated: string;
}

export interface GradeRecord {
  id: string;
  enrollment_id: string;
  student_id: string;
  course_id: string;
  term_id: string;
  academic_year: string;
  semester_number: number;
  cat_1_score?: number;
  cat_2_score?: number;
  assignment_score?: number;
  exam_score?: number;
  total_score: number;
  letter_grade: string;
  grade_points: number;
  status: GradingStatus;
  remarks?: string;
  graded_by?: string;
  approved_by?: string;
  graded_at?: string;
  approved_at?: string;
  created: string;
  updated: string;
}

export interface AttendanceRecord {
  id: string;
  enrollment_id: string;
  student_id: string;
  course_id: string;
  term_id: string;
  session_date: string;
  week_number: number;
  session_type: TeachingFormat;
  status: AttendanceStatus;
  notes?: string;
  recorded_by: string;
  created: string;  // PocketBase system field — DO NOT rename
  updated: string;  // PocketBase system field — DO NOT rename or add updated_at
}

export interface ThesisProject {
  id: string;
  student_id: string;
  program_id: string;
  title: string;
  abstract?: string;
  type: 'thesis' | 'dissertation' | 'ministry_project' | 'capstone';
  supervisor_id: string;
  co_supervisor_id?: string;
  term_id: string;
  status: ThesisStatus;
  proposal_submitted_at?: string;
  proposal_approved_at?: string;
  submitted_at?: string;
  defended_at?: string;
  defense_date?: string;
  final_grade?: string;
  document_url?: string;
  created: string;
  updated: string;
}

// ─── UPDATED FORM TYPES ──────────────────────────────────────────────────────

export interface GradeFormData {
  enrollmentId: string;
  studentId: string;
  courseId: string;
  termId: string;
  cat1Score?: number;
  cat2Score?: number;
  assignmentScore?: number;
  examScore: number;
  remarks?: string;
  // percentage: number  ← INTENTIONALLY REMOVED
}

// ─── API RESPONSE ENVELOPE ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    perPage?: number;
    totalItems?: number;
    totalPages?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
