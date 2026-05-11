import React, { useState, useEffect } from 'react';
import Dashboard from '../components/Dashboard';
import Students from '../components/Students';
import Staff from '../components/Staff';
import Attendance from '../components/Attendance';
import Finance from '../components/Finance';
import Courses from '../components/Courses';
import Exams from '../components/Exams';
import Grades from '../components/Grades';
import { Transcripts } from '../components/Transcripts';
import Certificates from '../components/Certificates';
import { Library } from '../components/Library';
import Hostels from '../components/Hostels';
import { Medical } from '../components/Medical';
import Inventory from '../components/Inventory';
import Alumni from '../components/Alumni';
import Communications from '../components/Communications';
import Visitors from '../components/Visitors';
import Reports from '../components/Reports';
import Settings from '../components/Settings';
import VerificationPage from '../components/VerificationPage';

import type { Course, LibraryItem, Student, StaffMember, Transaction } from '../types';
import type { SetStateAction } from 'react';

type ViewKey =
  | 'dashboard'
  | 'students'
  | 'staff'
  | 'attendance'
  | 'finance'
  | 'courses'
  | 'exams'
  | 'grades'
  | 'transcripts'
  | 'certificates'
  | 'verify'
  | 'library'
  | 'hostels'
  | 'medical'
  | 'inventory'
  | 'alumni'
  | 'sms'
  | 'visitors'
  | 'reports'
  | 'ai'
  | 'settings'
  | string;

export interface ViewRendererProps {
  currentView: ViewKey;
  theme: 'light' | 'dark' | string;
  logo: string;
  stats: {
    students: number;
    admissions: number;
    tuition: number;
    events: number;
  };

  students: Student[];
  setStudents: React.Dispatch<SetStateAction<Student[]>>;
  staff: StaffMember[];
  setStaff: React.Dispatch<SetStateAction<StaffMember[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<SetStateAction<Transaction[]>>;
  courses: Course[];
  setCourses: React.Dispatch<SetStateAction<Course[]>>;
  library: LibraryItem[];
  setLibrary: React.Dispatch<SetStateAction<LibraryItem[]>>;

  onOpenAIModal: () => void;
  onNavigate: (view: ViewKey) => void;
  onUpdateLogo: (logo: string) => void;
  onUpdateTheme: (theme: string) => void;

  onAddStudent: (student: Student) => void;
  onAddTransaction: (amt: number) => void;
}

export default function ViewRenderer(props: ViewRendererProps) {
  const {
    currentView,
    theme,
    logo,
    stats,
    students,
    staff,
    transactions,
    courses,
    library,
    setStudents,
    setStaff,
    setTransactions,
    setCourses,
    setLibrary,
    onOpenAIModal,
    onNavigate,
    onUpdateLogo,
    onUpdateTheme,
    onAddStudent,
    onAddTransaction,
  } = props;

  switch (currentView) {
    case 'dashboard':
      return (
        <Dashboard
          userName="Administrator"
          theme={theme}
          onNavigate={onNavigate}
          stats={stats}
          onAddStudent={onAddStudent}
          onAddTransaction={onAddTransaction}
        />
      );
    case 'students':
      return <Students students={students} setStudents={setStudents} courses={courses} setCourses={setCourses} />;
    case 'staff':
      return <Staff staff={staff} setStaff={setStaff} />;
    case 'attendance':
      return <Attendance theme={theme} students={students} />;
    case 'finance':
      return (
        <Finance
          theme={theme}
          students={students}
          staff={staff}
          transactions={transactions}
          setTransactions={setTransactions}
          totalRevenue={stats.tuition}
        />
      );
    case 'courses':
      return <Courses theme={theme} courses={courses} setCourses={setCourses} />;
    case 'exams':
      return <Exams students={students} courses={courses} setStudents={setStudents} setCourses={setCourses} />;
    case 'grades':
      return <Grades students={students} courses={courses} />;
    case 'transcripts':
      return <Transcripts students={students} courses={courses} logo={logo} />;
    case 'certificates':
      return <Certificates students={students} logo={logo} />;
    case 'verify':
      return <VerificationPage logo={logo} />;
    case 'library':
      return <Library library={library} setLibrary={setLibrary} courses={courses} />;
    case 'hostels':
      return <Hostels students={students} />;
    case 'medical':
      return <Medical students={students} />;
    case 'inventory':
      return <Inventory />;
    case 'alumni':
      return <Alumni students={students} />;
    case 'sms':
      return <Communications students={students} staff={staff} />;
    case 'visitors':
      return <Visitors />;
    case 'reports':
      return <Reports />;
    case 'ai':
      // Preserve existing behavior: open modal and return to dashboard view.
      onOpenAIModal();
      onNavigate('dashboard');
      return (
        <Dashboard
          userName="Administrator"
          theme={theme}
          onNavigate={onNavigate}
          stats={stats}
          onAddStudent={onAddStudent}
          onAddTransaction={onAddTransaction}
        />
      );
    case 'settings':
      return (
        <Settings
          currentLogo={logo}
          onUpdateLogo={onUpdateLogo}
          currentTheme={theme}
          onUpdateTheme={onUpdateTheme}
        />
      );
    default:
      return (
        <Dashboard
          userName="Administrator"
          theme={theme}
          onNavigate={onNavigate}
          stats={stats}
          onAddStudent={onAddStudent}
          onAddTransaction={onAddTransaction}
        />
      );
  }
}

