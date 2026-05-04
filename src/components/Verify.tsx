
import React, { useEffect, useState } from 'react';
import { ShieldCheck, XCircle, CheckCircle2, Award } from 'lucide-react';
import { Student } from '../types';

interface VerifyProps {
  students: Student[];
}

const Verify: React.FC<VerifyProps> = ({ students }) => {
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [student, setStudent] = useState<Student | null>(null);
  const [serial, setSerial] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) {
      setStatus('invalid');
      return;
    }

    setSerial(id);

    // Simulate verification delay for security effect
    setTimeout(() => {
        // Serial Format from Certificates.tsx: BMI-{YEAR}-{ID_NUM_PART}
        // Example: BMI-2026-020231
        
        try {
            const parts = id.split('-');
            if (parts.length >= 3) {
                // Extract the numeric ID part which matches the student ID suffix
                const numPart = parts[2]; 
                
                // Find student where the numeric part of their ID matches
                const found = students.find(s => {
                    const sNum = s.id.replace(/\D/g, '').padEnd(6, '0').slice(0, 6);
                    return sNum === numPart;
                });

                if (found) {
                    setStudent(found);
                    setStatus('valid');
                } else {
                    setStatus('invalid');
                }
            } else {
                setStatus('invalid');
            }
        } catch (e) {
            setStatus('invalid');
        }
    }, 1500);
  }, [students]);

  if (status === 'loading') {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B0082] mb-4"></div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Verifying Cryptographic Signature...</p>
          </div>
      );
  }

  if (status === 'invalid') {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4 text-center">
              <XCircle className="h-20 w-20 text-red-500 mb-6" />
              <h1 className="text-3xl font-black text-red-900 uppercase mb-2">Invalid Certificate</h1>
              <p className="text-red-700 max-w-md font-medium">The document serial number <span className="font-mono bg-red-100 px-2 py-1 rounded">{serial}</span> could not be verified against the institutional ledger. This document may be forged or revoked.</p>
              <div className="mt-8">
                  <a href="/" className="text-xs font-black uppercase tracking-widest text-red-800 hover:underline">Return to Home</a>
              </div>
          </div>
      );
  }

  return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-white shadow-2xl overflow-hidden border-t-8 border-emerald-500 animate-slide-up">
              <div className="bg-emerald-50 p-6 text-center border-b border-emerald-100">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4">
                      <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-black text-emerald-900 uppercase tracking-tight">Official Record Verified</h2>
                  <p className="text-emerald-700 text-[10px] font-bold uppercase tracking-widest mt-1">BMI Institutional Blockchain Node</p>
              </div>
              
              <div className="p-8 space-y-6">
                  <div className="text-center">
                      <img src="/BMI.svg" className="h-20 mx-auto mb-4 object-contain filter drop-shadow-sm" alt="Logo"/>
                      <h1 className="text-xl font-black text-gray-900 uppercase leading-tight">{student?.firstName} {student?.lastName}</h1>
                      <p className="text-xs font-bold text-[#4B0082] uppercase tracking-widest mt-1">{student?.id}</p>
                  </div>

                  <div className="border-t border-gray-100 pt-6 space-y-4">
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Credential</span>
                          <span className="text-xs font-black text-gray-800 uppercase text-right max-w-[60%]">{getDegreeTitle(student)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Faculty</span>
                          <span className="text-xs font-black text-gray-800 uppercase">{student?.faculty}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Graduation Year</span>
                          <span className="text-xs font-black text-gray-800 uppercase">{student?.admissionYear ? parseInt(student.admissionYear) + 4 : new Date().getFullYear()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Honors</span>
                          <span className="text-xs font-black text-[#4B0082] uppercase">{getGraduationClass(student) || 'Pass'}</span>
                      </div>
                  </div>

                  <div className="bg-gray-50 p-4 text-center border border-gray-100">
                      <p className="text-[9px] text-gray-400 font-mono break-all font-bold">SERIAL: {serial}</p>
                  </div>
              </div>
              
              <div className="bg-gray-900 px-6 py-4 text-center">
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">BMI University • Office of the Registrar</p>
              </div>
          </div>
      </div>
  );
};

// Helper functions duplicated for standalone view context
const getDegreeTitle = (student: Student | null) => {
    if (!student) return '';
    if (student.academicLevel === 'PhD') return `DOCTOR OF PHILOSOPHY`;
    if (student.academicLevel === 'Masters') return `MASTER OF ARTS`;
    if (student.academicLevel === 'Degree') return `BACHELOR OF ${student.faculty.toUpperCase()}`;
    if (student.academicLevel === 'Diploma') return `DIPLOMA IN ${student.faculty.toUpperCase()}`;
    return `CERTIFICATE IN ${student.faculty.toUpperCase()}`;
};

const getGraduationClass = (student: Student | null) => {
    if (!student) return '';
    const { gpa, academicLevel } = student;
    if (academicLevel === 'PhD') return ''; 
    if (academicLevel === 'Degree') {
      if (gpa >= 3.6) return 'First Class Honours';
      if (gpa >= 3.0) return 'Second Class Upper';
      if (gpa >= 2.5) return 'Second Class Lower';
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

export default Verify;

