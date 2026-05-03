import * as XLSX from 'xlsx';
import * as fs from 'fs';
import path from 'path';

const files = [
  '../diploma STUDENTS PERFORMANCE (TRANSCRIPT).xlsx',
  '../BMI UNIVERSITY 1 (1).xlsx',
  '../BMI STUDENTS personal details 2026.xlsx'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`\n❌ File not found: ${file}`);
    return;
  }

  console.log(`\n📄 Analyzing: ${file}`);
  const workbook = XLSX.read(fs.readFileSync(filePath));
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`  Sheet: ${sheetName}`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    if (data.length > 0) {
      console.log('    Headers:', data[0]);
      for (let i = 1; i < Math.min(data.length, 6); i++) {
        console.log(`    Row ${i} sample:`, data[i]);
      }
    } else {
      console.log('    (Empty sheet)');
    }
  });
});
