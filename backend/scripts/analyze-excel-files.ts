/**
 * Analyze Excel files to understand their structure
 */

import pkg from 'xlsx';
const { readFile, utils } = pkg;

const files = [
  '../diploma STUDENTS PERFORMANCE (TRANSCRIPT).xlsx',
  '../BMI UNIVERSITY 1 (1).xlsx',
  '../BMI STUDENTS personal details 2026.xlsx',
];

console.log('📊 Analyzing Excel Files');
console.log('========================\n');

for (const filePath of files) {
  console.log(`\n📄 File: ${filePath}`);
  console.log('─'.repeat(80));
  
  try {
    const workbook = readFile(filePath);
    
    console.log(`Sheets: ${workbook.SheetNames.join(', ')}\n`);
    
    for (const sheetName of workbook.SheetNames) {
      console.log(`\n  📋 Sheet: "${sheetName}"`);
      const sheet = workbook.Sheets[sheetName];
      const data = utils.sheet_to_json(sheet, { defval: '', raw: false, header: 1 });
      
      if (data.length === 0) {
        console.log('     (empty sheet)');
        continue;
      }
      
      // Show first 5 rows
      console.log(`     Rows: ${data.length}`);
      console.log(`     First 5 rows:\n`);
      
      for (let i = 0; i < Math.min(5, data.length); i++) {
        const row = data[i] as any[];
        console.log(`     Row ${i + 1}:`, JSON.stringify(row));
      }
      
      // Try to parse as objects
      const objects = utils.sheet_to_json(sheet, { defval: '', raw: false });
      if (objects.length > 0) {
        console.log(`\n     As objects (first 2):`);
        for (let i = 0; i < Math.min(2, objects.length); i++) {
          console.log(`     ${i + 1}:`, JSON.stringify(objects[i], null, 2));
        }
      }
    }
    
  } catch (error: any) {
    console.error(`     ❌ Error: ${error.message}`);
  }
}

console.log('\n\n✅ Analysis complete');
