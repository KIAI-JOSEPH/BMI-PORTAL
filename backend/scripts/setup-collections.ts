/**
 * Setup PocketBase collections
 */

const PB_URL = 'http://127.0.0.1:8090';
const ADMIN_EMAIL = 'admin@bmi.edu';
const ADMIN_PASSWORD = 'BMIAdmin2024Secure';

async function setupCollections() {
  console.log('🚀 Setting up PocketBase collections');
  console.log('====================================\n');
  
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
  const token = authData.token;
  console.log('✅ Authenticated\n');
  
  // Check if students collection exists
  console.log('📋 Checking collections...');
  const collectionsResponse = await fetch(`${PB_URL}/api/collections`, {
    headers: { 'Authorization': token },
  });
  
  if (!collectionsResponse.ok) {
    console.error('❌ Failed to fetch collections');
    process.exit(1);
  }
  
  const collections = await collectionsResponse.json();
  const studentCollection = collections.items?.find((c: any) => c.name === 'students');
  
  if (studentCollection) {
    console.log('✅ Students collection exists');
    console.log(`   ID: ${studentCollection.id}`);
    console.log(`   Type: ${studentCollection.type}`);
    console.log(`   Fields: ${studentCollection.schema?.length || 0}`);
  } else {
    console.log('⚠️  Students collection does NOT exist');
    console.log('\n📝 Creating students collection...');
    
    const createResponse = await fetch(`${PB_URL}/api/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({
        name: 'students',
        type: 'base',
        schema: [
          { name: 'firstName', type: 'text', required: true },
          { name: 'lastName', type: 'text', required: true },
          { name: 'middleName', type: 'text' },
          { name: 'email', type: 'email', required: true },
          { name: 'phone', type: 'text', required: true },
          { name: 'gender', type: 'select', required: true, options: { values: ['Male', 'Female'] } },
          { name: 'nationality', type: 'text' },
          { name: 'faculty', type: 'text', required: true },
          { name: 'department', type: 'text', required: true },
          { name: 'careerPath', type: 'text', required: true },
          { name: 'academicLevel', type: 'select', required: true, options: { values: ['Certificate', 'Diploma', 'Degree', 'Masters', 'PhD'] } },
          { name: 'admissionYear', type: 'text', required: true },
          { name: 'enrollmentTerm', type: 'text', required: true },
          { name: 'status', type: 'select', required: true, options: { values: ['Active', 'Applicant', 'On Leave', 'Graduated', 'Suspended'] } },
          { name: 'standing', type: 'select', required: true, options: { values: ['Honor Roll', 'Good', 'Probation', 'Warning'] } },
          { name: 'gpa', type: 'number', required: true },
          { name: 'avatarColor', type: 'text', required: true },
          { name: 'photo', type: 'file', options: { maxSelect: 1, maxSize: 5242880 } },
          { name: 'photoZoom', type: 'number' },
          { name: 'photoPosition', type: 'json' },
        ],
      }),
    });
    
    if (!createResponse.ok) {
      const error = await createResponse.json();
      console.error('❌ Failed to create collection:', error);
      process.exit(1);
    }
    
    console.log('✅ Students collection created');
  }
  
  console.log('\n✅ Setup complete');
}

setupCollections().catch(console.error);
