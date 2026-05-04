
import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Staff from './components/Staff';
import Attendance from './components/Attendance';
import Finance from './components/Finance';
import Courses from './components/Courses';
import Exams from './components/Exams';
import { Transcripts } from './components/Transcripts';
import Certificates from './components/Certificates';
import { Library } from './components/Library';
import Hostels from './components/Hostels';
import { Medical } from './components/Medical';
import Inventory from './components/Inventory';
import Alumni from './components/Alumni';
import Communications from './components/Communications';
import Visitors from './components/Visitors';
import Reports from './components/Reports';
import AIModal from './components/AIModal';
import Settings from './components/Settings';
import Login from './components/Login';
import VerificationPage from './components/VerificationPage';
import SessionTimeoutWarning from './components/SessionTimeoutWarning';
import { Student, StaffMember, Transaction, Course, LibraryItem } from './types';
import { verifySession, logout as authLogout } from './services/authService';

const initialCourses: Course[] = [
    { id: 'CRS-101', name: 'Systematic Theology I', code: 'THEO101', faculty: 'Theology', department: 'Biblical Studies', level: 'Undergraduate', credits: 3, status: 'Published', description: 'Introduction to core theological doctrines.', syllabus: 'God, Creation, Revelation.' },
    { id: 'CRS-102', name: 'Introduction to Web Development', code: 'CS101', faculty: 'ICT', department: 'Computer Science', level: 'Undergraduate', credits: 4, status: 'Published', description: 'Basics of HTML, CSS, and JS.', syllabus: 'Web Standards, Frontend Dev.' },
    { id: 'CRS-201', name: 'Business Ethics', code: 'BUS201', faculty: 'Business', department: 'Management', level: 'Undergraduate', credits: 3, status: 'Published', description: 'Ethical principles in modern business.', syllabus: 'Corporate Responsibility, Ethics.' },
    { id: 'CRS-301', name: 'Doctor of Ministry (Dmin)', code: 'DMIN-800', faculty: 'Theology', department: 'Ministry', level: 'Postgraduate', credits: 45, status: 'Published', description: 'Advanced professional practice in ministry.', syllabus: 'Project Design, Applied Theology.' },
    { id: 'CRS-302', name: 'Doctor of Christian Education', code: 'DED-800', faculty: 'Education', department: 'Christian Education', level: 'Postgraduate', credits: 45, status: 'Published', description: 'Terminal degree in educational ministry.', syllabus: 'Ed Research, Theory Development.' },
    { id: 'CRS-401', name: 'Diploma in Christian Ministry and Theology', code: 'DCMT-200', faculty: 'Theology', department: 'Ministry', level: 'Diploma', credits: 60, status: 'Published', description: 'Comprehensive training for ministry and theology.', syllabus: 'Biblical Studies, Ministry Skills.' },
    { id: 'CRS-402', name: 'Certificate in Christian Ministry and Theology', code: 'CCMT-100', faculty: 'Theology', department: 'Ministry', level: 'Certificate', credits: 30, status: 'Published', description: 'Foundational course in ministry and theology.', syllabus: 'Introduction to Bible, Christian Life.' },
    { id: 'CRS-501', name: 'BA in Biblical Studies', code: 'BABS-300', faculty: 'Theology', department: 'Biblical Studies', level: 'Undergraduate', credits: 120, status: 'Published', description: 'In-depth study of the Bible and its historical context.', syllabus: 'Old Testament, New Testament, Hermeneutics.' },
    { id: 'CRS-502', name: 'BA in Christian Education', code: 'BACE-300', faculty: 'Education', department: 'Christian Education', level: 'Undergraduate', credits: 120, status: 'Published', description: 'Training for educational leadership in Christian contexts.', syllabus: 'Pedagogy, Curriculum Design, Youth Ministry.' },
    { id: 'CRS-503', name: 'BA in Ministry & Leadership', code: 'BAML-300', faculty: 'Theology', department: 'Ministry', level: 'Undergraduate', credits: 120, status: 'Published', description: 'Preparing leaders for effective church and para-church ministry.', syllabus: 'Leadership Principles, Pastoral Care, Evangelism.' },
    { id: 'CRS-504', name: 'BA in Theological Studies', code: 'BATS-300', faculty: 'Theology', department: 'Theological Studies', level: 'Undergraduate', credits: 120, status: 'Published', description: 'Comprehensive theological education for modern ministry.', syllabus: 'Systematic Theology, Church History, Ethics.' },
    { id: 'CRS-505', name: 'BA in Worship Leadership', code: 'BAWL-300', faculty: 'Theology', department: 'Worship', level: 'Undergraduate', credits: 120, status: 'Published', description: 'Equipping worship leaders with biblical and musical foundations.', syllabus: 'Worship Theology, Music Theory, Ensemble.' },
    { id: 'CRS-601', name: 'Masters of Divinity', code: 'MDIV-600', faculty: 'Theology', department: 'Divinity', level: 'Postgraduate', credits: 90, status: 'Published', description: 'Professional degree for ordained ministry.', syllabus: 'Advanced Greek/Hebrew, Preaching, Pastoral Counseling.' },
    { id: 'CRS-602', name: 'MA in Christian Counseling', code: 'MACC-600', faculty: 'Theology', department: 'Counseling', level: 'Postgraduate', credits: 60, status: 'Published', description: 'Integrating psychology and theology for counseling.', syllabus: 'Psychopathology, Family Systems, Ethics in Counseling.' },
    { id: 'CRS-603', name: 'MA in Theological Studies', code: 'MATS-600', faculty: 'Theology', department: 'Theological Studies', level: 'Postgraduate', credits: 60, status: 'Published', description: 'Advanced academic study of theology.', syllabus: 'Contemporary Theology, Historical Theology, Research Methods.' },
    { id: 'CRS-604', name: 'MA in Christian Education', code: 'MACE-600', faculty: 'Education', department: 'Christian Education', level: 'Postgraduate', credits: 60, status: 'Published', description: 'Advanced preparation for educational ministry.', syllabus: 'Educational Philosophy, Administration, Adult Education.' },
    { id: 'CRS-605', name: 'MA in Christian Apologetics', code: 'MACA-600', faculty: 'Theology', department: 'Apologetics', level: 'Postgraduate', credits: 60, status: 'Published', description: 'Defending the Christian faith in a secular world.', syllabus: 'Philosophy of Religion, Cults, Science and Faith.' },
    { id: 'CRS-606', name: 'MA in Christian Leadership', code: 'MACL-600', faculty: 'Theology', department: 'Leadership', level: 'Postgraduate', credits: 60, status: 'Published', description: 'Developing executive leadership skills for ministry.', syllabus: 'Organizational Leadership, Strategic Planning, Conflict Resolution.' },
];

