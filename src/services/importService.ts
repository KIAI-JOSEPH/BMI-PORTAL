import * as XLSX from 'xlsx';

export interface V2ImportData {
  faculties: any[];
  departments: any[];
  programs: any[];
  courses: any[];
  program_courses: any[];
  staff: any[];
  students: any[];
  enrollments: any[];
  grades: any[];
}

export function parseV2Template(file: File): Promise<V2ImportData> {
  // Mitigate xlsx vulnerability (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9):
  // 1. Enforce a 10MB file size limit before parsing.
  // 2. Validate MIME type to prevent non-spreadsheet files.
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
  const ALLOWED_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return Promise.reject(
      new Error(`File too large. Maximum allowed size is 10 MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`)
    );
  }

  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return Promise.reject(
      new Error(`Invalid file type "${file.type}". Only .xlsx and .xls files are accepted.`)
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, {
          type: 'array',
          // Disable potentially dangerous features
          cellFormula: false,
          cellHTML: false,
          sheetStubs: false,
        });

        const getSheetData = (sheetName: string) => {
          if (!workbook.Sheets[sheetName]) return [];
          return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '', raw: false });
        };

        const result: V2ImportData = {
          faculties: getSheetData('01_FACULTIES'),
          departments: getSheetData('02_DEPARTMENTS'),
          programs: getSheetData('03_PROGRAMS'),
          courses: getSheetData('04_COURSES'),
          program_courses: getSheetData('05_PROG_COURSES'),
          staff: getSheetData('06_STAFF'),
          students: getSheetData('07_STUDENTS'),
          enrollments: getSheetData('08_ENROLLMENTS'),
          grades: getSheetData('09_GRADES'),
        };

        resolve(result);
      } catch (err) {
        reject(new Error('Failed to parse V2 template. Ensure it is a valid .xlsx file matching the V2 structure.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}
