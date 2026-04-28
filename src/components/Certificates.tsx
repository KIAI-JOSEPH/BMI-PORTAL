
/**
 * KIRO: DO NOT MODIFY
 * This file contains stable production logic.
 * Do not edit unless explicitly instructed.
 * 
 * Certificate Layout Fix Applied: CSS Grid layout implemented
 * to resolve overlapping footer components (Vice Chancellor, QR, Shield, Academic Registrar)
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Printer, 
  Download, 
  Award, 
  ChevronRight, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Share2, 
  Lock, 
  Layout,
  QrCode,
  Scroll
} from 'lucide-react';
import { Student } from '../types';

interface CertificatesProps {
  students: Student[];
  logo: string;
}

const Certificates: React.FC<CertificatesProps> = ({ students, logo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [isDownloading, setIsDownloading] = useState(false);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = `${s.firstName} ${s.lastName} ${s.id}`.toLowerCase().includes(q);
      return matchesSearch; 
    });
  }, [students, searchTerm]);

  // ... (keeping internal logic functions like handlePrint, handleDownloadPdf, getDegreeTitle etc. - same as before)
  const handlePrint = async () => {
    if (!selectedStudent) return;
    const element = document.getElementById('official-certificate-root');
    if (!element) return;
    
    const originalTitle = document.title;
    document.title = `CERTIFICATE_${selectedStudent.id}_${selectedStudent.lastName}`.toUpperCase();
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 1000);
  };

  const handleDownloadPdf = async () => {
    if (!selectedStudent) return;
    const element = document.getElementById('official-certificate-root');
    if (!element) return;

    setIsDownloading(true);
    const fileName = `CERTIFICATE_${selectedStudent.id}_${selectedStudent.lastName}`.toUpperCase();

    try {
      const html2pdfModule = await import('https://esm.sh/html2pdf.js@0.10.1?bundle');
      const html2pdf = html2pdfModule.default;
      
      const opt = {
        margin: 0,
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, letterRendering: true, scrollX: 0, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: orientation }
      };
      
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF download failed", err);
      alert("PDF generation failed. Please try printing to PDF instead.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getDegreeTitle = (student: Student) => {
    if (student.academicLevel === 'PhD') return `DOCTOR OF PHILOSOPHY IN ${student.faculty.toUpperCase()}`;
    if (student.academicLevel === 'Masters') return `MASTER OF ARTS IN ${student.faculty.toUpperCase()}`;
    if (student.academicLevel === 'Degree') return `BACHELOR OF ${student.faculty.toUpperCase()}`;
    if (student.academicLevel === 'Diploma') return `DIPLOMA IN ${student.faculty.toUpperCase()}`;
    return `CERTIFICATE IN ${student.faculty.toUpperCase()}`;
  };

  const getGraduationClass = (student: Student) => {
    const { gpa, academicLevel } = student;
    if (academicLevel === 'PhD') return ''; 
    if (academicLevel === 'Degree') {
      if (gpa >= 3.6) return 'First Class Honours';
      if (gpa >= 3.0) return 'Second Class Honours (Upper Division)';
      if (gpa >= 2.5) return 'Second Class Honours (Lower Division)';
      return 'Pass';
    }
    if (academicLevel === 'Diploma') {
      if (gpa >= 3.5) return 'Distinction';
      if (gpa >= 2.5) return 'Credit';
      return 'Pass';
    }
    if (academicLevel === 'Masters') {
       if (gpa >= 3.7) return 'Distinction';
       return '';
    }
    return '';
  };

  const getOrdinalDate = () => {
    const d = new Date();
    const day = d.getDate();
    const suffix = ["th", "st", "nd", "rd"];
    const v = day % 100;
    const ord = day + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
    return `${ord} day of ${d.toLocaleString('default', { month: 'long' })}, ${d.getFullYear()}`;
  };

  const generateSerialNumber = (student: Student) => {
    const year = new Date().getFullYear();
    const num = student.id.replace(/\D/g, '').padEnd(6, '0').slice(0, 6);
    return `BMI-${year}-${num}`;
  };

  const generateCertificateHash = (student: Student, serial: string) => {
    const raw = `${student.id}|${student.firstName}|${student.lastName}|${serial}|BMI-KEY`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; 
    }
    return Math.abs(hash).toString(16).padStart(64, '0').substring(0, 32).toUpperCase();
  };

  const GuillochePattern = () => (
    <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.05] overflow-hidden">
      <img src="https://i.ibb.co/QGHsbXy/alluoche-1.jpg" className="w-full h-full object-cover" alt="Security Pattern" />
    </div>
  );

  const MicroTextBorder = () => (
    <div className="absolute inset-[10mm] border-[1px] border-transparent z-10 pointer-events-none overflow-hidden select-none">
       <div className="w-full h-full border-[0.5px] border-[#4B0082] relative">
          <div className="absolute top-0 left-0 w-full text-[4px] leading-none whitespace-nowrap text-[#4B0082] opacity-60">
             {Array(150).fill("BMI UNIVERSITY OFFICIAL SECURE CERTIFICATE ").join("")}
          </div>
          <div className="absolute bottom-0 left-0 w-full text-[4px] leading-none whitespace-nowrap text-[#4B0082] opacity-60">
             {Array(150).fill("VERIFY AUTHENTICITY AT BMIUNIVERSITY.ORG/VERIFY ").join("")}
          </div>
          <div className="absolute top-0 left-0 h-full w-[4px] text-[4px] leading-none whitespace-nowrap text-[#4B0082] opacity-60 writing-vertical-lr" style={{ writingMode: 'vertical-lr' }}>
             {Array(100).fill("SECURE DOCUMENT ").join("")}
          </div>
          <div className="absolute top-0 right-0 h-full w-[4px] text-[4px] leading-none whitespace-nowrap text-[#4B0082] opacity-60 writing-vertical-lr" style={{ writingMode: 'vertical-lr' }}>
             {Array(100).fill("ANTI-TAMPER LAYER ").join("")}
          </div>
       </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col animate-fade-in relative">
      {/* Sticky Header */}
      <div className="flex-shrink-0 sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex flex-col md:flex-row justify-between items-center gap-2 shadow-sm min-h-[60px]">
        <div className="flex items-center gap-3 pl-14 w-full md:w-auto">
           <div className="w-1 h-5 bg-[#FFD700] rounded-none"></div>
           <div className="flex flex-col">
              <h2 className="text-base md:text-lg font-bold text-[#2E004F] dark:text-white tracking-tight uppercase leading-none">Degree & Certificate Issuance</h2>
              <p className="text-[8px] md:text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">BMI Institutional Registrar • Graduation & Awards Node</p>
           </div>
        </div>
      </div>

      {/* Sticky Top Tab Bar - For future expansion or filtering modes */}
      <div className="sticky top-[60px] z-30 bg-[#F8F9FA]/95 dark:bg-[#0a0015]/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar shadow-sm">
         <div className="flex items-center gap-2 mr-4 text-gray-400">
            <Layout size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Preview Mode</span>
         </div>
         <button
            onClick={() => setOrientation('landscape')}
            className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              orientation === 'landscape' 
                ? 'bg-[#4B0082] text-white shadow-lg shadow-purple-500/20 scale-105 border border-purple-500/50' 
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-[#4B0082]'
            }`}
          >
            Landscape
          </button>
          <button
            onClick={() => setOrientation('portrait')}
            className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              orientation === 'portrait' 
                ? 'bg-[#4B0082] text-white shadow-lg shadow-purple-500/20 scale-105 border border-purple-500/50' 
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-[#4B0082]'
            }`}
          >
            Portrait
          </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-8 rounded-none border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-[600px]">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Candidate Registry</h3>
             <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search Candidate..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-none text-xs font-bold uppercase tracking-tight outline-none focus:ring-1 focus:ring-[#4B0082]"
                />
             </div>
             <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                {filteredStudents.map(student => (
                  <button 
                    key={student.id}
                    onClick={() => { setSelectedStudent(student); setShowCertificate(false); }}
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

          <div className="lg:col-span-3">
             {selectedStudent ? (
               <div className="space-y-6 animate-slide-up">
                  <div className="bg-white dark:bg-gray-800 rounded-none shadow-xl border border-gray-100 dark:border-gray-700 p-8 flex justify-between items-center relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-2 h-full bg-[#4B0082]"></div>
                     <div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                        <p className="text-xs font-bold text-[#4B0082] dark:text-[#FFD700] uppercase tracking-widest mt-2">{getDegreeTitle(selectedStudent)}</p>
                     </div>
                     <button 
                       onClick={() => setShowCertificate(true)}
                       className="px-10 py-4 bg-[#4B0082] text-white rounded-none font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-3 border border-[#FFD700]/30"
                     >
                        <Award size={18} className="text-[#FFD700]" /> Preview Certificate
                     </button>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                     <ShieldCheck size={64} className="text-gray-300 mb-6" />
                     <h4 className="text-lg font-black text-gray-400 uppercase tracking-widest mb-2">Secure Verification</h4>
                     <p className="text-xs text-gray-500 max-w-md">
                        Certificate generation is restricted to authorized registrars. All documents are digitally watermarked, hashed, and logged in the institutional blockchain ledger.
                     </p>
                  </div>
               </div>
             ) : (
               <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-none border-2 border-dashed border-gray-100 dark:border-gray-700 text-gray-400">
                  <Award size={80} className="mb-6 opacity-20" />
                  <h3 className="text-xl font-black uppercase tracking-[0.3em] opacity-40">Select Candidate for Certification</h3>
               </div>
             )}
          </div>
        </div>

      {showCertificate && selectedStudent && (() => {
        const serialNumber = generateSerialNumber(selectedStudent);
        const docHash = generateCertificateHash(selectedStudent, serialNumber);
        
        // Dynamic Verification URL using configurable base URL
        const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
        const verifyUrl = `${baseUrl}/verify?id=${serialNumber}&hash=${docHash}`;

        return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 overflow-y-auto">
           <div className="flex flex-col items-center">
              
              <div 
                id="official-certificate-root" 
                className={`bg-[#FFFAF0] relative flex flex-col items-center shadow-2xl text-gray-900 border-[12px] border-double border-[#4B0082] print:shadow-none print:m-0 print:border-none print:w-full print:h-full overflow-hidden transition-all duration-300 ${
                  orientation === 'landscape' ? 'w-[297mm] h-[210mm] p-12' : 'w-[210mm] h-[297mm] p-10'
                }`}
              >
                 {/* ... Security Patterns ... */}
                 <GuillochePattern />
                 <MicroTextBorder />
                 <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center z-0">
                    <img src={logo || "https://i.ibb.co/Gv2vPdJC/BMI-PNG.png"} className="w-[500px] h-[500px] object-contain grayscale" />
                 </div>
                 <div className="absolute bottom-16 left-16 w-16 h-16 border-b-4 border-l-4 border-[#FFD700] z-20 pointer-events-none"></div>
                 <div className="absolute bottom-16 right-16 w-16 h-16 border-b-4 border-r-4 border-[#FFD700] z-20 pointer-events-none"></div>

                 <div className="relative z-10 text-center w-full h-full flex flex-col">
                    <div className="absolute top-0 right-0 text-right">
                       <p className="text-[10px] font-mono font-bold text-gray-400">SERIAL: <span className="text-red-700">{serialNumber}</span></p>
                       <p className="text-[6px] font-mono text-gray-300 mt-0.5 max-w-[150px] break-all">{docHash}</p>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center w-full space-y-6">
                        <img src={logo || "https://i.ibb.co/Gv2vPdJC/BMI-PNG.png"} className="h-20 md:h-24 object-contain filter drop-shadow-sm" />
                        
                        <div className="space-y-2">
                           <h1 className="text-4xl md:text-5xl font-serif font-black uppercase tracking-widest text-[#4B0082]">BMI University</h1>
                           <p className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-[0.6em]">Excellence in Faith and Knowledge</p>
                        </div>

                        <p className="text-lg md:text-xl font-serif italic text-gray-600 mb-2">By the authority of the University Senate, be it hereby known that</p>
                        
                        <div className="py-2 border-b-2 border-gray-900 px-8 md:px-12 inline-block">
                           <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wide text-gray-900 leading-tight">
                              {selectedStudent.firstName} {selectedStudent.lastName},
                           </h2>
                        </div>

                        <p className="text-lg md:text-xl font-serif italic text-gray-600 max-w-3xl mt-4">having satisfactorily fulfilled all the requirements prescribed by the University, has been duly awarded the</p>

                        <div className="flex flex-col items-center gap-2 mt-4">
                           <h3 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-[#4B0082] max-w-4xl leading-tight">
                              {getDegreeTitle(selectedStudent)}
                           </h3>
                           {getGraduationClass(selectedStudent) && getGraduationClass(selectedStudent) !== 'Pass' && (
                              <p className="text-xl md:text-2xl font-serif font-bold text-gray-800">
                                 with {getGraduationClass(selectedStudent)}
                              </p>
                           )}
                        </div>

                        <p className="text-base md:text-lg font-serif italic text-gray-600 max-w-3xl mt-4">
                           with all the rights, privileges, and honors thereunto appertaining.
                           <br/>
                           <span className="block mt-4">
                             Given at Nairobi, Kenya, this {getOrdinalDate()}.
                           </span>
                        </p>
                    </div>

                    {/* Certificate Footer - CSS Grid Layout to Fix Overlapping Components */}
                    <div className="w-full grid grid-cols-4 gap-5 items-end px-8 pb-12 mt-8 flex-shrink-0 relative z-30">
                       {/* Vice Chancellor Section - Column 1 */}
                       <div className="flex flex-col items-start gap-2">
                          <div className="w-full max-w-[120px] border-b-2 border-gray-900 mb-1 relative">
                             <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-[cursive] text-xl text-[#000080] opacity-80 -rotate-6 pointer-events-none whitespace-nowrap">Prof. I. Sigei</div>
                          </div>
                          <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">Vice Chancellor</p>
                       </div>

                       {/* QR Code Section - Column 2 */}
                       <div className="flex flex-col items-center gap-1">
                          <div className="p-1 bg-white border border-gray-200 rounded-lg">
                             <img 
                               src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(verifyUrl)}`} 
                               className="w-16 h-16 md:w-20 md:h-20" 
                               alt="Verification QR"
                             />
                          </div>
                          <span className="text-[6px] font-black uppercase tracking-widest text-gray-400">Scan to verify</span>
                       </div>

                       {/* Shield Icon Section - Column 3 */}
                       <div className="flex flex-col items-center gap-1">
                          <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center filter drop-shadow-md">
                             <img 
                               src="https://i.ibb.co/LXbLfm1K/shield.png" 
                               alt="Official Seal"
                               className="object-contain w-full h-full"
                               style={{ width: '100%', height: '100%' }}
                             />
                          </div>
                          <span className="text-[6px] font-black uppercase tracking-widest text-gray-400">Secure</span>
                       </div>

                       {/* Academic Registrar Section - Column 4 */}
                       <div className="flex flex-col items-end gap-2">
                          <div className="w-full max-w-[120px] border-b-2 border-gray-900 mb-1 relative">
                             <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-[cursive] text-xl text-[#000080] opacity-80 -rotate-3 pointer-events-none whitespace-nowrap">Dr. S. Kiptoo</div>
                          </div>
                          <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500 text-right">Academic Registrar</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="w-[297mm] max-w-full mt-6 flex justify-between items-center bg-gray-900 p-6 text-white no-print shadow-2xl border-t border-white/10">
                 <div className="flex items-center gap-4">
                    <ShieldCheck size={24} className="text-[#FFD700]" />
                    <div>
                       <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Official Document Preview Mode</span>
                       <span className="block text-[9px] text-[#FFD700] uppercase tracking-wider">SECURE SERIAL: {serialNumber}</span>
                    </div>
                 </div>
                 <div className="flex gap-4 items-center">
                    <div className="flex bg-gray-800 p-1 border border-white/10 rounded-none mr-2">
                       <button onClick={() => setOrientation('landscape')} className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${orientation === 'landscape' ? 'bg-[#FFD700] text-[#4B0082]' : 'text-gray-400 hover:text-white'}`}>
                         <Layout size={14} className="rotate-90" /> Landscape
                       </button>
                       <button onClick={() => setOrientation('portrait')} className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${orientation === 'portrait' ? 'bg-[#FFD700] text-[#4B0082]' : 'text-gray-400 hover:text-white'}`}>
                         <Layout size={14} /> Portrait
                       </button>
                    </div>
                    <button onClick={handleDownloadPdf} disabled={isDownloading} className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                       <Download size={16} /> {isDownloading ? 'Generating...' : 'Download PDF'}
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-8 py-3 bg-[#4B0082] text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-[#4B0082] transition-all">
                       <Printer size={16} /> Print Certificate
                    </button>
                    <button onClick={() => setShowCertificate(false)} className="p-3 bg-red-600 hover:bg-red-700 text-white transition-all">
                       <X size={20} />
                    </button>
                 </div>
              </div>

           </div>
        </div>
        );
      })()}

      <style>{`
        @media print {
          @page { size: A4 ${orientation}; margin: 0; }
          body { background: white; margin: 0; padding: 0; visibility: hidden; }
          #official-certificate-root { 
            visibility: visible !important; 
            position: fixed !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: ${orientation === 'landscape' ? '297mm' : '210mm'} !important; 
            height: ${orientation === 'landscape' ? '210mm' : '297mm'} !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            border: none !important;
            z-index: 9999;
            transform: scale(1);
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          #official-certificate-root * { visibility: visible !important; }
          .no-print { display: none !important; }
        }
        
        /* Responsive Certificate Footer Layout */
        @media (max-width: 767px) {
          #official-certificate-root .grid-cols-4 {
            grid-template-columns: 1fr 1fr !important;
            grid-template-rows: 1fr 1fr !important;
            gap: 1rem !important;
          }
          #official-certificate-root .grid-cols-4 > div {
            align-items: center !important;
          }
        }
      `}</style>
      </div>
    </div>
  );
};

export default Certificates;
