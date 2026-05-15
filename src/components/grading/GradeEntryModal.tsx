/**
 * BMI UMS - Grade Entry Modal
 * Modern grade entry component with weighted assessment support
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import {
  AssessmentComponent,
  AssessmentType,
  ComponentScore,
  GradingScaleType,
} from '../../grading/types';
import {
  createAssessmentComponent,
  validateComponentWeights,
  ASSESSMENT_TEMPLATES,
  getAvailableTemplates,
} from '../../grading/models/AssessmentComponent';
import { calculateWeightedGrade } from '../../grading/calculators/WeightedGradeCalculator';
import { createUS40Scale, scoreToLetterGrade } from '../../grading/models/GradingScale';

interface GradeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (gradeData: GradeFormData) => void;
  students: Array<{ id: string; name: string; admissionNo: string }>;
  courses: Array<{ code: string; name: string; fullName: string; credits: number }>;
  editData?: GradeFormData | null;
  isLoading?: boolean;
}

export interface GradeFormData {
  id?: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  courseCode: string;
  courseName: string;
  credits: number;
  components: ComponentScore[];
  academicYear: string;
  semester: string;
  gradingScaleType: GradingScaleType;
}

const GradeEntryModal: React.FC<GradeEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  students,
  courses,
  editData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<GradeFormData>>({
    studentId: '',
    studentName: '',
    admissionNo: '',
    courseCode: '',
    courseName: '',
    credits: 3,
    components: [],
    academicYear: new Date().getFullYear().toString(),
    semester: 'Fall',
    gradingScaleType: GradingScaleType.US_4_0,
  });

  const [assessmentComponents, setAssessmentComponents] = useState<AssessmentComponent[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    if (editData) {
      setFormData(editData);
      // Reconstruct assessment components from component scores
      const components = editData.components.map(cs => ({
        id: cs.componentId,
        type: cs.componentType,
        name: cs.componentType,
        weight: cs.weight,
        maxScore: cs.maxScore,
      }));
      setAssessmentComponents(components);
    } else {
      resetForm();
    }
  }, [editData, isOpen]);

  const resetForm = () => {
    setFormData({
      studentId: '',
      studentName: '',
      admissionNo: '',
      courseCode: '',
      courseName: '',
      credits: 3,
      components: [],
      academicYear: new Date().getFullYear().toString(),
      semester: 'Fall',
      gradingScaleType: GradingScaleType.US_4_0,
    });
    setAssessmentComponents([]);
    setErrors({});
    setSelectedTemplate('');
  };

  const handleStudentChange = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setFormData(prev => ({
        ...prev,
        studentId: student.id,
        studentName: student.name,
        admissionNo: student.admissionNo || student.id,
      }));
    }
  };

  const handleCourseChange = (courseCode: string) => {
    const course = courses.find(c => c.code === courseCode);
    if (course) {
      setFormData(prev => ({
        ...prev,
        courseCode: course.code,
        courseName: course.fullName || course.name,
        credits: course.credits || 3,
      }));
    }
  };

  const handleTemplateChange = (templateName: string) => {
    setSelectedTemplate(templateName);
    if (templateName && ASSESSMENT_TEMPLATES[templateName as keyof typeof ASSESSMENT_TEMPLATES]) {
      const template = ASSESSMENT_TEMPLATES[templateName as keyof typeof ASSESSMENT_TEMPLATES]();
      setAssessmentComponents(template);
    }
  };

  const addComponent = () => {
    const newComponent = createAssessmentComponent(
      AssessmentType.ASSIGNMENT,
      `Component ${assessmentComponents.length + 1}`,
      0,
      100
    );
    setAssessmentComponents([...assessmentComponents, newComponent]);
  };

  const removeComponent = (index: number) => {
    setAssessmentComponents(assessmentComponents.filter((_, i) => i !== index));
  };

  const updateComponent = (index: number, field: keyof AssessmentComponent, value: any) => {
    const updated = [...assessmentComponents];
    updated[index] = { ...updated[index], [field]: value };
    setAssessmentComponents(updated);
  };

  const updateComponentScore = (componentId: string, score: number) => {
    const component = assessmentComponents.find(c => c.id === componentId);
    if (!component) return;

    const existingScores = formData.components || [];
    const existingIndex = existingScores.findIndex(cs => cs.componentId === componentId);

    const newScore: ComponentScore = {
      componentId,
      componentType: component.type,
      score,
      maxScore: component.maxScore,
      weight: component.weight,
      gradedAt: new Date().toISOString(),
    };

    let updatedScores: ComponentScore[];
    if (existingIndex >= 0) {
      updatedScores = [...existingScores];
      updatedScores[existingIndex] = newScore;
    } else {
      updatedScores = [...existingScores, newScore];
    }

    setFormData(prev => ({ ...prev, components: updatedScores }));
  };

  const getComponentScore = (componentId: string): number => {
    const score = formData.components?.find(cs => cs.componentId === componentId);
    return score?.score || 0;
  };

  const calculatePreview = () => {
    if (assessmentComponents.length === 0 || !formData.components || formData.components.length === 0) {
      return null;
    }

    try {
      const result = calculateWeightedGrade(assessmentComponents, formData.components);
      const scale = createUS40Scale();
      const letterGrade = scoreToLetterGrade(result.finalGrade, scale);

      return {
        finalGrade: result.finalGrade,
        letterGrade,
        isComplete: result.isComplete,
        completionPercentage: result.completionPercentage,
      };
    } catch (error) {
      return null;
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentId) newErrors.studentId = 'Student is required';
    if (!formData.courseCode) newErrors.courseCode = 'Course is required';

    // Loosened: Allow saving even if weights don't sum to 100%
    // Only require at least one component to calculate a grade
    if (assessmentComponents.length === 0) {
      newErrors.components = 'At least one assessment component is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData as GradeFormData);
      if (!editData) {
        resetForm();
      }
    }
  };

  const weightValidation = validateComponentWeights(assessmentComponents);
  const preview = calculatePreview();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-[#4B0082]">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 text-white p-6 flex justify-between items-center border-b-4 border-[#FFD700] z-10">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">
              {editData ? 'Edit Grade' : 'Add New Grade'}
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              Weighted Assessment Entry
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
          {/* Student & Course Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
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

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
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

          {/* Assessment Components Section */}
          <div className="space-y-4 border-t-2 border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
                Assessment Components
              </h3>
              <div className="flex gap-2">
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-none text-xs font-bold outline-none focus:border-[#4B0082] dark:text-white"
                >
                  <option value="">Load Template...</option>
                  {getAvailableTemplates().map(template => (
                    <option key={template} value={template}>
                      {template.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addComponent}
                  className="px-4 py-2 bg-[#4B0082] text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Component
                </button>
              </div>
            </div>

            {errors.components && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle size={16} className="text-red-600" />
                <p className="text-xs text-red-600 font-bold">{errors.components}</p>
              </div>
            )}

            {/* Weight Validation */}
            {assessmentComponents.length > 0 && (
              <div className={`flex items-center justify-between p-3 border ${
                weightValidation.isValid
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              }`}>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Total Weight: {weightValidation.totalWeight.toFixed(2)}%
                </span>
                {!weightValidation.isValid && (
                  <span className="text-xs font-bold text-amber-600">
                    Must equal 100%
                  </span>
                )}
              </div>
            )}

            {/* Component List */}
            <div className="space-y-3">
              {assessmentComponents.map((component, index) => (
                <div key={component.id} className="p-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-3">
                      <select
                        value={component.type}
                        onChange={(e) => updateComponent(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-none text-xs font-bold outline-none focus:border-[#4B0082] dark:text-white"
                      >
                        {Object.values(AssessmentType).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={component.weight}
                        onChange={(e) => updateComponent(index, 'weight', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-none text-xs font-bold outline-none focus:border-[#4B0082] dark:text-white"
                        placeholder="Weight %"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={component.maxScore}
                        onChange={(e) => updateComponent(index, 'maxScore', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-none text-xs font-bold outline-none focus:border-[#4B0082] dark:text-white"
                        placeholder="Max Score"
                        min="1"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={getComponentScore(component.id)}
                        onChange={(e) => updateComponentScore(component.id, Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-none text-xs font-bold outline-none focus:border-[#4B0082] dark:text-white"
                        placeholder="Score"
                        min="0"
                        max={component.maxScore}
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeComponent(index)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grade Preview */}
          {preview && (
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                    Final Grade Preview
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-3xl font-black text-purple-600">
                      {preview.letterGrade}
                    </span>
                    <span className="text-xl font-bold text-gray-700 dark:text-gray-300">
                      {preview.finalGrade.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    Completion: {preview.completionPercentage.toFixed(0)}%
                  </p>
                  <p className={`text-xs font-bold mt-1 ${
                    preview.isComplete ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {preview.isComplete ? 'Complete' : 'Provisional'}
                  </p>
                </div>
              </div>
            </div>
          )}

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
              disabled={isLoading}
              className={`flex-1 px-6 py-3 bg-[#4B0082] text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Save size={16} />
              {isLoading ? 'Saving...' : (editData ? 'Update Grade' : 'Save Grade')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GradeEntryModal;
