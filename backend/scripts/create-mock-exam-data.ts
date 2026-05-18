/**
 * BMI UMS - Create Mock Exam Data
 * Generates mock students with exam grades for testing
 * Usage: cd backend && npx tsx scripts/create-mock-exam-data.ts
 */

import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@bmi.edu';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || (process.env.POCKETBASE_ADMIN_PASSWORD ?? '');

// All available theology courses
const ALL_COURSES = [
  'HOMILETICS',
  'HERMENEUTICS',
  'CHURCH_ADMIN',
  'PNEUMATOLOGY',
  'EVANGELISM',
  'ESCHATOLOGY',
  'PRINCIPLE_OF_SUCCESS',
  'ANGELOLOGY',
  'HAMARTIOLOGY',
  'NEW_SURVEY',
  'OLD_SURVEY',
  'CHRISTOLOGY',
  'CHURCH_GROWTH',
  'BIBLIOLOGY',
  'THEOLOGY_PROPER',
  'SOTERIOLOGY',
  'CHRISTIAN_FAMILY',
  'CHURCH_PLANTING',
  'CHURCH_HISTORY',
  'PRAISE_AND_WORSHIP',
  'SPIRITUAL_WARFARE',
  'FOUNDATION_SUCCESSFUL_MINISTRY',
  'SPIRITUAL_FORMATION',
  'KINGDOM_PRINCIPLES',
  'PRINCIPLES_OF_SUCCESS',
  'UNDERSTANDING_GODS',
  'ECCLESIOLOGY',
  'PASTORAL_COUNSELLING_ETHICS',
  'GREEK',
  'CHRISTIAN_APOLOGETICS',
  'HEBREW',
  'WORLD_RELIGION',
  'SPIRITUAL_REALM'
];

// Student name pools
const FIRST_NAMES = ['John', 'Mary', 'Peter', 'Sarah', 'Paul', 'Grace', 'James', 'Ruth', 'David', 'Esther', 'Daniel', 'Hannah', 'Matthew', 'Lydia', 'Andrew', 'Deborah'];
const LAST_NAMES = ['Ochieng', 'Wanjiku', 'Mwangi', 'Akinyi', 'Kamau', 'Achieng', 'Odhiambo', 'Wambui', 'Mutua', 'Nyambura', 'Kiptoo', 'Chebet', 'Omondi', 'Wangari', 'Kimani', 'Wairimu'];
const COUNTRIES = ['KEN', 'UGA', 'TZA', 'ZAM', 'RWA'];

interface MockStudent {
  admissionNo: string;
  studentName: string;
  courses: string[];
  grades: Record<string, number>;
}

function generateAdmissionNumber(country: string, level: string, year: string, sequence: number): string {
  const levelCode = level === 'Diploma' ? 'DIP' : level === 'Degree' ? 'BA' : 'MA';
  return `${country}-${levelCode}${year.slice(-2)}-${String(sequence).padStart(3, '0')}`;
}

function generateRandomGrade(): number {
  // Generate grades between 50-98 (realistic passing grades)
  return Math.floor(Math.random() * 49) + 50;
}

function createMockStudent(index: number, numGrades: number): MockStudent {
  const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  const level = index < 5 ? 'Diploma' : index < 7 ? 'Degree' : 'Masters';
  const year = '2024';
  const admissionNo = generateAdmissionNumber(country, level, year, 200 + index);
  
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const studentName = `${firstName} ${lastName}`;
  
  // Shuffle courses and pick the required number
  const shuffled = [...ALL_COURSES].sort(() => 0.5 - Math.random());
  const selectedCourses = shuffled.slice(0, numGrades);
  
  // Generate grades for each course
  const grades: Record<string, number> = {};
  selectedCourses.forEach(course => {
    grades[course] = generateRandomGrade();
  });
  
  return {
    admissionNo,
    studentName,
    courses: selectedCourses,
    grades
  };
}

function getPocketBase(): PocketBase {
  return new PocketBase(PB_URL);
}

async function authenticateAdmin(pb: PocketBase) {
  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✓ Authenticated as admin');
  } catch (error: any) {
    console.error('✗ Failed to authenticate:', error.message);
    throw error;
  }
}

