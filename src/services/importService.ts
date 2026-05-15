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
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
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
