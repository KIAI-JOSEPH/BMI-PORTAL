
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Printer, 
  Download, 
  FileText, 
  BookOpen, 
  X, 
  ChevronRight, 
  ShieldCheck, 
  MessageCircle, 
  Scroll,
  CheckCircle
} from 'lucide-react';
import { Student, Course } from '../types';

interface TranscriptsProps {
  students: Student[];
  courses: Course[];
  logo: string;
}

interface PerformanceRecord {
  courseCode: string;
  courseName: string;
  credits: number;
  score: number;
  grade: string;
  points: number;
  term: string;
}

export const Transcripts: React.FC<TranscriptsProps> = ({ students, courses, logo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('All Faculty');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptType, setTranscriptType] = useState<'Official' | 'Provisional'>('Official');
  const [selectedTerm, setSelectedTerm] = useState('Fall 2023');

  const faculties = ['All Faculty', 'Theology', 'ICT', 'Business', 'Education'];
  const terms = ['Fall 2022', 'Spring 2023', 'Fall 2023', 'Spring 2024'];

  const getDeanName = (faculty: string) => {
    const deans: Record<string, string> = {
      'Theology': 'Dr. Samuel Kiptoo',
      'ICT': 'Prof. Alice Mwangi',
      'Business': 'Dr. Jane Okumu',
      'Education': 'Prof. Peter Kamau'
    };
    return deans[faculty] || 'Dean of Faculty';
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = `${s.firstName} ${s.lastName} ${s.id}`.toLowerCase().includes(q);
      const matchesFaculty = facultyFilter === 'All Faculty' || s.faculty === facultyFilter;
      return matchesSearch && matchesFaculty;
    });
  }, [students, searchTerm, facultyFilter]);

  const getPerformanceRecords = (student: Student): PerformanceRecord[] => {
    const facultyCourses = courses.filter(c => c.faculty === student.faculty || c.faculty === 'General');
    const selected = facultyCourses.slice(0, 15);
    
    return selected.map((c, idx) => {
      const seed = (student.id.length + c.code.length + student.firstName.length + idx) % 30;
      const score = 85 + (seed % 15) - (idx % 2 === 0 && student.id.includes('7') ? 50 : 0); 
      let grade = 'F';
      let points = 0;
      
      if (score >= 70) { grade = 'A'; points = 4.0; }
      else if (score >= 60) { grade = 'B'; points = 3.0; }
      else if (score >= 50) { grade = 'C'; points = 2.0; }
      else if (score >= 40) { grade = 'D'; points = 1.0; }
      
      const termIdx = Math.floor(idx / 4);
      const term = terms[termIdx % terms.length];

      return {
        courseCode: c.code,
        courseName: c.name,
        credits: c.credits * 15,
        score,
        grade,
        points,
        term: term
      };
    });
  };

  const allRecords = useMemo(() => selectedStudent ? getPerformanceRecords(selectedStudent) : [], [selectedStudent]);
  
  const currentRecords = useMemo(() => {
    if (transcriptType === 'Official') return allRecords;
    return allRecords.filter(r => r.term === selectedTerm);
  }, [allRecords, transcriptType, selectedTerm]);

  const stats = useMemo(() => {
    const calculateAvg = (recs: PerformanceRecord[]) => {
      if (recs.length === 0) return "0.00";
      const sum = recs.reduce((acc, curr) => acc + curr.score, 0);
      return (sum / recs.length).toFixed(2);
    };
    return {
      current: calculateAvg(currentRecords),
      cumulative: calculateAvg(allRecords)
    };
  }, [currentRecords, allRecords]);

  const getAcademicRecommendation = () => {
    if (!selectedStudent || currentRecords.length === 0) return "";
    
    const hasRetakes = currentRecords.some(r => r.score < 40);
    const failedModules = currentRecords.filter(r => r.score < 40).map(r => r.courseCode);

    if (transcriptType === 'Official') {
      if (hasRetakes) {
        return `DEGREE AWARD PENDING SATISFACTORY COMPLETION OF SUPPLEMENTARY EXAMINATIONS FOR FAILED MODULES (${failedModules.join(', ')}).`;
      }
      
      const avg = parseFloat(stats.cumulative);
      let honors = "PASS";
      if (avg >= 70) honors = "FIRST CLASS HONOURS";
      else if (avg >= 60) honors = "SECOND CLASS HONOURS, UPPER DIVISION";
      else if (avg >= 50) honors = "SECOND CLASS HONOURS, LOWER DIVISION";
      
      const isDegree = ['Degree', 'Masters', 'PhD'].includes(selectedStudent.academicLevel);
      const awardPrefix = isDegree ? "AWARDED THE DEGREE OF" : "AWARDED THE";
      
      return `HAVING SATISFIED THE BOARD OF EXAMINERS AND THE UNIVERSITY SENATE, IS HEREBY ${awardPrefix} ${selectedStudent.careerPath.toUpperCase()} WITH ${honors}.`;
    } else {
      if (hasRetakes) {
        return `REQUIRED TO SIT FOR SUPPLEMENTARY EXAMINATIONS IN THE FAILED MODULES (${failedModules.join(', ')}) BEFORE PROCEEDING TO THE NEXT ACADEMIC LEVEL.`;
      }
      return `THE STUDENT HAS SATISFACTORILY COMPLETED THE ACADEMIC REQUIREMENTS FOR ${selectedTerm.toUpperCase()} AND IS RECOMMENDED TO PROCEED TO THE NEXT SEMESTER / YEAR OF STUDY.`;
    }
  };

  const handlePrint = async (mode: 'print' | 'download' = 'print') => {
    if (!selectedStudent) return;
    const element = document.getElementById('official-transcript-root');
    if (!element) return;
    const fileName = `${transcriptType}_TRANSCRIPT_${selectedStudent.id}_${selectedStudent.lastName}`.toUpperCase();
    
    if (mode === 'download') {
      try {
        const html2pdfModule = await import('https://esm.sh/html2pdf.js@0.10.1?bundle');
        const html2pdf = html2pdfModule.default;
        if (typeof html2pdf !== 'function') throw new Error("html2pdf is not a function");
        const opt = {
          margin: 0,
          filename: `${fileName}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        await html2pdf().set(opt).from(element).save();
      } catch (err) {
        console.error("PDF download failed", err);
        window.print();
      }
    } else {
      const originalTitle = document.title;
      document.title = fileName;
      window.print();
      setTimeout(() => { document.title = originalTitle; }, 1000);
    }
  };

  const handleShare = async (platform?: 'whatsapp') => {
    if (!selectedStudent) return;
    const element = document.getElementById('official-transcript-root');
    if (!element) return;
    if (platform === 'whatsapp') {
       try {
          const html2pdfModule = await import('https://esm.sh/html2pdf.js@0.10.1?bundle');
          const html2pdf = html2pdfModule.default;
          const pdfBlob = await html2pdf().from(element).set({
            margin: 0,
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          }).output('blob');
          const file = new File([pdfBlob], `TRANSCRIPT_${selectedStudent.id}.pdf`, { type: 'application/pdf' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
             await navigator.share({
                files: [file],
                title: `${transcriptType} Academic Transcript`,
                text: `${transcriptType} transcript for ${selectedStudent.firstName} ${selectedStudent.lastName} (${selectedStudent.id})`
             });
          } else {
             const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(transcriptType + " Academic Transcript for " + selectedStudent.firstName + " " + selectedStudent.lastName + " (" + selectedStudent.id + ")")}`;
             window.open(waUrl, '_blank');
          }
       } catch (err) {
          const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent("Academic Transcript Link: " + window.location.href)}`;
          window.open(waUrl, '_blank');
       }
       return;
    }
    handlePrint('print');
  };

  const MicroText = ({ text }: { text: string }) => (
    <div className="overflow-hidden whitespace-nowrap text-[2.5px] md:text-[3px] leading-none text-gray-400 select-none uppercase tracking-tighter opacity-60 h-1 flex items-center bg-gradient-to-r from-purple-50/50 via-gray-50/50 to-purple-50/50 border-y border-gray-100/50">
      {Array.from({ length: 15 }).map((_, i) => <span key={i} className="mr-4">{text}</span>)}
    </div>
  );

  return (
    <div className="h-full flex flex-col animate-fade-in relative">
      {/* Sticky Header */}
      <div className="flex-shrink-0 sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex flex-col md:flex-row justify-between items-center gap-2 shadow-sm min-h-[60px]">
        <div className="flex items-center gap-3 pl-14 w-full md:w-auto">
           <div className="w-1 h-5 bg-[#FFD700] rounded-none"></div>
           <div className="flex flex-col">
              <h2 className="text-base md:text-lg font-bold text-[#2E004F] dark:text-white tracking-tight uppercase leading-none">Academic Records & Transcripts</h2>
              <p className="text-[8px] md:text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">BMI Institutional Registrar • Automated Grade Aggregation Node</p>
           </div>
        </div>
      </div>

      {/* Sticky Top Tab Bar */}
      <div className="sticky top-[60px] z-30 bg-[#F8F9FA]/95 dark:bg-[#0a0015]/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar shadow-sm">
         <div className="flex items-center gap-2 mr-4 text-gray-400">
            <Scroll size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Document Type</span>
         </div>
         {['Official', 'Provisional'].map((type) => (
            <button
              key={type}
              onClick={() => setTranscriptType(type as any)}
              className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                transcriptType === type 
                  ? 'bg-[#4B0082] text-white shadow-lg shadow-purple-500/20 scale-105 border border-purple-500/50' 
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-[#4B0082]'
              }`}
            >
              {type}
            </button>
         ))}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-white dark:bg-gray-800 p-8 rounded-none border border-gray-100 dark:border-gray-700 space-y-6 shadow-sm">
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <input 
                     type="text" 
                     placeholder="Search Registry..." 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-none text-xs font-bold uppercase tracking-tight outline-none focus:ring-1 focus:ring-[#4B0082]"
                   />
                </div>
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Target Faculty</label>
                      <select 
                        value={facultyFilter}
                        onChange={e => setFacultyFilter(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-none text-[10px] font-black uppercase outline-none focus:ring-1 focus:ring-[#4B0082] cursor-pointer dark:text-gray-200"
                      >
                         {faculties.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                   </div>
                </div>
                <div className="pt-6 border-t border-gray-50 dark:border-gray-700">
                   <div className="max-h-[400px] overflow-y-auto no-scrollbar space-y-1">
                      {filteredStudents.map(student => (
                        <button 
                          key={student.id}
                          onClick={() => { setSelectedStudent(student); setShowTranscript(false); }}
                          className={`w-full text-left p-3 rounded-none transition-all flex items-center justify-between group ${selectedStudent?.id === student.id ? 'bg-[#4B0082] text-white shadow-lg' : 'hover:bg-purple-50 dark:hover:bg-gray-700'}`}
                        >
                           <div>
                              <p className="text-[11px] font-black uppercase tracking-tight leading-none">{student.firstName} {student.lastName}</p>
                              <p className={`text-[9px] font-bold uppercase mt-1 ${selectedStudent?.id === student.id ? 'text-purple-200' : 'text-gray-400'}`}>{student.id}</p>
                           </div>
                           <ChevronRight size={14} className={selectedStudent?.id === student.id ? 'text-[#FFD700]' : 'text-gray-300'} />
                        </button>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          <div className="lg:col-span-3">
             {selectedStudent ? (
               <div className="space-y-6 animate-slide-up">
                  <div className="bg-white dark:bg-gray-800 rounded-none shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                     <div className="absolute top-0 left-0 w-2 h-full bg-[#4B0082]"></div>
                     <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-8">
                           <div className={`w-28 h-28 rounded-none ${selectedStudent.avatarColor} border-2 border-[#FFD700] p-1 shadow-2xl overflow-hidden`}>
                              {selectedStudent.photo ? <img src={selectedStudent.photo} className="w-full h-full object-cover" style={{ transform: `scale(${selectedStudent.photoZoom})` }} /> : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white">{selectedStudent.firstName[0]}</div>}
                           </div>
                           <div>
                              <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                              <p className="text-xs font-bold text-[#4B0082] dark:text-[#FFD700] uppercase tracking-widest mt-3">{selectedStudent.careerPath} • {selectedStudent.id}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => setShowTranscript(true)}
                          className="px-10 py-4 bg-[#FFD700] text-[#4B0082] rounded-none font-black text-xs uppercase tracking-widest shadow-xl hover:bg-white transition-all flex items-center gap-3"
                        >
                           <FileText size={18} /> Official Transcript View
                        </button>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-none shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                     <div className="p-6 bg-gray-900 text-white flex justify-between items-center border-b border-gray-800">
                        <div className="flex items-center gap-3">
                           <BookOpen size={18} className="text-[#FFD700]" />
                           <h3 className="font-black text-xs uppercase tracking-[0.25em]">Live Academic Performance Node</h3>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                           <ShieldCheck size={14} className="text-emerald-500" /> SYSTEM VERIFIED RECORDS
                        </div>
                     </div>
                     <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="bg-gray-50 dark:bg-gray-700/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">
                                 <th className="px-6 py-4">Module Identifier</th>
                                 <th className="px-6 py-4">Specification</th>
                                 <th className="px-6 py-4 text-center">Score (%)</th>
                                 <th className="px-6 py-4 text-center">Grade</th>
                                 <th className="px-6 py-4 text-center">Term</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                              {currentRecords.map((rec, i) => (
                                <tr key={i} className="hover:bg-purple-50/20 dark:hover:bg-gray-700/20 transition-all group">
                                   <td className="px-6 py-4 font-mono text-xs font-bold text-[#4B0082] dark:text-purple-300">{rec.courseCode}</td>
                                   <td className="px-6 py-4 text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">{rec.courseName}</td>
                                   <td className="px-6 py-4 text-center text-sm font-black text-gray-900 dark:text-white">{rec.score}%</td>
                                   <td className="px-6 py-4 text-center">
                                      <span className={`text-xl font-black ${rec.score >= 70 ? 'text-emerald-600' : rec.score < 40 ? 'text-red-600' : 'text-[#4B0082] dark:text-[#FFD700]'}`}>{rec.grade}</span>
                                   </td>
                                   <td className="px-6 py-4 text-center text-[10px] font-black uppercase text-gray-500">{rec.term}</td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-none border-2 border-dashed border-gray-100 dark:border-gray-700 text-gray-400">
                  <FileText size={80} className="mb-6 opacity-20" />
                  <h3 className="text-xl font-black uppercase tracking-[0.3em] opacity-40">Awaiting Record Selection</h3>
               </div>
             )}
          </div>
        </div>

        {showTranscript && selectedStudent && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 md:p-8 overflow-y-auto">
           <div className="w-full max-w-[210mm] flex flex-col items-center">
              <div id="official-transcript-root" className="bg-white w-full shadow-2xl relative flex flex-col overflow-hidden animate-slide-up font-serif p-6 text-gray-950 print:m-0 print:shadow-none border-[6px] border-gray-100 border-double">
                 
                 <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-[0.08]">
                      <defs>
                        <linearGradient id="securityPastel" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fdf2f8" />
                          <stop offset="25%" stopColor="#f0f9ff" />
                          <stop offset="50%" stopColor="#f0fdf4" />
                          <stop offset="75%" stopColor="#fffbeb" />
                          <stop offset="100%" stopColor="#faf5ff" />
                        </linearGradient>
                        <pattern id="blendedSecurityPattern" x="0" y="0" width="300" height="300" patternUnits="userSpaceOnUse">
                           <path d="M0,150 Q75,50 150,150 T300,150" fill="none" stroke="#4B0082" strokeWidth="0.4" opacity="0.4" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#securityPastel)" />
                      <rect width="100%" height="100%" fill="url(#blendedSecurityPattern)" />
                    </svg>
                 </div>

                 <MicroText text="BMI UNIVERSITY OFFICIAL ACADEMIC TRANSCRIPT • SECURITY VALIDATED RECORD • DO NOT REPRODUCE • UV PROTECTED INK • ANTI-FORGERY" />

                 <div className="absolute top-8 right-8 flex flex-col items-center gap-1 group z-20">
                    <div className="p-1 bg-white border border-gray-900 shadow-sm relative">
                       <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&ecc=H&margin=1&data=${encodeURIComponent(`BMI UNIVERSITY - OFFICIAL ACADEMIC RECORD\nSTUDENT: ${selectedStudent.firstName} ${selectedStudent.lastName}\nID: ${selectedStudent.id}\nSERIAL: BMI-TR-${selectedStudent.id.split('-').pop()}\nSTATUS: VERIFIED`)}`}
                          className="w-16 h-16"
                          alt="Security QR"
                       />
                    </div>
                    <span className="text-[6px] font-mono tracking-widest uppercase font-black text-red-600 select-none">
                       SN: {selectedStudent.id.split('-').pop()}-{Date.now().toString().slice(-4)}
                    </span>
                 </div>

                 <div className="flex flex-col items-center border-b-2 border-gray-900 pb-3 mb-4 relative z-10">
                    <img 
                      src={logo || "https://i.ibb.co/Gv2vPdJC/BMI-PNG.png"} 
                      className="h-16 mb-2 object-contain filter contrast-125" 
                      alt="BMI Logo"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://i.ibb.co/Gv2vPdJC/BMI-PNG.png" }}
                    />
                    <h1 className="text-2xl font-serif font-black tracking-tight text-gray-900 uppercase">BMI UNIVERSITY</h1>
                    <p className="text-[9px] font-sans font-black text-gray-600 uppercase tracking-[0.4em]">OFFICE OF THE INSTITUTIONAL REGISTRAR</p>
                    <div className="mt-2 px-8 py-1 border-y border-gray-900 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/80">
                      <h2 className="text-sm font-serif font-black uppercase tracking-[0.3em]">
                        {transcriptType} Academic Transcript
                        {transcriptType === 'Provisional' && <span className="ml-3 bg-red-600 px-2 py-0.5 text-[10px] text-white">| PERIOD: {selectedTerm.toUpperCase()}</span>}
                      </h2>
                    </div>
                 </div>
                 
                 <div className="mb-4 px-4 relative z-10">
                    <div className="flex items-baseline gap-4 border-b border-gray-300 pb-1">
                       <span className="text-[9px] font-sans font-black text-gray-400 uppercase tracking-[0.2em]">Student Name:</span>
                       <span className="text-lg font-serif font-black text-gray-900 uppercase tracking-tight">{selectedStudent.firstName} {selectedStudent.lastName}</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-x-12 gap-y-1.5 mb-4 text-[11px] font-bold relative z-10 px-4">
                    <div className="flex justify-between border-b border-gray-100 pb-0.5"><span className="text-gray-500 font-sans text-[8px] uppercase">Year of study:</span><span>4 (FOUR)</span></div>
                    <div className="flex justify-between border-b border-gray-100 pb-0.5"><span className="text-gray-500 font-sans text-[8px] uppercase">Prog. of Study:</span><span className="uppercase text-gray-900 whitespace-nowrap">{selectedStudent.careerPath}</span></div>
                    <div className="flex justify-between border-b border-gray-100 pb-0.5"><span className="text-gray-500 font-sans text-[8px] uppercase">FACULTY OF:</span><span className="uppercase text-gray-900 font-black">{selectedStudent.faculty}</span></div>
                    <div className="flex justify-between border-b border-gray-100 pb-0.5"><span className="text-gray-500 font-sans text-[8px] uppercase">Student ID:</span><span className="font-mono text-red-700">{selectedStudent.id}</span></div>
                    <div className="flex justify-between border-b border-gray-100 pb-0.5"><span className="text-gray-500 font-sans text-[8px] uppercase">Admission:</span><span>27/08/2022</span></div>
                    <div className="flex justify-between border-b border-gray-100 pb-0.5"><span className="text-gray-500 font-sans text-[8px] uppercase">Graduation:</span><span>21/12/2026</span></div>
                 </div>

                 <div className="border border-gray-900 mb-3 relative z-10 shadow-sm overflow-hidden">
                   <table className="w-full text-left text-[10px] border-collapse">
                      <thead>
                         <tr className="border-b border-gray-900 font-black uppercase bg-gray-50">
                            <th className="py-1.5 px-3 border-r border-gray-900 w-28">Course Code</th>
                            <th className="py-1.5 px-3 border-r border-gray-900">Course Description</th>
                            <th className="py-1.5 px-3 border-r border-gray-900 w-24 text-center">Hours</th>
                            <th className="py-1.5 px-3 w-16 text-center">Grade</th>
                         </tr>
                      </thead>
                      <tbody className="bg-white/80">
                         {currentRecords.map((rec, i) => (
                           <tr key={i} className="border-b border-gray-200 hover:bg-purple-50/20 transition-colors">
                              <td className="py-1 px-3 border-r border-gray-900 font-mono font-bold text-gray-700">{rec.courseCode}</td>
                              <td className="py-1 px-3 border-r border-gray-900 uppercase font-bold text-gray-800">{rec.courseName}</td>
                              <td className="py-1 px-3 border-r border-gray-900 text-center font-bold">{(rec.credits).toFixed(2)}</td>
                              <td className="py-1 px-3 text-center font-black text-gray-900">{rec.grade}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                 </div>

                 <div className="border-b border-gray-900 py-2 text-[11px] font-black relative z-10 px-4 bg-gray-50/20">
                    <div className="flex gap-8">
                       <span className="text-gray-600 font-sans text-[9px]">PERFORMANCE METRICS:</span>
                       <span>Current Avg: <span className="text-[#4B0082]">{stats.current}%</span></span>
                       <span>| Cumulative Avg: <span className="text-[#4B0082]">{stats.cumulative}%</span></span>
                    </div>
                 </div>

                 <div className="py-3 text-[11px] font-bold border-b border-gray-900 mb-4 relative z-10 px-4">
                    <div className="flex gap-4">
                       <span className="flex-shrink-0 text-[9px] font-black uppercase text-gray-400 tracking-widest">Recommendation:</span>
                       <p className="uppercase leading-tight text-gray-950 font-black tracking-tight border-l-2 border-[#4B0082] pl-3">{getAcademicRecommendation()}</p>
                    </div>
                 </div>

                 <div className="border border-gray-400 p-3 text-[8px] font-black relative z-10 bg-gray-50/30 mb-4">
                    <p className="underline mb-1 uppercase text-gray-600">Grading Specification</p>
                    <div className="grid grid-cols-5 gap-2 opacity-80">
                       <div className="flex justify-between"><span>A (70-100%)</span></div>
                       <div className="flex justify-between"><span>B (60-69%)</span></div>
                       <div className="flex justify-between"><span>C (50-59%)</span></div>
                       <div className="flex justify-between"><span>D (40-49%)</span></div>
                       <div className="flex justify-between text-red-600"><span>F ({"<"}40%)</span></div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-8 mt-2 relative z-10 mb-4">
                    <div className="flex flex-col items-center">
                       <div className="w-full border-b border-gray-900 pb-0.5 relative text-center flex flex-col items-center">
                          <span className="font-serif italic text-lg text-gray-800 whitespace-nowrap">{getDeanName(selectedStudent.faculty)}</span>
                       </div>
                       <span className="text-[8px] font-black uppercase tracking-widest mt-1 text-gray-500">Dean of Faculty</span>
                    </div>
                    <div className="flex flex-col items-center">
                       <div className="w-full border-b border-gray-900 pb-0.5 relative text-center flex flex-col items-center">
                          <span className="font-serif italic text-lg text-gray-800 whitespace-nowrap">Prof. Isaac Sigei</span>
                       </div>
                       <span className="text-[8px] font-black uppercase tracking-widest mt-1 text-gray-500">Institutional Registrar</span>
                    </div>
                 </div>

                 <MicroText text="DO NOT REPRODUCE THIS DOCUMENT • BMI UNIVERSITY ACADEMIC RECORD SECURE VALIDATION LINE • TAMPER-EVIDENT DESIGN • IDW-BMIV-82" />

                 <div className="mt-3 flex justify-between items-baseline px-2 relative z-10">
                    <div className="flex items-center gap-4 text-[8px] text-gray-500 font-black uppercase tracking-widest">
                       <span>Issued: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                       <span>ID: BMI-TR-{selectedStudent.id.split('-').pop()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={12} className="text-[#4B0082]" />
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Verified Archive</span>
                    </div>
                 </div>
              </div>

              <div className="w-full mt-6 flex flex-wrap gap-4 items-center justify-between no-print p-6 bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4B0082] via-[#FFD700] to-[#4B0082]"></div>
                 <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex bg-gray-800 p-1 border border-white/10 rounded-none mr-2">
                       <button 
                         onClick={() => setTranscriptType('Official')}
                         className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${transcriptType === 'Official' ? 'bg-[#FFD700] text-[#4B0082]' : 'text-gray-400 hover:text-white'}`}
                       >Complete Registry</button>
                       <button 
                         onClick={() => setTranscriptType('Provisional')}
                         className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${transcriptType === 'Provisional' ? 'bg-[#FFD700] text-[#4B0082]' : 'text-gray-400 hover:text-white'}`}
                       >Term Provisional</button>
                    </div>
                    <button onClick={() => handlePrint('print')} className="flex items-center gap-2 px-8 py-3.5 bg-[#4B0082] text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg border border-white/10"><Printer size={18} /> Print Record</button>
                    <button onClick={() => handlePrint('download')} className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg border border-white/10"><Download size={18} /> PDF Archive</button>
                    <button onClick={() => handleShare('whatsapp')} className="flex items-center gap-2 px-8 py-3.5 bg-[#25D366] text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg border border-white/10"><MessageCircle size={18} /> Send Data</button>
                 </div>
                 <button onClick={() => setShowTranscript(false)} className="p-4 bg-red-600 text-white hover:bg-red-700 transition-all shadow-xl group">
                    <X size={24} className="group-hover:rotate-90 transition-transform" />
                 </button>
              </div>
           </div>
           </div>
        </div>
        )}

        <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; visibility: hidden; }
          #official-transcript-root { 
            visibility: visible !important; 
            display: block !important; 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 210mm !important; 
            height: 297mm !important; 
            margin: 0 !important; 
            padding: 8mm !important; 
            box-shadow: none !important; 
            border: none !important; 
            z-index: 9999 !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            page-break-after: always;
          }
          #official-transcript-root * { visibility: visible !important; }
          @page { size: A4; margin: 0; }
        }
        
        #official-transcript-root {
          user-select: none;
          -webkit-user-select: none;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};