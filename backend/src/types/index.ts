// BMI UMS - TypeScript Types (100% Open Source Stack)

export interface Student {
  id: string;
  student_code: string;
  reg_no?: string;
  full_name: string;
  first_name: string;
  last_name: string;
  gender: "Male" | "Female";
  date_of_birth?: string;
  nationality?: string;
  email: string;
  phone: string;
  admission_no?: string;
  admission_date: string;
  programme: string;
  status: "Active" | "Inactive" | "Graduated" | "Suspended";
  avatar_color: string;
  photo?: string;
  photo_zoom: number;
  photo_position?: { x: number; y: number };
  campus_id?: string;
  expand?: { campus_id?: { name: string; location: string } };
  created: string;
  updated: string;
}

export interface StaffMember {
  id: string;
  staff_number: string;
  first_name: string;
  last_name: string;
  name: string; // Used in UI
  email: string;
  phone: string;
  role: string;
  department: string;
  category: "Academic" | "Administrative" | "Management";
  status: "Full-time" | "Part-time" | "On Leave";
  specialization?: string;
  office?: string;
  officeHours?: string;
  avatarColor?: string;
  joinDate?: string;
  campus_id?: string;
  expand?: { campus_id?: { name: string; location: string } };
  created: string;
  updated: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  name: string; // Used in UI
  faculty: string;
  department: string;
  level: "Undergraduate" | "Postgraduate" | "Diploma" | "Certificate";
  credits: number;
  credit_hours: number;
  status: "Published" | "Draft" | "Archived";
  description: string;
  syllabus: string;
  module_id?: string;
  created: string;
  updated: string;
}

export interface Certificate {
  id: string;
  serial_number: string;
  student_id: string;
  student_name: string;
  degree: string;
  graduation_class?: string;
  faculty: string;
  department: string;
  issue_date: string;
  graduation_date: string;
  gpa: number;
  status: "ISSUED" | "REVOKED" | "SUSPENDED";
  content_hash: string;
  verification_count: number;
  created: string;
  updated: string;
}

export interface Transaction {
  id: string;
  ref: string;
  name: string;
  desc: string;
  amt: number;
  status: "Paid" | "Pending" | "Failed";
  date: string;
  student_id?: string;
  created: string;
  updated: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  author: string;
  category: "Theology" | "ICT" | "Business" | "Education" | "General";
  type: "PDF" | "E-Book" | "Hardcopy" | "Journal" | "Video";
  status: "Digital" | "Available" | "Borrowed" | "Reserved";
  year: string;
  description: string;
  downloadUrl: string;
  location?: string;
  isbn?: string;
  created: string;
  updated: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "registrar" | "faculty" | "student" | "staff" | "viewer";
  department?: string;
  studentId?: string;
  staffId?: string;
  isActive: boolean;
  lastLogin?: string;
  created: string;
  updated: string;
}

export interface AuditLog {
  id: string;
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "VIEW"
    | "LOGIN"
    | "LOGOUT"
    | "VERIFY";
  resource: string;
  resourceId?: string;
  userId: string;
  userEmail: string;
  details?: Record<string, unknown>;
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  type?: "access" | "refresh";
  iat: number;
  exp: number;
  /** PocketBase record ID of the linked student (present when role === 'student') */
  studentId?: string;
  /** PocketBase record ID of the linked staff member (present when role === 'faculty' | 'staff') */
  staffId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
  };
}

// Certificate verification types
export interface CertificateVerificationRequest {
  serial: string;
  hash?: string;
  method: "online" | "offline" | "qr_scan";
}

export interface CertificateVerificationResult {
  valid: boolean;
  certificate?: {
    serial_number: string;
    student_name: string;
    degree_title: string;
    graduation_class?: string;
    faculty: string;
    department: string;
    issue_date: string;
    graduation_date: string;
    gpa: number;
    status: "active" | "revoked" | "suspended";
  };
  verification?: {
    timestamp: string;
    method: string;
    hash_verified: boolean;
    verification_count: number;
  };
  error?: string;
  code?: string;
}
