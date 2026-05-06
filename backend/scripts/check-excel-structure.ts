// Check the structure of the Excel files to see the actual column names

import XLSX from 'xlsx';

const STUDENT_XLSX_PATH = '/mnt/c/Users/nissi/Pictures/BMI UNIVERSITY 1 (1).xlsx';

console.log('📥 Reading Excel file structure...\n');

const workbook = XLSX.readFile(STUDENT_XLSX_PATH);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

console.log(`Sheet name: ${sheetName}\n`);

// Get first 3 rows to see the structure
const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

console.log(`Total rows: ${rows.length}\n`);

if (rows.length > 0) {
  console.log('Column names (from first row):');
  const columns = Object.keys(rows[0]);
  columns.forEach((col, idx) => {
    console.log(`  ${idx + 1}. "${col}"`);
  });
  
  console.log('\n\nFirst 2 student records:\n');
  rows.slice(0, 2).forEach((row, idx) => {
    console.log(`Student ${idx + 1}:`);
    Object.entries(row).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');
  });
}
