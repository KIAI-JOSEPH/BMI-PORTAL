#!/usr/bin/env tsx
/**
 * Test PocketBase Admin Authentication
 */

import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'http://127.0.0.1:8090';
const ADMIN_EMAIL = 'admin@bmi.edu';
const ADMIN_PASSWORD = (process.env.POCKETBASE_ADMIN_PASSWORD ?? '');

async function testAuth() {
  console.log('🔐 Testing PocketBase Admin Authentication...\n');
  
  const pb = new PocketBase(POCKETBASE_URL);
  pb.autoCancellation(false);
  
  try {
    console.log(`📡 Connecting to: ${POCKETBASE_URL}`);
    console.log(`👤 Admin Email: ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD.substring(0, 3)}***\n`);
    
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    await pb.health.check();
    console.log('✅ Health check passed\n');
    
    // Test 2: Admin authentication
    console.log('2️⃣ Testing admin authentication...');
    const authData = await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Admin authentication successful!');
    console.log(`   Admin ID: ${authData.admin.id}`);
    console.log(`   Admin Email: ${authData.admin.email}`);
    console.log(`   Token: ${authData.token.substring(0, 20)}...\n`);
    
    // Test 3: List collections
    console.log('3️⃣ Testing collections access...');
    const collections = await pb.collections.getList(1, 50);
    console.log(`✅ Found ${collections.totalItems} collections:`);
    collections.items.forEach(col => {
      console.log(`   - ${col.name} (${col.type})`);
    });
    console.log();
    
    // Test 4: Check students collection
    console.log('4️⃣ Testing students collection...');
    try {
      const students = await pb.collection('students').getList(1, 1);
      console.log(`✅ Students collection exists (${students.totalItems} records)\n`);
    } catch (error: any) {
      console.log(`⚠️  Students collection issue: ${error.message}\n`);
    }
    
    console.log('🎉 All tests passed!');
    
  } catch (error: any) {
    console.error('❌ Authentication failed!');
    console.error(`   Error: ${error.message}`);
    console.error(`   Status: ${error.status}`);
    console.error(`   URL: ${error.url}`);
    console.error(`   Data:`, error.data);
    process.exit(1);
  }
}

testAuth();
