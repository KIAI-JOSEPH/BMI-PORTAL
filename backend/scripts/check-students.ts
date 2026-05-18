/**
 * Check students in database
 */

const PB_URL = 'http://127.0.0.1:8090';
const ADMIN_EMAIL = 'admin@bmi.edu';
const ADMIN_PASSWORD = (process.env.POCKETBASE_ADMIN_PASSWORD ?? '');

async function checkStudents() {
  console.log('🔍 Checking students in database');
  console.log('=================================\n');
  
  // Authenticate
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
  
  // Fetch students
  const response = await fetch(`${PB_URL}/api/collections/students/records?perPage=500`, {
    headers: { 'Authorization': token },
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Failed to fetch students:', error);
    process.exit(1);
  }
  
  const data = await response.json();
  console.log(`📊 Total students: ${data.totalItems}`);
  
  if (data.items && data.items.length > 0) {
    console.log('\n📋 First 10 students:');
    for (let i = 0; i < Math.min(10, data.items.length); i++) {
      const s = data.items[i];
      console.log(`   ${i + 1}. ${s.firstName} ${s.lastName} (${s.id}) - ${s.email}`);
    }
  } else {
    console.log('\n⚠️  No students found in database');
  }
}

checkStudents().catch(console.error);
