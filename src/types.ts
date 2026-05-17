import { ReactNode } from "react";

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
  /** Programme/course code stored by some import paths */
  program_code?: string;
  status: "Active" | "Inactive" | "Graduated" | "Suspended" | "Applicant";
  avatar_color: string;
  photo?: string;
  photo_zoom: number;
  photo_position?: { x: number; y: number };
  campus_id?: string;
  campus_name?: string;
  expand?: {
    campus_id?: { name: string };
  };
  // ── Academic / degree fields (populated via API expansion or academic records) ──
  /** Degree level: 'Certificate' | 'Diploma' | 'Degree' | 'Masters' | 'PhD' */
  academicLevel?: string;
  /** Faculty / school name */
  faculty?: string;
  /** Department name */
  department?: string;
  /** Cumulative GPA computed from academic records */
  gpa?: number;
}

/** Campus entity returned by the campuses API */
export interface Campus {
  id: string;
  name: string;
  location?: string;
  campus_code?: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: any;
}

export interface StatCardProps {
  title: string;
  value: string;
  subText: string;
  color: "purple" | "amber" | "emerald" | "blue";
  icon: ReactNode;
}

export interface StaffMember {
  id: string;
  staff_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  category: "Academic" | "Administrative" | "Management";
  status: "Full-time" | "Part-time" | "On Leave";
  campus_id?: string;
  campus_name?: string;
  expand?: {
    campus_id?: { name: string };
  };
}

export interface Transaction {
  id?: string;
  ref: string;
  name: string;
  desc: string;
  amt: number;
  status: "Paid" | "Pending" | "Failed";
  date: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  category?: string;
  credit_hours: number;
  module_id?: string;
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
}

export interface Hostel {
  id: string;
  name: string;
  type: "Male" | "Female";
  capacity: number;
  location: string;
  status: "Available" | "Near Capacity" | "Full";
}

export interface RoomAssignment {
  id: string;
  studentId: string;
  studentName: string;
  hostelId: string;
  roomNumber: string;
  checkInDate: string;
  status: "Active" | "Revoked";
}

export interface MedicalVisit {
  id: string;
  studentId: string;
  studentName: string;
  condition: string;
  bloodType: string;
  date: string;
  attendingStaff: string;
  status: "Normal" | "Urgent" | "Follow-up";
  vitals: {
    temp: string;
    bp: string;
    pulse: string;
  };
  notes: string;
}
