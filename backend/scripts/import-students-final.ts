/**
 * BMI UMS - Final Student Import Script
 * Handles all three Excel files with their specific formats
 */

import pkg from 'xlsx';
const { readFile, utils } = pkg;

const PB_URL = 'http://127.0.0.1:8090';
const ADMIN_EMAIL = 'admin@bmi.edu';
const ADMIN_PASSWORD = 'BMIAdmin2024Secure';

interface Student {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  admissionNumber: string;
  address?: string;
  nationality?: string;
  academicLevel: string;
  faculty: string;
  department: string;
}

/**
 * Parse diploma transcript file (225-XXX format)
 */
function parseTranscriptFile(filePath: string): Student[] {
  const workbook = readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  
  const students: Student[] = [];
  
  // Start from row 3 (skip headers)
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const nameRaw = String(row[0] || '').trim();
    const admissionRaw = String(row[1] || '').trim();
    const phoneRaw = String(row[2] || '').trim();
    
    if (!nameRaw || !admissionRaw || admissionRaw === 'ADMISSION. NO') continue;
    
    // Parse name
    const nameParts = nameRaw.replace(/\s+/g, ' ').split(' ').filter(p => p.length > 0);
    if (nameParts.length === 0) continue;
    
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];
    
    // Convert 225-XXX to KEN-DIP225-XXX format
    let admissionNumber = admissionRaw.match(/(\d{3})-(\d{3})/)
      ? `KEN-DIP${admissionRaw}`
      : admissionRaw;
    
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}@bmi.edu`;
    const phone = phoneRaw || '+254700000000';
    
    students.push({
      firstName,
      lastName,
      email,
      phone,
      admissionNumber,
      nationality: 'Kenya',
      academicLevel: 'Diploma',
      faculty: 'Theology',
      department: 'Biblical Studies',
    });
  }
  
  return students;
}

/**
 * Parse personal details file (multiple country sheets)
 */
function parsePersonalDetailsFile(filePath: string): Student[] {
  const workbook = readFile(filePath);
  const students: Student[] = [];
  
  const countrySheets = ['ZAMBIA', 'PAKISTAN', 'KENYA', 'NIGERIA', 'LIBERIA', 'BURUNDI', 'CANADA'];
  
  for (const sheetName of workbook.SheetNames) {
    if (!countrySheets.includes(sheetName)) continue;
    
    const sheet = workbook.Sheets[sheetName];
    const data = utils.sheet_to_json(sheet, { defval: '' }) as any[];
    
    for (const row of data) {
      const nameRaw = String(row['NAMES'] || row['NAME'] || row[sheetName] || '').trim();
      const email = String(row['EMAIL'] || '').trim().toLowerCase();
      const phone = String(row['PHONE'] || row['PHONE NO'] || '').trim();
      const admissionNo = String(row['ADIMISION No'] || row['ADMISSION NO.'] || row['ADMISSION NO'] || row['ADMISSION'] || '').trim();
      const address = String(row['ADDRESS'] || '').trim();
      
      if (!nameRaw || nameRaw === sheetName) continue;
      
      // Parse name
      const nameParts = nameRaw.replace(/\s+/g, ' ').split(' ').filter(p => p.length > 0);
      if (nameParts.length === 0) continue;
      
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];
      
      // Generate email if missing
      const studentEmail = email || `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}@bmi.edu`;
      
      // Generate admission number if missing
      let studentAdmissionNo = admissionNo;
      if (!studentAdmissionNo) {
        const countryCode = sheetName.substring(0, 3).toUpperCase();
        const pin = String(Math.floor(100 + Math.random() * 900));
        studentAdmissionNo = `${countryCode}-BA226-${pin}`;
      }
      
      // Determine academic level from admission number
      let academicLevel = 'Degree';
      if (studentAdmissionNo.includes('-CT') || studentAdmissionNo.includes('CT226')) {
        academicLevel = 'Certificate';
      } else if (studentAdmissionNo.includes('-DIP') || studentAdmissionNo.includes('DIP226')) {
        academicLevel = 'Diploma';
      } else if (studentAdmissionNo.includes('-MA') || studentAdmissionNo.includes('MA226')) {
        academicLevel = 'Masters';
      } else if (studentAdmissionNo.includes('-PH') || studentAdmissionNo.includes('PH226')) {
        academicLevel = 'PhD';
      }
      
      students.push({
        firstName,
        lastName,
        email: studentEmail,
        phone: phone || '+254700000000',
        admissionNumber: studentAdmissionNo,
        address,
        nationality: sheetName,
        academicLevel,
        faculty: 'Theology',
        department: 'Biblical Studies',
      });
    }
  }
  
  return students;
}

/**
 * Upload students using direct HTTP API
 */
async function uploadStudents(token: string, students: Student[]) {
  console.log(`\n📤 Uploading ${students.length} students...`);
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  const avatarColors = ['bg-purple-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600'];
  
  for (const student of students) {
    try {
      const response = await fetch(`${PB_URL}/api/collections/students/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify({
          id: student.admissionNumber,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone,
          gender: 'Male',
          nationality: student.nationality,
          faculty: student.faculty,
          department: student.department,
          careerPath: `${student.academicLevel} in ${student.faculty}`,
          academicLevel: student.academicLevel,
          admissionYear: '2025',
          enrollmentTerm: 'Fall 2024',
          status: 'Active',
          standing: 'Good',
          gpa: 0,
          avatarColor: avatarColors[created % avatarColors.length],
          photoZoom: 1,
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        // Check if it's a duplicate error
        if (response.status === 400 && (
          responseData.message?.includes('already exists') ||
          responseData.message?.includes('duplicate') ||
          responseData.data?.id?.code === 'validation_not_unique'
        )) {
          console.log(`⏭️  ${student.firstName} ${student.lastName} (duplicate - skipping)`);
          skipped++;
          continue;
        }
        
        // Log detailed error for debugging
        console.error(`❌ ${student.firstName} ${student.lastName} (${student.admissionNumber}):`);
        console.error(`   Status: ${response.status}`);
        console.error(`   Message: ${responseData.message || 'No message'}`);
        if (responseData.data) {
          console.error(`   Validation errors:`);
          for (const [field, error] of Object.entries(responseData.data)) {
            console.error(`     - ${field}:`, error);
          }
        }
        errors++;
        continue;
      }
      
      console.log(`✅ ${student.firstName} ${student.lastName} (${student.admissionNumber})`);
      created++;
      
    } catch (error: any) {
      console.error(`❌ ${student.firstName} ${student.lastName}: ${error.message}`);
      errors++;
    }
  }
  
  console.log(`\n📊 Summary: Created ${created}, Skipped ${skipped}, Errors ${errors}`);
}