async function createStudentsCollection(pb: PocketBase) {
  try {
    // Check if collection exists
    const collections = await pb.collections.getFullList();
    const exists = collections.find(c => c.name === 'students');
    
    if (exists) {
      console.log('✓ Students collection exists');
      return;
    }
    
    console.log('Creating students collection...');
    await pb.collections.create({
      name: 'students',
      type: 'base',
      schema: [
        { name: 'firstName', type: 'text', required: true },
        { name: 'lastName', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text' },
        { name: 'gender', type: 'select', options: { values: ['Male', 'Female'] } },
        { name: 'faculty', type: 'text' },
        { name: 'department', type: 'text' },
        { name: 'academicLevel', type: 'select', options: { values: ['Diploma', 'Degree', 'Masters', 'PhD'] } },
        { name: 'admissionYear', type: 'text' },
        { name: 'status', type: 'select', options: { values: ['Active', 'Applicant', 'Graduated', 'On Leave', 'Suspended'] } },
        { name: 'gpa', type: 'number' },
      ]
    });
    console.log('✓ Students collection created');
  } catch (err: any) {
    console.error('✗ Failed to create students collection:', err.message);
  }
}

async function createExamsCollection(pb: PocketBase) {
  const collectionName = 'exams_grades';
  
  try {
    // Check if collection exists
    const collections = await pb.collections.getFullList();
    const exists = collections.find(c => c.name === collectionName);
    
    if (exists) {
      console.log(`✓ ${collectionName} collection exists`);
      return collectionName;
    }
    
    console.log(`Creating ${collectionName} collection...`);
    
    // Create schema with base fields + course fields
    const schema = [
      { name: 'admissionNo', type: 'text', required: true },
      { name: 'studentName', type: 'text', required: true },
    ];
    
    // Add all course fields
    ALL_COURSES.forEach(course => {
      schema.push({
        name: course,
        type: 'number',
        required: false
      } as any);
    });
    
    await pb.collections.create({
      name: collectionName,
      type: 'base',
      schema
    });
    
    console.log(`✓ ${collectionName} collection created with ${ALL_COURSES.length} course fields`);
    return collectionName;
  } catch (err: any) {
    console.error(`✗ Failed to create ${collectionName} collection:`, err.message);
    throw err;
  }
}

async function insertStudent(pb: PocketBase, mockStudent: MockStudent) {
  try {
    const nameParts = mockStudent.studentName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    
    const studentData = {
      id: mockStudent.admissionNo,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@bmi.edu`,
      phone: '+254 700 000 000',
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      faculty: 'Theology',
      department: 'Biblical Studies',
      academicLevel: 'Diploma',
      admissionYear: '2024',
      status: 'Active',
      gpa: 0
    };
    
    await pb.collection('students').create(studentData);
    console.log(`  ✓ Created student: ${mockStudent.studentName} (${mockStudent.admissionNo})`);
    return true;
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      console.log(`  ⚠ Student already exists: ${mockStudent.admissionNo}`);
      return true; // Not a failure
    }
    console.error(`  ✗ Failed to create student: ${err.message}`);
    return false;
  }
}

async function insertExamRecord(pb: PocketBase, mockStudent: MockStudent) {
  try {
    const recordData: any = {
      admissionNo: mockStudent.admissionNo,
      studentName: mockStudent.studentName,
      ...mockStudent.grades
    };
    
    await pb.collection('exams_grades').create(recordData);
    console.log(`  ✓ Created exam record for: ${mockStudent.studentName} (${Object.keys(mockStudent.grades).length} grades)`);
    return true;
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      console.log(`  ⚠ Exam record already exists for: ${mockStudent.admissionNo}`);
      return true;
    }
    console.error(`  ✗ Failed to create exam record: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('BMI UMS - Create Mock Exam Data');
  console.log('=================================\n');
  
  // Generate mock students
  const mockStudents: MockStudent[] = [];
  
  // 5 students with 25 grades each
  console.log('Generating 5 students with 25 grades each...');
  for (let i = 0; i < 5; i++) {
    mockStudents.push(createMockStudent(i, 25));
  }
  
  // 2 students with 12 grades each
  console.log('Generating 2 students with 12 grades each...');
  for (let i = 5; i < 7; i++) {
    mockStudents.push(createMockStudent(i, 12));
  }
  
  // 2 students with 18 grades each
  console.log('Generating 2 students with 18 grades each...');
  for (let i = 7; i < 9; i++) {
    mockStudents.push(createMockStudent(i, 18));
  }
  
  console.log(`\n✓ Generated ${mockStudents.length} mock students`);
  console.log(`  - 5 students with 25 grades`);
  console.log(`  - 2 students with 12 grades`);
  console.log(`  - 2 students with 18 grades`);
  console.log(`  Total grades: ${mockStudents.reduce((sum, s) => sum + s.courses.length, 0)}\n`);
  
  try {
    // Connect to PocketBase
    const pb = getPocketBase();
    await authenticateAdmin(pb);
    
    // Create collections
    await createStudentsCollection(pb);
    await createExamsCollection(pb);
    
    // Insert data
    console.log('\nInserting students...');
    let studentSuccess = 0;
    for (const student of mockStudents) {
      if (await insertStudent(pb, student)) {
        studentSuccess++;
      }
    }
    
    console.log('\nInserting exam records...');
    let examSuccess = 0;
    for (const student of mockStudents) {
      if (await insertExamRecord(pb, student)) {
        examSuccess++;
      }
    }
    
    console.log('\n=================================');
    console.log('Summary:');
    console.log(`  Students created: ${studentSuccess}/${mockStudents.length}`);
    console.log(`  Exam records created: ${examSuccess}/${mockStudents.length}`);
    console.log('\n✓ Mock data creation complete!');
    
  } catch (error: any) {
    console.error('\n✗ Failed:', error.message);
    process.exit(1);
  }
}

main();
