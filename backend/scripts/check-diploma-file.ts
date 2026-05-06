// Check the DIPLOMA Excel file structure

import XLSX from 'xlsx';

const DIPLOMA_XLSX_PATH = '/mnt/c/Users/nissi/Pictures/DIPLOMA  Class Final GRADES .xlsx';

console.log('📥 Checking DIPLOMA file...\n');

const workbook = XLSX.readFile(DIPLOMA_XLSX_PATH);

console.log('Sheets:', workbook.SheetNames);
console.log('');

workbook.SheetNames.forEach((sheetName, idx) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Sheet ${idx + 1}: ${sheetName}`);
  console.log('='.repeat(60));
  
  const sheet = workbook.Sheets[sheetName];
  console.log('Range:', sheet['!ref']);
  
  // Get first 5 rows raw
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  console.log('\nFirst 5 rows (raw):');
  for (let row = 0; row <= Math.min(5, range.e.r); row++) {
    console.log(`\nRow ${row + 1}:`);
    const rowData: string[] = [];
    for (let col = range.s.c; col <= Math.min(10, range.e.c); col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = sheet[cellAddress];
      const value = cell ? (cell.v || '') : '';
      if (value) {
        rowData.push(`  ${cellAddress}: "${value}"`);
      }
    }
    rowData.forEach(d => console.log(d));
  }
  
  // Try parsing as JSON
  console.log('\n\nTrying to parse as table:');
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
    console.log('\nFirst record:');
    console.log(JSON.stringify(data[0], null, 2));
  }
});
