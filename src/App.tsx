import ErrorBoundary from './components/ErrorBoundary';

import React, { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import AIModal from './components/AIModal';
import Login from './components/Login';
import VerificationPage from './components/VerificationPage';
import SessionTimeoutWarning from './components/SessionTimeoutWarning';
import ViewRenderer from './app/ViewRenderer';
import { Student, StaffMember, Transaction, Course, LibraryItem } from './types';
import { verifySession, logout as authLogout } from './services/authService';
import { getStaff } from './services/staffService';
import { getCourses } from './services/courseService';
import { getLibraryItems } from './services/libraryService';
import { getTransactions, createTransaction } from './services/financeService';
import { getStudents } from './services/studentService';
import { useCoreDataPolling } from './hooks/useCoreDataPolling';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [theme, setTheme] = useState('light');
  const [logo, setLogo] = useState("/BMI.svg");
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [showVerificationPage, setShowVerificationPage] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Session verification on mount with guaranteed timeout
  useEffect(() => {
    // Clean up any stale PII / mock caches from previous versions
    localStorage.removeItem('bmi_data_students');
    localStorage.removeItem('bmi_data_staff');
    localStorage.removeItem('bmi_data_transactions');
    localStorage.removeItem('bmi_data_courses');
    localStorage.removeItem('bmi_data_library');
    
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkSession = async () => {
      // GUARANTEED timeout - will ALWAYS stop loading after 4 seconds
      timeoutId = setTimeout(() => {
        if (isMounted) {
          console.warn('Forced timeout - stopping loading screen');
          setIsLoggedIn(false);
          setIsAuthenticating(false);
        }
      }, 4000);

      try {
        // Try to verify session
        const isValid = await verifySession();
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsLoggedIn(isValid);
          setIsAuthenticating(false);
        }
      } catch (error) {
        console.error('Session check error:', error);
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsLoggedIn(false);
          setIsAuthenticating(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Check if this is a verification URL - ORIGINAL working method
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    
    // Handle the ORIGINAL working format: /verify?id=SERIAL&hash=HASH
    if (window.location.pathname === '/verify' && idParam) {
      setShowVerificationPage(true);
    }
  }, []);

  // Core data — loaded from API only (no localStorage for PII entities)
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);

  const loadStaffCoursesLibraryTx = useCallback(async () => {
    try {
      const [st, co, lib, tx] = await Promise.all([
        getStaff({ perPage: 500 }),
        getCourses({ perPage: 500 }),
        getLibraryItems({ perPage: 500 }),
        getTransactions({ perPage: 500 }),
      ]);
      if (st.success && st.data) setStaff(st.data);
      if (co.success && co.data) setCourses(co.data);
      if (lib.success && lib.data) setLibrary(lib.data);
      if (tx.success && tx.data) setTransactions(tx.data);
    } catch (e) {
      console.error('[CoreData] refresh failed', e);
    }
  }, []);

  // Fetch students from API after login
  useEffect(() => {
    if (isLoggedIn) {
      const fetchStudents = async () => {
        setIsLoadingStudents(true);
        try {
          // Fetch with high perPage to get all students
          const result = await getStudents({ perPage: 1000 });

          if (result.success && result.data) {
            setStudents(result.data);
          } else {
            console.error('[Dashboard Sync] Failed to fetch students:', result.error);
            setStudents([]);
          }
        } catch (error) {
          console.error('[Dashboard Sync] Exception while fetching students:', error);
          setStudents([]);
        } finally {
          setIsLoadingStudents(false);
        }
      };
      
      fetchStudents();
    } else {
      setStudents([]);
      setIsLoadingStudents(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) void loadStaffCoursesLibraryTx();
    else {
      setStaff([]);
      setCourses([]);
      setLibrary([]);
      setTransactions([]);
    }
  }, [isLoggedIn, loadStaffCoursesLibraryTx]);

  useCoreDataPolling(isLoggedIn, 20000, loadStaffCoursesLibraryTx);

  // Handle Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Dashboard Stats
  const stats = {
    students: students.length,
    admissions: students.filter(s => s.status === 'Applicant').length,
    tuition: transactions.filter(t => t.status === 'Paid').reduce((acc, curr) => acc + curr.amt, 0),
    events: 5 // Mock
  };

  const handleAddStudent = (student: Student) => {
    setStudents(prev => [student, ...prev]);
  };

  const handleAddTransaction = async (amt: number) => {
    try {
      const res = await createTransaction({
        ref: `TX-${Date.now()}`,
        name: 'Quick Entry',
        desc: 'Ad-hoc Payment',
        amt,
        status: 'Paid',
        date: new Date().toISOString().split('T')[0],
      });
      if (res.success && res.data) {
        setTransactions((prev) => [res.data as Transaction, ...prev]);
      }
    } catch (e) {
      console.error('[Finance] quick entry failed', e);
    }
  };

  // Handle verification page (public access) - ONLY method
  if (showVerificationPage) {
    return <VerificationPage logo={logo} />
        </ErrorBoundary>;
  }

  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0033] via-[#4B0082] to-[#320064] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="w-20 h-20 rounded-xl border-2 border-[#FFD700] bg-white p-2 shadow-2xl animate-pulse">
            <img
              src={logo}
              alt="BMI University"
              className="w-full h-full object-contain"
            />
        </ErrorBoundary>
          </div>
          {/* Spinner */}
          <div className="w-10 h-10 border-4 border-[#FFD700]/30 border-t-[#FFD700] rounded-full animate-spin"></div>
          {/* Status Text */}
          <div className="text-center">
            <p className="text-[#FFD700] font-semibold text-lg">BMI University ERP</p>
            <p className="text-white/60 text-sm mt-1">Loading system modules...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login onLogin={(_token, _user) => setIsLoggedIn(true)} logo={logo} />
        </ErrorBoundary>;
  }

  return (
    <div className="flex bg-[#F8F9FA] dark:bg-[#0a0015] h-screen font-sans transition-colors duration-300 relative overflow-hidden">
      
      {/* Drawer Trigger Button - Updated position for small headers */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className={`fixed top-3 left-4 z-50 p-2 bg-[#4B0082] text-white rounded-full shadow-lg hover:scale-110 transition-all border-2 border-[#FFD700] ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        aria-label="Open Menu"
      >
        <Menu size={20} />
        </ErrorBoundary>
      </button>

      <Sidebar 
        currentView={currentView} 
        onChangeView={(view) => { 
            if (view === 'ai') setIsAIModalOpen(true); 
            else setCurrentView(view); 
        }} 
        onLogout={async () => {
            await authLogout();
            setIsLoggedIn(false);
        }} 
        logo={logo}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
        </ErrorBoundary>
      
      {/* Main Content Area */}
      <div className="flex-1 w-full p-2 md:p-4 lg:p-6 h-full overflow-hidden box-border">
        <main className="h-full rounded-3xl bg-white/50 dark:bg-black/10 border border-white/20 dark:border-gray-800 shadow-sm relative backdrop-blur-sm overflow-y-auto no-scrollbar flex flex-col">
           <ErrorBoundary>
          <ViewRenderer
              currentView={currentView}
              theme={theme}
              logo={logo}
              stats={stats}
              students={students}
              setStudents={setStudents}
              staff={staff}
              setStaff={setStaff}
              transactions={transactions}
              setTransactions={setTransactions}
              courses={courses}
              setCourses={setCourses}
              library={library}
              setLibrary={setLibrary}
              onOpenAIModal={() => setIsAIModalOpen(true)}
              onNavigate={setCurrentView}
              onUpdateLogo={(nextLogo) => setLogo(nextLogo)}
              onUpdateTheme={(nextTheme) => setTheme(nextTheme)}
              onAddStudent={handleAddStudent}
              onAddTransaction={handleAddTransaction}
            />
        </ErrorBoundary>
        </main>
      </div>
      
      <AIModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
        </ErrorBoundary>
      
      {/* Session Timeout Warning */}
      {isLoggedIn && (
        <SessionTimeoutWarning 
          onSessionExpired={() => {
            setIsLoggedIn(false);
          }} 
        />
        </ErrorBoundary>
      )}
    </div>
  );
}

export default App;

