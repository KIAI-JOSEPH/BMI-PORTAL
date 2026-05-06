// Check the raw structure of the Excel file

import XLSX from 'xlsx';

const STUDENT_XLSX_PATH = '/mnt/c/Users/nissi/Pictures/BMI UNIVERSITY 1 (1).xlsx';

console.log('📥 Reading Excel file raw structure...\n');

const workbook = XLSX.readFile(STUDENT_XLSX_PATH);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

console.log(`Sheet name: ${sheetName}\n`);

// Get the range
const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
console.log(`Range: ${sheet['!ref']}`);
console.log(`Rows: ${range.s.r} to ${range.e.r}`);
console.log(`Columns: ${range.s.c} to ${range.e.c}\n`);

// Read first 10 rows as raw data
console.log('First 10 rows (raw):');
for (let row = 0; row <= Math.min(10, range.e.r); row++) {
  console.log(`\nRow ${row + 1}:`);
  const rowData: string[] = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = sheet[cellAddress];
    const value = cell ? (cell.v || '') : '';
    rowData.push(`  Col ${String.fromCharCode(65 + col)}: "${value}"`);
  }
  rowData.forEach(d => console.log(d));
}

// Try reading with different header row
console.log('\n\n📋 Trying to parse with header at row 3:');
const data = XLSX.utils.sheet_to_json(sheet, { range: 2, defval: '' }); // Start from row 3 (0-indexed)
if (data.length > 0) {
  console.log('\nColumns found:');
  Object.keys(data[0]).forEach((key, idx) => {
    console.log(`  ${idx + 1}. "${key}"`);
  });
  
  console.log('\n\nFirst student:');
  console.log(JSON.stringify(data[0], null, 2));
}
