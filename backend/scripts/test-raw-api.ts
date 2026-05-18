// Test PocketBase admin authentication using raw HTTP requests
// to see what endpoint actually works

async function testEndpoint(url: string, body: any) {
  console.log(`\n🔍 Testing: ${url}`);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('   ✅ SUCCESS!');
      return true;
    }
  } catch (error: any) {
    console.log(`   ❌ Error:`, error.message);
  }
  return false;
}

async function main() {
  const baseUrl = 'http://127.0.0.1:8090';
  const credentials = {
    identity: 'admin@bmi.edu',
    password: (process.env.POCKETBASE_ADMIN_PASSWORD ?? ''),
  };
  
  console.log('Testing different admin authentication endpoints...');
  console.log('Credentials:', credentials);
  
  // Test various possible endpoints
  const endpoints = [
    '/api/admins/auth-with-password',
    '/api/admin/auth-with-password',
    '/api/admins/auth',
    '/api/admin/auth',
    '/api/admins/login',
    '/api/admin/login',
  ];
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(baseUrl + endpoint, credentials);
    if (success) {
      console.log('\n✅ Found working endpoint:', endpoint);
      break;
    }
  }
  
  // Also test with email/password instead of identity/password
  console.log('\n\n🔍 Testing with email/password fields...');
  const altCredentials = {
    email: 'admin@bmi.edu',
    password: (process.env.POCKETBASE_ADMIN_PASSWORD ?? ''),
  };
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(baseUrl + endpoint, altCredentials);
    if (success) {
      console.log('\n✅ Found working endpoint:', endpoint);
      break;
    }
  }
}

main();