/**
 * Main function
 */
async function main() {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('Usage: npx tsx import-students-final.ts <file-path>');
    process.exit(1);
  }
  
  console.log('🚀 BMI UMS - Student Import');
  console.log('===========================\n');
  
  // Authenticate
  console.log('🔐 Authenticating...');
  const authResponse = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });
  
  if (!authResponse.ok) {
    console.error('❌ Authentication failed');
    process.exit(1);
  }
  
  const authData = await authResponse.json();
  console.log('✅ Authenticated\n');
  
  // Parse file based on name
  let students: Student[] = [];
  
  if (filePath.includes('TRANSCRIPT')) {
    console.log('📄 Parsing transcript file...');
    students = parseTranscriptFile(filePath);
  } else if (filePath.includes('personal details')) {
    console.log('📄 Parsing personal details file...');
    students = parsePersonalDetailsFile(filePath);
  } else {
    console.log('⚠️  Unknown file format, skipping');
    process.exit(0);
  }
  
  console.log(`✅ Found ${students.length} students`);
  
  if (students.length > 0) {
    await uploadStudents(authData.token, students);
    
    // Verify what's actually in the database
    console.log('\n🔍 Verifying database...');
    const verifyResponse = await fetch(`${PB_URL}/api/collections/students/records?perPage=1`, {
      headers: { 'Authorization': authData.token },
    });
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log(`📊 Total students in database: ${verifyData.totalItems}`);
    }
  }
  
  console.log('\n✅ Import complete');
}

main().catch(console.error);
