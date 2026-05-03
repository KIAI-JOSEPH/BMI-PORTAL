// BMI UMS - TypeScript Types (100% Open Source Stack)

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: 'Male' | 'Female';
  email: string;
  phone: string;
  nationality?: string;
  faculty: string;
  department: string;
  careerPath: string;
  academicLevel: 'Diploma' | 'Degree' | 'Masters' | 'PhD';
  admissionYear: string;
  enrollmentTerm: string;
  status: 'Active' | 'Applicant' | 'On Leave' | 'Graduated' | 'Suspended';
  standing: 'Honor Roll' | 'Good' | 'Probation' | 'Warning';
  gpa: number;
  avatarColor: string;
  photo?: string;
  photoZoom: number;
  photoPosition?: { x: number; y: number };
  created: string;
  updated: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  status: 'Full-time' | 'Part-time' | 'On Leave';
  category: 'Academic' | 'Administrative' | 'Management';
  specialization: string;
  office: string;
  officeHours: string;
  avatarColor: string;
  photo?: string;
  joinDate: string;
  created: string;
  updated: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  faculty: string;
  department: string;
  level: 'Undergraduate' | 'Postgraduate' | 'Diploma' | 'Certificate';
  credits: number;
  status: 'Published' | 'Draft' | 'Archived';
  description: string;
  syllabus: string;
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
  status: 'ISSUED' | 'REVOKED' | 'SUSPENDED';
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
  status: 'Paid' | 'Pending' | 'Failed';
  date: string;
  student_id?: string;
  created: string;
  updated: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  author: string;
  category: 'Theology' | 'ICT' | 'Business' | 'Education' | 'General';
  type: 'PDF' | 'E-Book' | 'Hardcopy' | 'Journal' | 'Video';
  status: 'Digital' | 'Available' | 'Borrowed' | 'Reserved';
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
  role: 'admin' | 'registrar' | 'staff' | 'viewer';
  department?: string;
  isActive: boolean;
  lastLogin?: string;
  created: string;
  updated: string;
}

export interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'VERIFY';
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
  type?: 'access' | 'refresh';
  iat: number;
  exp: number;
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
  method: 'online' | 'offline' | 'qr_scan';
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
    status: 'active' | 'revoked' | 'suspended';
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
