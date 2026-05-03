/**
 * BMI UMS - Simple Auth Test
 * Test with hardcoded credentials to isolate the issue
 */

import PocketBase from 'pocketbase';

const PB_URL = 'http://127.0.0.1:8090';
const ADMIN_EMAIL = 'admin@bmi.edu';
const ADMIN_PASSWORD = 'BMI@Admin2024!';

async function testAuth() {
  console.log('🔍 Testing PocketBase Authentication');
  console.log('=====================================\n');
  
  console.log('URL:', PB_URL);
  console.log('Email:', ADMIN_EMAIL);
  console.log('Password:', ADMIN_PASSWORD);
  console.log('');
  
  const pb = new PocketBase(PB_URL);
  
  try {
    console.log('Attempting authentication with _superusers...');
    const authData = await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ SUCCESS! Authentication worked!\n');
    console.log('Admin ID:', authData.record.id);
    console.log('Admin Email:', authData.record.email);
    process.exit(0);
  } catch (error: any) {
    console.error('❌ FAILED with _superusers:', error.message);
    
    // Try old API as fallback
    try {
      console.log('\nTrying old admins API...');
      const authData = await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log('✅ SUCCESS with old API!\n');
      console.log('Admin ID:', authData.admin.id);
      process.exit(0);
    } catch (error2: any) {
      console.error('❌ Also failed with old API:', error2.message);
      process.exit(1);
    }
  }
}

testAuth();