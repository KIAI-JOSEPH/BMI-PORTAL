/**
 * BMI UMS - React Router Configuration
 * Replaces the switch/case ViewRenderer with proper URL-based routing.
 * Each view gets its own route, enabling:
 * - Browser back/forward navigation
 * - Deep linking (e.g., /students goes directly to Students view)
 * - URL-based navigation state
 * - SEO-friendly URLs for public verification pages
 */
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

// Lazy-loaded page components for code splitting
const Dashboard = lazy(() => import("../components/Dashboard"));
const Students = lazy(() => import("../components/Students"));
const Staff = lazy(() => import("../components/Staff"));
const Attendance = lazy(() => import("../components/Attendance"));
const Finance = lazy(() => import("../components/Finance"));
const Courses = lazy(() => import("../components/Courses"));
const Exams = lazy(() => import("../components/Exams"));
const Grades = lazy(() => import("../components/Grades"));
const Transcripts = lazy(() =>
  import("../components/Transcripts").then((m) => ({ default: m.Transcripts })),
);
const Certificates = lazy(() => import("../components/Certificates"));
const Library = lazy(() =>
  import("../components/Library").then((m) => ({ default: m.Library })),
);
const Hostels = lazy(() => import("../components/Hostels"));
const Medical = lazy(() =>
  import("../components/Medical").then((m) => ({ default: m.Medical })),
);
const Inventory = lazy(() => import("../components/Inventory"));
const Alumni = lazy(() => import("../components/Alumni"));
const Communications = lazy(() => import("../components/Communications"));
const Visitors = lazy(() => import("../components/Visitors"));
const Reports = lazy(() => import("../components/Reports"));
const Settings = lazy(() => import("../components/Settings"));
const StudentPortal = lazy(() => import("../components/StudentPortal"));
const FacultyPortal = lazy(() => import("../components/FacultyPortal"));

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

/**
 * RoleGuard — redirects to /dashboard when the signed-in user's role
 * does not match the required role.  Always passes when role is undefined
 * (i.e. admin / staff routes that are open to all authenticated users).
 */
function RoleGuard({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  if (!user || user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
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
        <Route path="/students" element={<Students />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/exams" element={<Exams />} />
        <Route path="/grades" element={<Grades />} />
        <Route path="/transcripts" element={<Transcripts />} />
        <Route path="/certificates" element={<Certificates />} />
        <Route path="/library" element={<Library />} />
        <Route path="/hostels" element={<Hostels />} />
        <Route path="/medical" element={<Medical />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/alumni" element={<Alumni />} />
        <Route path="/communications" element={<Communications />} />
        <Route path="/visitors" element={<Visitors />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        {/* Role-specific portals — guarded by role */}
        <Route
          path="/student"
          element={
            <RoleGuard role="student">
              <StudentPortal />
            </RoleGuard>
          }
        />
        <Route
          path="/faculty"
          element={
            <RoleGuard role="faculty">
              <FacultyPortal />
            </RoleGuard>
          }
        />
        {/* Catch-all redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
