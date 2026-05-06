/**
 * Test with a simple password to rule out special character issues
 */

import PocketBase from 'pocketbase';

const PB_URL = 'http://127.0.0.1:8090';
const ADMIN_EMAIL = 'admin@bmi.edu';

// Test with the actual password from .env
const ACTUAL_PASSWORD = 'BMI@Admin2024!';

// Also test with a simple password
const SIMPLE_PASSWORD = 'admin123456';

async function testPasswords() {
  console.log('🔍 Testing Different Passwords');
  console.log('==============================\n');
  
  const pb = new PocketBase(PB_URL);
  
  // Test 1: Actual password
  console.log('Test 1: Actual password from .env');
  console.log('----------------------------------');
  console.log('Password:', ACTUAL_PASSWORD);
  try {
    const authData = await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ACTUAL_PASSWORD);
    console.log('✅ SUCCESS!');
    console.log('   Admin ID:', authData.record.id);
    console.log('');
    return;
  } catch (error: any) {
    console.log('❌ FAILED');
    console.log('   Message:', error.message);
    console.log('');
  }
  
  // Test 2: Simple password
  console.log('Test 2: Simple password');
  console.log('-----------------------');
  console.log('Password:', SIMPLE_PASSWORD);
  try {
    const authData = await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, SIMPLE_PASSWORD);
    console.log('✅ SUCCESS!');
    console.log('   Admin ID:', authData.record.id);
    console.log('');
    console.log('⚠️  The admin password is:', SIMPLE_PASSWORD);
    console.log('   Update backend/.env to match this password');
    console.log('');
  } catch (error: any) {
    console.log('❌ FAILED');
    console.log('   Message:', error.message);
    console.log('');
  }
  
  // Test 3: Try without special characters
  const NO_SPECIAL = 'BMIAdmin2024';
  console.log('Test 3: Without special characters');
  console.log('-----------------------------------');
  console.log('Password:', NO_SPECIAL);
  try {
    const authData = await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, NO_SPECIAL);
    console.log('✅ SUCCESS!');
    console.log('   Admin ID:', authData.record.id);
    console.log('');
    console.log('⚠️  The admin password is:', NO_SPECIAL);
    console.log('   Update backend/.env to match this password');
    console.log('');
  } catch (error: any) {
    console.log('❌ FAILED');
    console.log('   Message:', error.message);
    console.log('');
  }
  
  console.log('💡 Suggestion:');
  console.log('   The admin user might not exist or has a different password.');
  console.log('   Try accessing PocketBase admin UI:');
  console.log('   http://127.0.0.1:8090/_/');
  console.log('');
}

testPasswords();
