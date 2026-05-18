#!/usr/bin/env tsx
/**
 * Test Campuses API
 */

const API_URL = 'http://127.0.0.1:3001';
const ADMIN_EMAIL = 'admin@bmi.edu';
const ADMIN_PASSWORD = (process.env.POCKETBASE_ADMIN_PASSWORD ?? '');

async function testCampusesAPI() {
  console.log('🧪 Testing Campuses API...\n');
  
  try {
    // 1. Login to get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });
    
    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.data.accessToken;
    console.log('✅ Logged in successfully\n');
    
    // 2. Get all campuses
    console.log('2️⃣ Fetching all campuses...');
    const campusesResponse = await fetch(`${API_URL}/api/v1/campuses/all`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!campusesResponse.ok) {
      throw new Error('Failed to fetch campuses');
    }
    
    const campusesData = await campusesResponse.json();
    console.log(`✅ Found ${campusesData.data.length} campuses:\n`);
    
    campusesData.data.forEach((campus: any, index: number) => {
      console.log(`   ${index + 1}. ${campus.name} (${campus.code}) - ${campus.location}`);
    });
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🎉 CAMPUSES API TEST PASSED!');
    console.log('═══════════════════════════════════════════════════\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testCampusesAPI();
