
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Mail, 
  Phone, 
  Download,
  GraduationCap,
  LayoutGrid,
  List,
  RefreshCw,
  Globe,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { Student, Course } from '../types';
import StudentRegistrationModal from './StudentRegistrationModal';
import ImportModal from './ImportModal';
import { deleteStudent as deleteStudentAPI, getStudents } from '../services/studentService';
import { getPrograms } from '../services/catalogService';
import { BulkEntryModal } from './BulkEntryModal';
import { postStudentBatch } from '../services/batchService';
import { getAllCampuses, Campus } from '../services/campusService';

import { useDataStore } from '../stores/dataStore';

interface StudentsProps {
  students?: Student[];
  setStudents?: React.Dispatch<React.SetStateAction<Student[]>> | ((students: Student[]) => void);
  courses?: Course[];
  setCourses?: React.Dispatch<React.SetStateAction<Course[]>>;
}

const Students: React.FC<StudentsProps> = (props) => {
  const storeStudents = useDataStore((s) => s.students);
  const storeSetStudents = useDataStore((s) => s.setStudents);
  const storeCourses = useDataStore((s) => s.courses);
  
  const students = props.students ?? storeStudents;
  const courses = props.courses ?? storeCourses;
  
  // Custom setter that supports both React.SetStateAction and simple array
  const setStudents = (action: React.SetStateAction<Student[]>) => {
    if (props.setStudents) {
      // If parent provided setter, use it directly
      (props.setStudents as any)(action);
    } else {
      // Otherwise use store setter
      if (typeof action === 'function') {
        storeSetStudents((action as (prev: Student[]) => Student[])(storeStudents));
      } else {
        storeSetStudents(action);
      }
    }
  };
  
  const setCourses = (action: React.SetStateAction<Course[]>) => {
    if (props.setCourses) {
      props.setCourses(action);
    }
    // Note: storeSetCourses could be added here if needed, but not heavily used
  };
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('All Programs');
  const [programRows, setProgramRows] = useState<Array<{ id: string; label: string }>>([]);
  const [campusFilter, setCampusFilter] = useState('All Campuses');
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [bulkStudentsOpen, setBulkStudentsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [academicLevelFilter, setAcademicLevelFilter] = useState('All Levels');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await getPrograms();
      if (cancelled || !r.success || !r.data) return;
      setProgramRows(
        r.data.map((p: Record<string, unknown>) => ({
          id: String(p.id),
          label: `${String(p.program_code ?? '')} — ${String(p.name ?? '')}`,
        }))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getAllCampuses();
        if (!cancelled) setCampuses(data);
      } catch (error) {
        console.error('Failed to load campuses:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = `${student.full_name || `${student.first_name} ${student.last_name}`} ${student.student_code}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProgram = programFilter === 'All Programs' || student.programme === programFilter;
      const matchesStatus = statusFilter === 'All Status' || student.status === statusFilter;
      const matchesLevel = academicLevelFilter === 'All Levels' || student.programme === academicLevelFilter;
      const matchesCampus = campusFilter === 'All Campuses' || student.campus_id === campusFilter;
      return matchesSearch && matchesProgram && matchesStatus && matchesLevel && matchesCampus;
    });
  }, [students, searchTerm, programFilter, statusFilter, academicLevelFilter, campusFilter]);

  const handleAdd = (student: Student) => {
    if (editingStudent) {
      // Update existing student in local state
      setStudents(prev => prev.map(s => s.id === student.id ? student : s));
    } else {
      // Add new student to local state
      setStudents(prev => [student, ...prev]);
    }
    setEditingStudent(undefined);
    setIsModalOpen(false);
  };

  const deleteStudent = async (id: string) => {
    if (window.confirm('Are you sure you want to expel/remove this student record?')) {
      try {
        const result = await deleteStudentAPI(id);

        if (result.success) {
          setStudents(prev => prev.filter(s => s.id !== id));
          alert('Student removed successfully!');
        } else {
          alert(result.error || 'Failed to delete student. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('An unexpected error occurred while deleting the student.');
      }
    }
  };

  const openEdit = (student: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleSyncApplications = async (targetCampusId?: string) => {
    setIsSyncing(true);
    try {
      const activeCampusId = targetCampusId !== undefined ? targetCampusId : (campusFilter === 'All Campuses' ? undefined : campusFilter);
      const r = await getStudents({ 
        perPage: 1000,
        campusId: activeCampusId
      });
      if (r.success && r.data) setStudents(r.data);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const activeCampusId = campusFilter === 'All Campuses' ? undefined : campusFilter;
    handleSyncApplications(activeCampusId);
  }, [campusFilter]);

  const handleImportStudents = (newStudents: Student[], newCourses: Partial<Course>[]) => {
    setStudents(prev => [...newStudents, ...prev]);
    if (setCourses && newCourses.length > 0) {
      setCourses(prev => [...(newCourses as Course[]), ...prev]);
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in relative">
      {/* Sticky Page Header */}
      <div className="flex-shrink-0 sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex flex-col md:flex-row justify-between items-center gap-2 shadow-sm min-h-[60px]">
        <div className="flex items-center gap-3 pl-14 w-full md:w-auto">
           <div className="w-1 h-5 bg-[#FFD700] rounded-none"></div>
           <div className="flex flex-col">
              <h2 className="text-base md:text-lg font-bold text-[#2E004F] dark:text-white tracking-tight uppercase leading-none">Student Registry</h2>
              <p className="text-[8px] md:text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Enrollment Data • Total: {students.length}</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3 pl-14 md:pl-0 w-full md:w-auto justify-end">
           <button 
             onClick={handleSyncApplications}
             disabled={isSyncing}
             className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[#4B0082] dark:text-purple-300 rounded-none font-bold text-[9px] uppercase tracking-widest hover:border-[#4B0082] transition-all shadow-sm disabled:opacity-50"
             title="Fetch from bmiuniversity.org/apply/"
           >
             {isSyncing ? <RefreshCw size={12} className="animate-spin" /> : <Globe size={12} />}
             {isSyncing ? 'Syncing...' : 'Sync Web Apps'}
           </button>
           <button
             onClick={() => setBulkStudentsOpen(true)}
             className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-700 text-white rounded-none font-bold text-[9px] uppercase tracking-widest hover:bg-indigo-800 transition-all shadow-sm"
           >
             Bulk JSON
           </button>
           <button
             onClick={() => setIsImportOpen(true)}
             className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-none font-bold text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm"
           >
             <FileSpreadsheet size={12} /> Import Excel
           </button>

           <div className="flex bg-white dark:bg-gray-800 p-1 rounded-none shadow-sm border border-gray-100 dark:border-gray-700">
             <button onClick={() => setViewMode('grid')} className={`p-1.5 transition-all ${viewMode === 'grid' ? 'bg-[#4B0082] text-white' : 'text-gray-400 hover:text-[#4B0082]'}`}><LayoutGrid size={14} /></button>
             <button onClick={() => setViewMode('table')} className={`p-1.5 transition-all ${viewMode === 'table' ? 'bg-[#4B0082] text-white' : 'text-gray-400 hover:text-[#4B0082]'}`}><List size={14} /></button>
           </div>
           <button 
             onClick={() => { setEditingStudent(undefined); setIsModalOpen(true); }}
             className="flex items-center gap-2 px-4 py-2 bg-[#4B0082] text-white rounded-none shadow-xl hover:bg-black transition-all font-black text-[9px] uppercase tracking-widest border border-[#FFD700]/30"
           >
            <Plus size={12} className="text-[#FFD700]" /> New Admission
          </button>
        </div>
      </div>

      {/* Sticky Top Tab Bar */}
      <div className="sticky top-[60px] z-30 bg-[#F8F9FA]/95 dark:bg-[#0a0015]/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar shadow-sm">
         <div className="flex items-center gap-2 mr-4 text-gray-400">
            <Layers size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Levels</span>
         </div>
         {['All Levels', 'Certificate', 'Diploma', 'Degree', 'Masters', 'PhD'].map((level) => (
            <button
              key={level}
              onClick={() => setAcademicLevelFilter(level)}
              className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                academicLevelFilter === level 
                  ? 'bg-[#4B0082] text-white shadow-lg shadow-purple-500/20 scale-105 border border-purple-500/50' 
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-[#4B0082]'
              }`}
            >
              {level}
            </button>
         ))}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm">
           <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search by Name, ID or Faculty..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-none outline-none font-bold text-xs dark:text-white focus:ring-1 focus:ring-[#4B0082]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <select 
             value={campusFilter}
             onChange={(e) => setCampusFilter(e.target.value)}
             className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[10px] font-black uppercase outline-none cursor-pointer dark:text-white max-w-[220px]"
             title="Filter by campus"
           >
             <option value="All Campuses">All Campuses</option>
             {campuses.map((campus) => (
               <option key={campus.id} value={campus.id}>{campus.name}</option>
             ))}
           </select>
           <select 
             value={programFilter}
             onChange={(e) => setProgramFilter(e.target.value)}
             className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[10px] font-black uppercase outline-none cursor-pointer dark:text-white max-w-[220px]"
             title="Filter by program (from catalog)"
           >
             <option value="All Programs">All Programs</option>
             {programRows.map((p) => (
               <option key={p.id} value={p.id}>{p.label}</option>
             ))}
           </select>
           <select 
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[10px] font-black uppercase outline-none cursor-pointer dark:text-white"
           >
             {['All Status', 'Active', 'Applicant', 'On Leave', 'Graduated', 'Suspended'].map(s => <option key={s} value={s}>{s}</option>)}
           </select>
        </div>

        {/* Existing Grid/List Logic ... */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStudents.map((student) => (
              <div key={student.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 flex flex-col group hover:shadow-2xl transition-all relative overflow-hidden">
                 <div className={`absolute top-0 left-0 w-full h-1 ${student.status === 'Applicant' ? 'bg-orange-500' : 'bg-[#4B0082]'}`}></div>
                 
                 <div className="flex justify-between items-start mb-6">
                    <div className={`w-16 h-16 rounded-none ${student.avatar_color} flex items-center justify-center text-white font-bold text-2xl shadow-lg overflow-hidden border-2 border-white dark:border-gray-700`}>
                       {student.photo ? (
                          <img src={student.photo} className="w-full h-full object-cover" style={{ transform: `scale(${student.photo_zoom}) translate(${student.photo_position?.x}px, ${student.photo_position?.y}px)` }} />
                       ) : (
                          student.first_name.charAt(0)
                       )}
                    </div>
                    <div className="flex flex-col items-end">
                       <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border ${
                          student.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          student.status === 'Applicant' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          student.status === 'Suspended' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                       }`}>
                          {student.status}
                       </span>
                       <div className="flex gap-1 mt-2">
                          <button onClick={() => openEdit(student)} className="text-gray-300 hover:text-[#4B0082] transition-colors p-1"><Edit size={14} /></button>
                          <button onClick={() => deleteStudent(student.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1"><Trash2 size={14} /></button>
                       </div>
                    </div>
                 </div>

                 <div className="mb-6">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none group-hover:text-[#4B0082] transition-colors">{student.full_name || `${student.first_name} ${student.last_name}`}</h3>
                    <p className="text-xs font-bold text-gray-400 mt-1">{student.student_code}</p>
                    <p className="text-[10px] font-black text-[#4B0082] dark:text-purple-300 uppercase tracking-widest mt-2">{student.programme}</p>
                 </div>

                 <div className="mt-auto space-y-3 pt-4 border-t border-gray-50 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                       <Mail size={12} className="text-gray-400" /> <span className="truncate">{student.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                       <Phone size={12} className="text-gray-400" /> <span>{student.phone}</span>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-none shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
             <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                   <thead className="sticky top-0 z-20">
                      <tr className="bg-gray-900 text-gray-400 uppercase text-[9px] font-black tracking-[0.2em] shadow-md">
                         <th className="px-6 py-4 sticky top-0 bg-gray-900 z-10">Student Identity</th>
                         <th className="px-6 py-4 sticky top-0 bg-gray-900 z-10">Academic Program</th>
                         <th className="px-6 py-4 sticky top-0 bg-gray-900 z-10">Contact Node</th>
                         <th className="px-6 py-4 text-center sticky top-0 bg-gray-900 z-10">Enrollment</th>
                         <th className="px-6 py-4 text-center sticky top-0 bg-gray-900 z-10">Status</th>
                         <th className="px-6 py-4 text-right sticky top-0 bg-gray-900 z-10">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {filteredStudents.map((student) => (
                         <tr key={student.id} className="hover:bg-purple-50/20 dark:hover:bg-gray-700/20 transition-all group">
                            <td className="px-6 py-5">
                               <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-none ${student.avatar_color} flex items-center justify-center text-white text-xs font-bold overflow-hidden`}>
                                     {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : student.first_name.charAt(0)}
                                  </div>
                                  <div>
                                     <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{student.full_name || `${student.first_name} ${student.last_name}`}</p>
                                     <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{student.student_code}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-5">
                               <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">{student.program_code}</p>
                               <p className="text-[9px] font-black text-[#4B0082] dark:text-purple-300 uppercase tracking-widest mt-0.5">{student.program_code}</p>
                            </td>
                            <td className="px-6 py-5 text-xs text-gray-500 font-medium">
                               <p>{student.email}</p>
                               <p className="mt-0.5">{student.phone}</p>
                            </td>
                            <td className="px-6 py-5 text-center text-[10px] font-bold text-gray-500 uppercase">{student.admission_date}</td>
                            <td className="px-6 py-5 text-center">
                               <span className={`px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-widest border ${
                                  student.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                  student.status === 'Applicant' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  'bg-gray-50 text-gray-500 border-gray-200'
                               }`}>
                                  {student.status}
                               </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                               <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => openEdit(student)} className="p-2 text-gray-400 hover:text-[#4B0082]"><Edit size={16} /></button>
                                  <button onClick={() => deleteStudent(student.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </div>

      <StudentRegistrationModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingStudent(undefined); }}
        onSuccess={handleAdd}
        initialData={editingStudent}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      <BulkEntryModal
        open={bulkStudentsOpen}
        onClose={() => setBulkStudentsOpen(false)}
        title="Bulk students (JSON lines)"
        entity="students"
        sampleLine='{"first_name":"Jane","last_name":"Doe","gender":"Female","program_code":"PROGRAM_RECORD_ID","admission_date":"2025-01-01","status":"Active","email":"j@bmi.edu","phone":"+254700000000"}'
        onSubmit={async (lines) => {
          try {
            const items = lines.map((l) => JSON.parse(l) as Record<string, unknown>);
            const r = await postStudentBatch(items);
            const list = await getStudents({ perPage: 1000 });
            if (list.success && list.data) setStudents(list.data);
            return {
              ok: (r.data?.failureCount ?? 0) === 0,
              message: `Created: ${r.data?.successCount ?? 0}, failed: ${r.data?.failureCount ?? 0}.`,
            };
          } catch {
            return { ok: false, message: 'Invalid JSON on one or more lines.' };
          }
        }}
      />
    </div>
  );
};

export default Students;