const initialStudents: Student[] = Array.from({ length: 50 }, (_, i) => {
  const fNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Paul', 'Ashley', 'Steven', 'Kimberly', 'Andrew', 'Emily', 'Kenneth', 'Donna', 'Joshua', 'Michelle', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Edward', 'Deborah', 'Ronald', 'Stephanie'];
  const lNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins'];
  const faculties = ['Theology', 'ICT', 'Business', 'Education'];
  const depts = { 'Theology': 'Biblical Studies', 'ICT': 'Computer Science', 'Business': 'Management', 'Education': 'Curriculum Dev' };
  const levels: Student['academicLevel'][] = ['Diploma', 'Degree', 'Masters', 'PhD'];
  
  const fn = fNames[i % fNames.length];
  const ln = lNames[(i * 3 + 7) % lNames.length];
  const fac = faculties[i % faculties.length];
  const lvl = levels[i % levels.length];
  
  return {
    id: `BMI-2023-${(i + 101).toString()}`,
    firstName: fn,
    lastName: ln,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@bmi.edu`,
    phone: `+254 7${Math.floor(Math.random() * 90)} ${Math.floor(Math.random() * 900)} ${Math.floor(Math.random() * 900)}`,
    gender: i % 2 === 0 ? 'Male' : 'Female',
    faculty: fac,
    department: depts[fac as keyof typeof depts],
    careerPath: `${lvl} in ${fac}`,
    academicLevel: lvl,
    admissionYear: (2021 + (i % 3)).toString(),
    enrollmentTerm: 'Fall 2023',
    status: i > 45 ? 'Graduated' : 'Active',
    standing: i % 15 === 0 ? 'Probation' : 'Good',
    gpa: parseFloat((2.0 + Math.random() * 2.0).toFixed(2)),
    avatarColor: ['bg-purple-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600'][i % 5],
    photoZoom: 1
  };
});

const initialStaff: StaffMember[] = [
    { id: 'STF-001', name: 'Dr. Samuel Kiptoo', role: 'Dean', department: 'School of Theology', email: 's.kiptoo@bmi.edu', phone: '+254 711 000 001', status: 'Full-time', category: 'Academic', specialization: 'Systematic Theology', office: 'Zion Wing 101', officeHours: 'Mon-Wed 10-12', avatarColor: 'bg-purple-700', joinDate: '2015-08-01' },
    { id: 'STF-002', name: 'Prof. Alice Mwangi', role: 'Head of Dept', department: 'Dept. of ICT', email: 'a.mwangi@bmi.edu', phone: '+254 711 000 002', status: 'Full-time', category: 'Academic', specialization: 'Computer Science', office: 'Tech Hub 204', officeHours: 'Tue-Thu 14-16', avatarColor: 'bg-blue-700', joinDate: '2018-01-15' },
    { id: 'STF-003', name: 'Dr. Jane Okumu', role: 'Senior Lecturer', department: 'School of Business', email: 'j.okumu@bmi.edu', phone: '+254 711 000 003', status: 'Full-time', category: 'Academic', specialization: 'Business Ethics', office: 'Main Hall 3B', officeHours: 'Fri 09-11', avatarColor: 'bg-amber-700', joinDate: '2019-05-20' },
    { id: 'STF-004', name: 'Rev. Peter Kamau', role: 'Chaplain', department: 'Administration', email: 'p.kamau@bmi.edu', phone: '+254 711 000 004', status: 'Full-time', category: 'Administrative', specialization: 'Pastoral Care', office: 'Chapel Office', officeHours: 'Daily 08-17', avatarColor: 'bg-emerald-700', joinDate: '2016-03-10' },
    { id: 'STF-005', name: 'Sarah Wilson', role: 'Registrar', department: 'Administration', email: 'registrar@bmi.edu', phone: '+254 711 000 005', status: 'Full-time', category: 'Management', specialization: 'Academic Admin', office: 'Admin Block A', officeHours: 'Mon-Fri 08-17', avatarColor: 'bg-rose-700', joinDate: '2020-11-01' }
];

const initialTransactions: Transaction[] = initialStudents.slice(0, 30).map((s, i) => ({
    ref: `TXN-${2024000 + i}`,
    name: `${s.firstName} ${s.lastName}`,
    desc: 'Tuition Payment',
    amt: 1500 + Math.floor(Math.random() * 2000),
    status: i % 5 === 0 ? 'Pending' : 'Paid',
    date: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString().split('T')[0]
}));

const initialLibrary: LibraryItem[] = [
    { id: 'LIB-101', title: 'Systematic Theology', author: 'Wayne Grudem', category: 'Theology', type: 'Hardcopy', status: 'Available', year: '1994', description: 'Comprehensive introduction to biblical doctrine.', downloadUrl: '' },
    { id: 'LIB-102', title: 'Clean Code', author: 'Robert C. Martin', category: 'ICT', type: 'E-Book', status: 'Digital', year: '2008', description: 'A Handbook of Agile Software Craftsmanship.', downloadUrl: 'https://example.com/cleancode.pdf' },
    { id: 'LIB-103', title: 'Principles of Marketing', author: 'Philip Kotler', category: 'Business', type: 'Hardcopy', status: 'Borrowed', year: '2017', description: 'Standard text for marketing students.', downloadUrl: '' },
    { id: 'LIB-104', title: 'Teaching to Change Lives', author: 'Howard Hendricks', category: 'Education', type: 'PDF', status: 'Digital', year: '1987', description: 'Seven proven laws of the teacher.', downloadUrl: 'https://example.com/teaching.pdf' },
    { id: 'LIB-105', title: 'Church History in Plain Language', author: 'Bruce Shelley', category: 'Theology', type: 'Hardcopy', status: 'Available', year: '2013', description: 'Accessible history of Christianity.', downloadUrl: '' }
];

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
    // Clean up any stale PII that may have been stored in previous versions
    localStorage.removeItem('bmi_data_students');
    
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

  // Core Data States — students NOT persisted to localStorage (PII protection)
  const [students, setStudents] = useState<Student[]>(initialStudents);

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('bmi_data_staff');
    return saved ? JSON.parse(saved) : initialStaff;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('bmi_data_transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('bmi_data_courses');
    return saved ? JSON.parse(saved) : initialCourses;
  });

  const [library, setLibrary] = useState<LibraryItem[]>(() => {
    const saved = localStorage.getItem('bmi_data_library');
    return saved ? JSON.parse(saved) : initialLibrary;
  });

  // Persist non-PII data only
  // Students are NOT persisted — they contain PII (names, emails, phone, GPA)
  useEffect(() => { localStorage.setItem('bmi_data_staff', JSON.stringify(staff)); }, [staff]);
  useEffect(() => { localStorage.setItem('bmi_data_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('bmi_data_courses', JSON.stringify(courses)); }, [courses]);
  useEffect(() => { localStorage.setItem('bmi_data_library', JSON.stringify(library)); }, [library]);

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

  const handleAddTransaction = (amt: number) => {
    const newTx: Transaction = {
      ref: `TX-${Date.now()}`,
      name: 'Quick Entry',
      desc: 'Ad-hoc Payment',
      amt,
      status: 'Paid',
      date: new Date().toISOString().split('T')[0]
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  // Handle verification page (public access) - ONLY method
  if (showVerificationPage) {
    return <VerificationPage logo={logo} />;
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
    return <Login onLogin={(_token, _user) => setIsLoggedIn(true)} logo={logo} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard userName="Administrator" theme={theme} onNavigate={setCurrentView} stats={stats} onAddStudent={handleAddStudent} onAddTransaction={handleAddTransaction} />;
      case 'students': return <Students students={students} setStudents={setStudents} courses={courses} setCourses={setCourses} />;
      case 'staff': return <Staff staff={staff} setStaff={setStaff} />;
      case 'attendance': return <Attendance theme={theme} students={students} />;
      case 'finance': return <Finance theme={theme} students={students} staff={staff} transactions={transactions} setTransactions={setTransactions} totalRevenue={stats.tuition} />;
      case 'courses': return <Courses theme={theme} courses={courses} setCourses={setCourses} />;
      case 'exams': return <Exams students={students} courses={courses} setStudents={setStudents} setCourses={setCourses} />;
      case 'transcripts': return <Transcripts students={students} courses={courses} logo={logo} />;
      case 'certificates': return <Certificates students={students} logo={logo} />;
      case 'verify': return <VerificationPage logo={logo} />;
      case 'library': return <Library library={library} setLibrary={setLibrary} courses={courses} />;
      case 'hostels': return <Hostels students={students} />;
      case 'medical': return <Medical students={students} />;
      case 'inventory': return <Inventory />;
      case 'alumni': return <Alumni students={students} />;
      case 'sms': return <Communications students={students} staff={staff} />;
      case 'visitors': return <Visitors />;
      case 'reports': return <Reports />;
      case 'ai': 
        setIsAIModalOpen(true); 
        setCurrentView('dashboard'); 
        return <Dashboard userName="Administrator" theme={theme} onNavigate={setCurrentView} stats={stats} onAddStudent={handleAddStudent} onAddTransaction={handleAddTransaction} />;
      case 'settings': return <Settings currentLogo={logo} onUpdateLogo={setLogo} currentTheme={theme} onUpdateTheme={setTheme} />;
      default: return <Dashboard userName="Administrator" theme={theme} onNavigate={setCurrentView} stats={stats} onAddStudent={handleAddStudent} onAddTransaction={handleAddTransaction} />;
    }
  };

  return (
    <div className="flex bg-[#F8F9FA] dark:bg-[#0a0015] h-screen font-sans transition-colors duration-300 relative overflow-hidden">
      
      {/* Drawer Trigger Button - Updated position for small headers */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className={`fixed top-3 left-4 z-50 p-2 bg-[#4B0082] text-white rounded-full shadow-lg hover:scale-110 transition-all border-2 border-[#FFD700] ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        aria-label="Open Menu"
      >
        <Menu size={20} />
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
      
      {/* Main Content Area */}
      <div className="flex-1 w-full p-2 md:p-4 lg:p-6 h-full overflow-hidden box-border">
        <main className="h-full rounded-3xl bg-white/50 dark:bg-black/10 border border-white/20 dark:border-gray-800 shadow-sm relative backdrop-blur-sm overflow-y-auto no-scrollbar flex flex-col">
           {renderContent()}
        </main>
      </div>
      
      <AIModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
      
      {/* Session Timeout Warning */}
      {isLoggedIn && (
        <SessionTimeoutWarning 
          onSessionExpired={() => {
            setIsLoggedIn(false);
          }} 
        />
      )}
    </div>
  );
}

export default App;

