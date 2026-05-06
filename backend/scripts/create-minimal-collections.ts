// Create minimal students and exams collections for import

const PB_URL = 'http://127.0.0.1:8090';
const ADMIN_EMAIL = 'admin@bmi.edu';
const ADMIN_PASSWORD = 'BMIAdmin2024Secure';

async function createCollections() {
  // Authenticate
  console.log('🔐 Authenticating...');
  const authResponse = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
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
  const token = authData.token;
  console.log('✅ Authenticated\n');
  
  // Create students collection
  console.log('📝 Creating students collection...');
  const studentsResponse = await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify({
      name: 'students',
      type: 'base',
      schema: [
        { name: 'firstName', type: 'text' },
        { name: 'lastName', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'dateOfBirth', type: 'text' },
        { name: 'gender', type: 'text' },
        { name: 'nationality', type: 'text' },
        { name: 'faculty', type: 'text' },
        { name: 'department', type: 'text' },
        { name: 'careerPath', type: 'text' },
        { name: 'academicLevel', type: 'text' },
        { name: 'yearOfStudy', type: 'number' },
        { name: 'enrollmentDate', type: 'text' },
        { name: 'status', type: 'text' },
      ],
    }),
  });
  
  if (!studentsResponse.ok) {
    const error = await studentsResponse.json();
    console.error('❌ Failed to create students collection:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Students collection created');
  }
  
  // Create exams collection
  console.log('\n📝 Creating exams collection...');
  const examsResponse = await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify({
      name: 'exams',
      type: 'base',
      schema: [
        { name: 'studentId', type: 'text' },
        { name: 'courseCode', type: 'text' },
        { name: 'courseName', type: 'text' },
        { name: 'term', type: 'text' },
        { name: 'score', type: 'number' },
        { name: 'grade', type: 'text' },
        { name: 'credits', type: 'number' },
        { name: 'examDate', type: 'text' },
      ],
    }),
  });
  
  if (!examsResponse.ok) {
    const error = await examsResponse.json();
    console.error('❌ Failed to create exams collection:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Exams collection created');
  }
  
  console.log('\n✅ Setup complete! You can now run the import script.');
}

createCollections().catch(console.error);
