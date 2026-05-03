/**
 * Test both old and new PocketBase authentication APIs
 */

import PocketBase from 'pocketbase';

const PB_URL = 'http://127.0.0.1:8090';
const ADMIN_EMAIL = 'admin@bmi.edu';
const ADMIN_PASSWORD = 'BMIAdmin2024Secure';

async function testBothAPIs() {
  console.log('🔍 Testing Both PocketBase APIs');
  console.log('================================\n');
  
  const pb = new PocketBase(PB_URL);
  
  // Test 1: New API (_superusers)
  console.log('Test 1: New API (_superusers collection)');
  console.log('----------------------------------------');
  try {
    const authData = await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ SUCCESS with _superusers!');
    console.log('   Admin ID:', authData.record.id);
    console.log('   Admin Email:', authData.record.email);
    console.log('');
  } catch (error: any) {
    console.log('❌ FAILED with _superusers');
    console.log('   Status:', error.status);
    console.log('   Message:', error.message);
    console.log('   Response:', JSON.stringify(error.response || {}, null, 2));
    console.log('');
  }
  
  // Test 2: Old API (admins)
  console.log('Test 2: Old API (admins endpoint)');
  console.log('----------------------------------');
  try {
    const authData = await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ SUCCESS with admins!');
    console.log('   Admin ID:', authData.admin.id);
    console.log('   Admin Email:', authData.admin.email);
    console.log('');
  } catch (error: any) {
    console.log('❌ FAILED with admins');
    console.log('   Status:', error.status);
    console.log('   Message:', error.message);
    console.log('   Response:', JSON.stringify(error.response || {}, null, 2));
    console.log('');
  }
  
  // Test 3: Direct fetch to _superusers
  console.log('Test 3: Direct fetch to _superusers');
  console.log('------------------------------------');
  try {
    const response = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS with direct fetch!');
      console.log('   Token:', data.token?.substring(0, 30) + '...');
      console.log('   Admin ID:', data.record?.id);
    } else {
      console.log('❌ FAILED with direct fetch');
      console.log('   Status:', response.status);
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
    console.log('');
  } catch (error: any) {
    console.log('❌ ERROR with direct fetch:', error.message);
    console.log('');
  }
  
  // Test 4: Direct fetch to admins
  console.log('Test 4: Direct fetch to admins');
  console.log('-------------------------------');
  try {
    const response = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS with direct fetch to admins!');
      console.log('   Token:', data.token?.substring(0, 30) + '...');
      console.log('   Admin ID:', data.admin?.id);
    } else {
      console.log('❌ FAILED with direct fetch to admins');
      console.log('   Status:', response.status);
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
    console.log('');
  } catch (error: any) {
    console.log('❌ ERROR with direct fetch to admins:', error.message);
    console.log('');
  }
}

testBothAPIs();
