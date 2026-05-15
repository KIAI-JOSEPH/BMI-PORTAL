/**
 * BMI UMS - React Router Configuration
 * Replaces the switch/case ViewRenderer with proper URL-based routing.
 * Each view gets its own route, enabling:
 * - Browser back/forward navigation
 * - Deep linking (e.g., /students goes directly to Students view)
 * - URL-based navigation state
 * - SEO-friendly URLs for public verification pages
 */
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDataStore } from '../stores/dataStore';
import { useUIStore } from '../stores/uiStore';

// Lazy-loaded page components for code splitting
const Dashboard = lazy(() => import('../components/Dashboard'));
const Students = lazy(() => import('../components/Students'));
const Staff = lazy(() => import('../components/Staff'));
const Attendance = lazy(() => import('../components/Attendance'));
const Finance = lazy(() => import('../components/Finance'));
const Courses = lazy(() => import('../components/Courses'));
const Exams = lazy(() => import('../components/Exams'));
const Grades = lazy(() => import('../components/Grades'));
const Transcripts = lazy(() => import('../components/Transcripts').then(m => ({ default: m.Transcripts })));
const Certificates = lazy(() => import('../components/Certificates'));
const Library = lazy(() => import('../components/Library').then(m => ({ default: m.Library })));
const Hostels = lazy(() => import('../components/Hostels'));
const Medical = lazy(() => import('../components/Medical').then(m => ({ default: m.Medical })));
const Inventory = lazy(() => import('../components/Inventory'));
const Alumni = lazy(() => import('../components/Alumni'));
const Communications = lazy(() => import('../components/Communications'));
const Visitors = lazy(() => import('../components/Visitors'));
const Reports = lazy(() => import('../components/Reports'));
const Settings = lazy(() => import('../components/Settings'));

// Page-level loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading module...</p>
      </div>
    </div>
  );
}

// Wrapper to provide legacy props expected by components (from ViewRenderer days)
function LegacyPropsWrapper({ component: Component }: { component: any }) {
  const ds = useDataStore();
  const ui = useUIStore();
  
  return <Component 
    students={ds.students} 
    setStudents={ds.setStudents}
    staff={ds.staff}
    setStaff={ds.setStaff}
    courses={ds.courses}
    setCourses={ds.setCourses}
    library={ds.library}
    setLibrary={ds.setLibrary}
    transactions={ds.transactions}
    setTransactions={ds.setTransactions}
    logo={ui.logo}
    theme={ui.theme}
    onUpdateLogo={ui.setLogo}
  />;
}

/**
 * AppRoutes - authenticated route tree
 * All routes require the user to be logged in (handled by parent AppLayout).
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<LegacyPropsWrapper component={Students} />} />
        <Route path="/staff" element={<LegacyPropsWrapper component={Staff} />} />
        <Route path="/attendance" element={<LegacyPropsWrapper component={Attendance} />} />
        <Route path="/finance" element={<LegacyPropsWrapper component={Finance} />} />
        <Route path="/courses" element={<LegacyPropsWrapper component={Courses} />} />
        <Route path="/exams" element={<LegacyPropsWrapper component={Exams} />} />
        <Route path="/grades" element={<LegacyPropsWrapper component={Grades} />} />
        <Route path="/transcripts" element={<LegacyPropsWrapper component={Transcripts} />} />
        <Route path="/certificates" element={<LegacyPropsWrapper component={Certificates} />} />
        <Route path="/library" element={<LegacyPropsWrapper component={Library} />} />
        <Route path="/hostels" element={<LegacyPropsWrapper component={Hostels} />} />
        <Route path="/medical" element={<LegacyPropsWrapper component={Medical} />} />
        <Route path="/inventory" element={<LegacyPropsWrapper component={Inventory} />} />
        <Route path="/alumni" element={<LegacyPropsWrapper component={Alumni} />} />
        <Route path="/communications" element={<LegacyPropsWrapper component={Communications} />} />
        <Route path="/visitors" element={<LegacyPropsWrapper component={Visitors} />} />
        <Route path="/reports" element={<LegacyPropsWrapper component={Reports} />} />
        <Route path="/settings" element={<LegacyPropsWrapper component={Settings} />} />
        {/* Catch-all redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
