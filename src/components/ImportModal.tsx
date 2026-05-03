import React, { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle, Download, Loader2, Info } from 'lucide-react';
import {
  parseFile,
  mapStudentRows,
  mapExamRows,
  processStudentImport,
  processExamImport,
  downloadTemplate,
  ImportResult,
  ExamImportRow,
} from '../services/importService';
import { Student, Course } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'students' | 'exams';
  existingStudents: Student[];
  existingCourses: Course[];
  onImportStudents?: (students: Student[], newCourses: Partial<Course>[]) => void;
  onImportExams?: (
    exams: ExamImportRow[],
    newStudents: Partial<Student>[],
    newCourses: Partial<Course>[],
    dynamicFields: string[],
    collectionName: string
  ) => void;
}

type Step = 'upload' | 'preview' | 'importing' | 'done';

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen, onClose, type,
  existingStudents, existingCourses,
  onImportStudents, onImportExams,
}) => {
  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [collectionName, setCollectionName] = useState(`exams_${new Date().getFullYear()}`);
  const [result, setResult] = useState<ImportResult<any> | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const reset = () => {
    setStep('upload');
    setFileName('');
    setResult(null);
    setImportErrors([]);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    try {
      const rows = await parseFile(file);
      if (rows.length === 0) {
        setImportErrors(['File is empty or has no data rows.']);
        return;
      }

      if (type === 'students') {
        const { mapped } = mapStudentRows(rows);
        const res = processStudentImport(mapped, existingStudents);
        setResult(res);
      } else {
        const { mapped, dynamicColumns, isTranscriptFormat } = mapExamRows(rows);
        const res = processExamImport(mapped, dynamicColumns, existingStudents, existingCourses, isTranscriptFormat);
        setResult(res);
      }
      setStep('preview');
    } catch (err: any) {
      setImportErrors([err.message]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleConfirmImport = async () => {
    if (!result) return;
    setStep('importing');

    try {
      if (type === 'students') {
        onImportStudents?.(result.imported as Student[], result.newCourses);
      } else {
        onImportExams?.(
          result.imported as ExamImportRow[],
          result.newStudents,
          result.newCourses,
          result.newFields,
          collectionName
        );
      }
      setStep('done');
    } catch (err: any) {
      setImportErrors([err.message]);
      setStep('preview');
    }
  };

  const totalNew = (result?.newStudents.length || 0) + (result?.newCourses.length || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-none shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-900 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={18} className="text-[#FFD700]" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">
                Import {type === 'students' ? 'Students / Admissions' : 'Exams & Grades'}
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Excel (.xlsx), CSV, or Google Sheets export</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Step: Upload */}
          {step === 'upload' && (
            <>
              {/* Template download */}
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-blue-800 dark:text-blue-300">Download the template first</p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                      Use the template to ensure correct column names. Unknown columns are auto-detected.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => downloadTemplate(type)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors whitespace-nowrap ml-4"
                >
                  <Download size={12} /> Template
                </button>
              </div>

              {/* Exam collection name */}
              {type === 'exams' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                    Exam Collection Name (used as database table name)
                  </label>
                  <input
                    type="text"
                    value={collectionName}
                    onChange={e => setCollectionName(e.target.value.replace(/[^a-zA-Z0-9_]/g, '_'))}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm font-mono outline-none focus:ring-2 focus:ring-[#4B0082] dark:text-white"
                    placeholder="e.g. exams_2024_sem1"
                  />
                  <p className="text-[10px] text-gray-400">A new database collection will be auto-created if it doesn't exist.</p>
                </div>
              )}

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-none p-12 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-[#4B0082] bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-[#4B0082] hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Upload size={32} className="mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Drop your file here or <span className="text-[#4B0082] dark:text-purple-400">click to browse</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Supports .xlsx, .xls, .csv</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                />
              </div>

              {importErrors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    {importErrors.map((e, i) => (
                      <p key={i} className="text-xs text-red-700 dark:text-red-400">{e}</p>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step: Preview */}
          {step === 'preview' && result && (
            <>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <FileSpreadsheet size={14} className="text-[#4B0082]" />
                <span className="font-bold">{fileName}</span>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Records Found', value: result.imported.length + result.skipped, color: 'bg-gray-100 dark:bg-gray-800' },
                  { label: 'Will Import', value: result.imported.length, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' },
                  { label: 'Skipped (exist)', value: result.skipped, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700' },
                  { label: 'Auto-Created', value: totalNew, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700' },
                ].map(card => (
                  <div key={card.label} className={`p-4 border border-gray-100 dark:border-gray-700 ${card.color}`}>
                    <p className="text-2xl font-black">{card.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">{card.label}</p>
                  </div>
                ))}
              </div>

              {/* New students to be created */}
              {result.newStudents.length > 0 && (
                <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 p-4">
                  <p className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-2">
                    {result.newStudents.length} New Students Will Be Auto-Created
                  </p>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {result.newStudents.map((s, i) => (
                      <p key={i} className="text-[11px] text-blue-600 dark:text-blue-400">
                        + {s.firstName} {s.lastName} ({s.email})
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* New courses to be created */}
              {result.newCourses.length > 0 && (
                <div className="border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10 p-4">
                  <p className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-2">
                    {result.newCourses.length} New Courses Will Be Auto-Created
                  </p>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {result.newCourses.map((c, i) => (
                      <p key={i} className="text-[11px] text-purple-600 dark:text-purple-400">
                        + {c.name} ({c.code})
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic fields */}
              {result.newFields.length > 0 && (
                <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 p-4">
                  <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-2">
                    {result.newFields.length} New Dynamic Fields Detected
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.newFields.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[11px] font-bold border border-amber-200 dark:border-amber-700">
                        {f}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-2">
                    These will be added as new columns in the database schema automatically.
                  </p>
                </div>
              )}

              {/* Parse errors */}
              {result.errors.length > 0 && (
                <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-4">
                  <p className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-widest mb-2">
                    {result.errors.length} Row Errors (will be skipped)
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <p key={i} className="text-[11px] text-red-600 dark:text-red-400">{e}</p>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step: Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 size={40} className="animate-spin text-[#4B0082]" />
              <p className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
                Importing data...
              </p>
              <p className="text-xs text-gray-400">Auto-creating missing records and schema fields</p>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && result && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <p className="text-lg font-black uppercase tracking-widest text-gray-900 dark:text-white">Import Complete</p>
              <div className="text-center space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-emerald-600">{result.imported.length}</span> records imported successfully
                </p>
                {totalNew > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-blue-600">{totalNew}</span> new records auto-created
                  </p>
                )}
                {result.skipped > 0 && (
                  <p className="text-sm text-gray-500">
                    <span className="font-bold">{result.skipped}</span> duplicates skipped
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          {step === 'done' ? (
            <button
              onClick={handleClose}
              className="w-full py-3 bg-[#4B0082] text-white font-black text-[10px] uppercase tracking-widest hover:bg-black transition-colors"
            >
              Close
            </button>
          ) : step === 'preview' ? (
            <>
              <button
                onClick={reset}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={result?.imported.length === 0}
                className="px-8 py-2.5 bg-[#4B0082] text-white font-black text-[10px] uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Upload size={12} className="text-[#FFD700]" />
                Confirm Import ({result?.imported.length} records)
              </button>
            </>
          ) : step === 'upload' ? (
            <button
              onClick={handleClose}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
