import React, { useState, useEffect } from 'react';
import { X, UserPlus, Upload, User, CheckCircle2 } from 'lucide-react';
import { Student } from '../types';

interface StudentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (studentData: Partial<Student>) => void;
  initialData?: Student;
}

const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    faculty: 'Theology',
    department: 'Biblical Studies',
    status: 'Applicant',
    academicLevel: 'Degree',
    gender: 'Male',
    admissionYear: new Date().getFullYear().toString(),
    enrollmentTerm: 'Fall ' + new Date().getFullYear(),
    careerPath: 'Degree in Theology',
    standing: 'Good',
    gpa: 0.0,
    avatarColor: 'bg-purple-600',
    photoZoom: 1
  });
  
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setPhotoPreview(initialData.photo);
    } else if (isOpen) {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        faculty: 'Theology',
        department: 'Biblical Studies',
        status: 'Applicant',
        academicLevel: 'Degree',
        gender: 'Male',
        admissionYear: new Date().getFullYear().toString(),
        enrollmentTerm: 'Fall ' + new Date().getFullYear(),
        careerPath: 'Degree in Theology',
        standing: 'Good',
        gpa: 0.0,
        avatarColor: 'bg-purple-600',
        photoZoom: 1
      });
      setPhotoPreview(undefined);
    }
  }, [initialData, isOpen]);

  const handleChange = (field: keyof Student, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        handleChange('photo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#1a0033]/90 backdrop-blur-3xl p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[90vh] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col border-[1px] border-[#FFD700]/30 overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="bg-gray-900 p-8 border-b-2 border-[#FFD700] flex justify-between items-center text-white flex-shrink-0">
           <div className="flex items-center gap-4">
              <div className="p-2 bg-[#FFD700] rounded-none shadow-lg">
                 <UserPlus size={24} className="text-black" />
              </div>
              <div>
                 <h3 className="text-xl font-bold uppercase tracking-tight">{initialData ? 'Update Student Record' : 'New Student Admission'}</h3>
                 <p className="text-[10px] font-bold text-[#FFD700] uppercase tracking-widest mt-1">BMI Institutional Enrollment Node</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-red-500 transition-all text-white"><X size={24}/></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-10 bg-[#FAFAFA] dark:bg-gray-950 no-scrollbar space-y-8">
           
           {/* Section A: Bio & Photo */}
           <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0 w-full md:w-auto flex justify-center">
                 <div className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center relative overflow-hidden group">
                    {photoPreview ? (
                      <img src={photoPreview} className="w-full h-full object-cover" alt="Student" />
                    ) : (
                      <>
                        <User size={32} className="text-gray-400 mb-2" />
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Upload Photo</span>
                      </>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                       <Upload size={20} className="text-white" />
                    </div>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                 </div>
              </div>
              
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">First Name</label>
                    <input 
                      type="text" 
                      value={formData.firstName} 
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none font-bold text-sm focus:border-[#4B0082]"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Last Name</label>
                    <input 
                      type="text" 
                      value={formData.lastName} 
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none font-bold text-sm focus:border-[#4B0082]"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Gender</label>
                    <select 
                      value={formData.gender} 
                      onChange={(e) => handleChange('gender', e.target.value)}
                      className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none font-bold text-xs uppercase cursor-pointer"
                    >
                       <option value="Male">Male</option>
                       <option value="Female">Female</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Admission Status</label>
                    <select 
                      value={formData.status} 
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none font-bold text-xs uppercase cursor-pointer"
                    >
                       {['Active', 'Applicant', 'On Leave', 'Graduated', 'Suspended'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                 </div>
              </div>
           </div>

           <div className="h-[1px] bg-gray-200 dark:bg-gray-800 w-full"></div>

           {/* Section B: Contact */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                 <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Email Address</label>
                 <input 
                   type="email" 
                   value={formData.email} 
                   onChange={(e) => handleChange('email', e.target.value)}
                   className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none font-medium text-sm focus:border-[#4B0082]"
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Phone Number</label>
                 <input 
                   type="text" 
                   value={formData.phone} 
                   onChange={(e) => handleChange('phone', e.target.value)}
                   className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none font-medium text-sm focus:border-[#4B0082]"
                 />
              </div>
           </div>

           {/* Section C: Academic */}
           <div className="bg-purple-50/50 dark:bg-purple-900/10 p-6 border border-purple-100 dark:border-purple-900/30 space-y-6">
              <h4 className="text-[10px] font-black uppercase text-[#4B0082] dark:text-purple-300 tracking-[0.25em]">Academic Placement</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Faculty</label>
                    <select 
                      value={formData.faculty} 
                      onChange={(e) => handleChange('faculty', e.target.value)}
                      className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none font-bold text-xs uppercase cursor-pointer"
                    >
                       {['Theology', 'ICT', 'Business', 'Education'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Department</label>
                    <input 
                      type="text" 
                      value={formData.department} 
                      onChange={(e) => handleChange('department', e.target.value)}
                      className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none font-bold text-xs uppercase"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Academic Level</label>
                    <select 
                      value={formData.academicLevel} 
                      onChange={(e) => handleChange('academicLevel', e.target.value)}
                      className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none font-bold text-xs uppercase cursor-pointer"
                    >
                       {['Diploma', 'Degree', 'Masters', 'PhD'].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Career Path / Major</label>
                    <input 
                      type="text" 
                      value={formData.careerPath} 
                      onChange={(e) => handleChange('careerPath', e.target.value)}
                      className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none font-bold text-xs uppercase"
                    />
                 </div>
              </div>
           </div>

        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-end gap-4 flex-shrink-0">
           <button 
             onClick={onClose}
             className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
           >
             Cancel
           </button>
           <button 
             onClick={() => onSuccess(formData)}
             className="px-10 py-3 bg-[#4B0082] text-white rounded-none shadow-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 border border-[#FFD700]/30"
           >
             <CheckCircle2 size={16} className="text-[#FFD700]" />
             {initialData ? 'Update Record' : 'Confirm Enrollment'}
           </button>
        </div>

      </div>
    </div>
  );
};

export default StudentRegistrationModal;