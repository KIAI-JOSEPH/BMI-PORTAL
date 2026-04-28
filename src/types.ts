import { ReactNode } from 'react';

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
  color: 'purple' | 'amber' | 'emerald' | 'blue';
  icon: ReactNode;
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
}

export interface Transaction {
  ref: string;
  name: string;
  desc: string;
  amt: number;
  status: 'Paid' | 'Pending' | 'Failed';
  date: string;
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
}

export interface Hostel {
  id: string;
  name: string;
  type: 'Male' | 'Female';
  capacity: number;
  location: string;
  status: 'Available' | 'Near Capacity' | 'Full';
}

export interface RoomAssignment {
  id: string;
  studentId: string;
  studentName: string;
  hostelId: string;
  roomNumber: string;
  checkInDate: string;
  status: 'Active' | 'Revoked';
}

export interface MedicalVisit {
  id: string;
  studentId: string;
  studentName: string;
  condition: string;
  bloodType: string;
  date: string;
  attendingStaff: string;
  status: 'Normal' | 'Urgent' | 'Follow-up';
  vitals: {
    temp: string;
    bp: string;
    pulse: string;
  };
  notes: string;
}