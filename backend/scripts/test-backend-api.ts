// Test the backend API authentication endpoint

const BACKEND_URL = 'http://localhost:3001';

async function testBackendAPI() {
  console.log('🔍 Testing Backend API...\n');
  
  // Test health endpoint
  console.log('1. Testing health endpoint:');
  try {
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    console.log(`   Status: ${healthResponse.status}`);
    const healthData = await healthResponse.text();
    console.log(`   Response: ${healthData}`);
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test auth endpoint
  console.log('\n2. Testing auth/login endpoint:');
  try {
    const authResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@bmi.edu',
        password: 'BMIAdmin2024Secure',
      }),
    });
    console.log(`   Status: ${authResponse.status}`);
    const authData = await authResponse.json();
    console.log(`   Response:`, JSON.stringify(authData, null, 2));
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // List available endpoints
  console.log('\n3. Testing root endpoint:');
  try {
    const rootResponse = await fetch(`${BACKEND_URL}/`);
    console.log(`   Status: ${rootResponse.status}`);
    const rootData = await rootResponse.text();
    console.log(`   Response: ${rootData.substring(0, 200)}...`);
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

testBackendAPI().catch(console.error);
