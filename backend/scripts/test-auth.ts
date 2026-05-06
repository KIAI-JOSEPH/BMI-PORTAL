/**
 * BMI UMS - Test Authentication
 * Debug script to test PocketBase authentication
 */

import PocketBase from 'pocketbase';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
config({ path: resolve(__dirname, '../.env') });

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@bmi.edu';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'BMI@Admin2024!';

async function testAuth() {
  try {
    console.log('🔍 BMI UMS - Authentication Debug');
    console.log('==================================\n');
    
    console.log('Environment Variables:');
    console.log(`  PB_URL: ${PB_URL}`);
    console.log(`  ADMIN_EMAIL: ${ADMIN_EMAIL}`);
    console.log(`  ADMIN_PASSWORD: ${ADMIN_PASSWORD ? '***' + ADMIN_PASSWORD.slice(-4) : 'NOT SET'}\n`);
    
    const pb = new PocketBase(PB_URL);
    
    console.log('Testing PocketBase connection...');
    
    // Test 1: Check if PocketBase is reachable
    try {
      const health = await fetch(`${PB_URL}/api/health`);
      console.log(`✅ PocketBase is reachable (status: ${health.status})\n`);
    } catch (error: any) {
      console.error(`❌ Cannot reach PocketBase: ${error.message}\n`);
      process.exit(1);
    }
    
    // Test 2: Try to authenticate (PocketBase 0.22+ uses _superusers collection)
    console.log('Attempting admin authentication...');
    console.log(`  Email: ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}\n`);
    
    try {
      const authData = await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log('✅ Authentication successful!\n');
      console.log('Auth Data:');
      console.log(`  Token: ${authData.token.substring(0, 20)}...`);
      console.log(`  Admin ID: ${authData.record.id}`);
      console.log(`  Admin Email: ${authData.record.email}\n`);
      
      // Test 3: Try to fetch students
      console.log('Testing database access...');
      const students = await pb.collection('students').getList(1, 1);
      console.log(`✅ Database access successful! Found ${students.totalItems} students\n`);
      
    } catch (error: any) {
      console.error('❌ Authentication failed!\n');
      console.error('Error details:');
      console.error(`  Message: ${error.message}`);
      console.error(`  Status: ${error.status || 'N/A'}`);
      console.error(`  Response: ${JSON.stringify(error.response || {}, null, 2)}\n`);
      
      console.log('Troubleshooting:');
      console.log('1. Check if admin user exists:');
      console.log(`   ./bin/pocketbase superuser list\n`);
      console.log('2. Create/update admin user:');
      console.log(`   ./bin/pocketbase superuser upsert "${ADMIN_EMAIL}" "${ADMIN_PASSWORD}"\n`);
      console.log('3. Check PocketBase logs:');
      console.log(`   tail -f logs/pocketbase.log\n`);
      
      process.exit(1);
    }
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAuth();
