/**
 * BMI UMS - Direct API Test
 * Test PocketBase API directly with fetch to see what's happening
 */

const PB_URL = 'http://127.0.0.1:8090';
const ADMIN_EMAIL = 'admin@bmi.edu';
const ADMIN_PASSWORD = 'BMI@Admin2024!';

async function testDirectAPI() {
  console.log('🔍 Testing PocketBase Direct API');
  console.log('=================================\n');
  
  // Test 1: Health check
  console.log('1. Testing health endpoint...');
  try {
    const healthRes = await fetch(`${PB_URL}/api/health`);
    console.log(`   Health: ${healthRes.status} ${healthRes.statusText}`);
    const healthData = await healthRes.json();
    console.log(`   Response: ${JSON.stringify(healthData)}\n`);
  } catch (error: any) {
    console.error(`   ❌ Health check failed: ${error.message}\n`);
    process.exit(1);
  }
  
  // Test 2: Try _superusers collection
  console.log('2. Testing _superusers auth endpoint...');
  try {
    const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });
    
    console.log(`   Status: ${authRes.status} ${authRes.statusText}`);
    const authData = await authRes.json();
    console.log(`   Response: ${JSON.stringify(authData)}\n`);
    
    if (authRes.ok) {
      console.log('✅ SUCCESS! Authentication worked via direct API!');
      console.log(`   Token: ${authData.token?.substring(0, 30)}...`);
      console.log(`   Admin ID: ${authData.record?.id}`);
    } else {
      console.log('❌ FAILED via direct API');
      console.log(`   Error: ${authData.message || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error(`   ❌ Direct API test failed: ${error.message}\n`);
  }
  
  // Test 3: Try old admins endpoint
  console.log('3. Testing old admins auth endpoint...');
  try {
    const authRes = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });
    
    console.log(`   Status: ${authRes.status} ${authRes.statusText}`);
    const authData = await authRes.json();
    console.log(`   Response: ${JSON.stringify(authData)}\n`);
    
    if (authRes.ok) {
      console.log('✅ SUCCESS! Old API works!');
    } else {
      console.log('❌ Old API also failed');
    }
  } catch (error: any) {
    console.error(`   ❌ Old API test failed: ${error.message}\n`);
  }
}

testDirectAPI();