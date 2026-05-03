import React, { useState, useEffect } from 'react';
import { X, Save, User, BookOpen, Hash } from 'lucide-react';

interface AddGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (gradeData: GradeData) => void;
  students: Array<{ id: string; name: string; admissionNo: string }>;
  courses: Array<{ code: string; name: string; fullName: string }>;
  editData?: GradeData | null;
}

export interface GradeData {
  id?: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  courseCode: string;
  courseName: string;
  grade: number;
  academicYear?: string;
  semester?: string;
}

const AddGradeModal: React.FC<AddGradeModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  students,
  courses,
  editData 
}) => {
  const [formData, setFormData] = useState<Partial<GradeData>>({
    studentId: '',
    studentName: '',
    admissionNo: '',
    courseCode: '',
    courseName: '',
    grade: 0,
    academicYear: new Date().getFullYear().toString(),
    semester: 'Fall'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editData) {
      setFormData(editData);
    } else {
      setFormData({
        studentId: '',
        studentName: '',
        admissionNo: '',
        courseCode: '',
        courseName: '',
        grade: 0,
        academicYear: new Date().getFullYear().toString(),
        semester: 'Fall'
      });
    }
    setErrors({});
  }, [editData, isOpen]);

  const handleStudentChange = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setFormData(prev => ({
        ...prev,
        studentId: student.id,
        studentName: student.name,
        admissionNo: student.admissionNo
      }));
    }
  };

  const handleCourseChange = (courseCode: string) => {
    const course = courses.find(c => c.code === courseCode);
    if (course) {
      setFormData(prev => ({
        ...prev,
        courseCode: course.code,
        courseName: course.fullName || course.name
      }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.studentId) newErrors.studentId = 'Student is required';
    if (!formData.courseCode) newErrors.courseCode = 'Course is required';
    if (formData.grade === undefined || formData.grade < 0 || formData.grade > 100) {
      newErrors.grade = 'Grade must be between 0 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData as GradeData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-[#4B0082]">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 text-white p-6 flex justify-between items-center border-b-4 border-[#FFD700] z-10">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">
              {editData ? 'Edit Grade' : 'Add New Grade'}
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              Student Performance Entry
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 transition-colors rounded-none"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Student Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
              <User size={14} className="text-[#4B0082]" />
              Select Student *
            </label>
            <select
              value={formData.studentId}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-none text-sm font-bold outline-none focus:border-[#4B0082] dark:text-white"
              disabled={!!editData}
            >
              <option value="">-- Select Student --</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.admissionNo} - {student.name}
                </option>
              ))}
            </select>
            {errors.studentId && <p className="text-xs text-red-500 font-bold">{errors.studentId}</p>}
          </div>

          {/* Course Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
              <BookOpen size={14} className="text-[#4B0082]" />
              Select Course *
            </label>
            <select
              value={formData.courseCode}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-none text-sm font-bold outline-none focus:border-[#4B0082] dark:text-white"
              disabled={!!editData}
            >
              <option value="">-- Select Course --</option>
              {courses.map(course => (
                <option key={course.code} value={course.code}>
                  {course.code} - {course.fullName || course.name}
                </option>
              ))}
            </select>
            {errors.courseCode && <p className="text-xs text-red-500 font-bold">{errors.courseCode}</p>}
          </div>

          {/* Grade Input */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
              <Hash size={14} className="text-[#4B0082]" />
              Grade (0-100) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.grade}
              onChange={(e) => setFormData(prev => ({ ...prev, grade: Number(e.target.value) }))}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-none text-sm font-bold outline-none focus:border-[#4B0082] dark:text-white"
              placeholder="Enter grade (0-100)"
            />
            {errors.grade && <p className="text-xs text-red-500 font-bold">{errors.grade}</p>}
            
            {/* Grade Preview */}
            {formData.grade !== undefined && formData.grade >= 0 && (
              <div className="flex items-center gap-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Letter Grade:</span>
                <span className={`text-2xl font-black ${
                  formData.grade >= 90 ? 'text-emerald-600' :
                  formData.grade >= 80 ? 'text-blue-600' :
                  formData.grade >= 70 ? 'text-amber-600' :
                  formData.grade >= 60 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {formData.grade >= 90 ? 'A' :
                   formData.grade >= 80 ? 'B' :
                   formData.grade >= 70 ? 'C' :
                   formData.grade >= 60 ? 'D' : 'F'}
                </span>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                  GPA: {formData.grade >= 90 ? '4.0' :
                        formData.grade >= 80 ? '3.0' :
                        formData.grade >= 70 ? '2.0' :
                        formData.grade >= 60 ? '1.0' : '0.0'}
                </span>
              </div>
            )}
          </div>

          {/* Academic Year & Semester */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
                Academic Year
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-none text-sm font-bold outline-none focus:border-[#4B0082] dark:text-white"
                placeholder="2024"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
                Semester
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-none text-sm font-bold outline-none focus:border-[#4B0082] dark:text-white"
              >
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t-2 border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-black text-xs uppercase tracking-widest hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-[#4B0082] text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Save size={16} />
              {editData ? 'Update Grade' : 'Save Grade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGradeModal;
