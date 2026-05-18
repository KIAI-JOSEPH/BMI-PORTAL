#!/usr/bin/env tsx
/**
 * Check what students are actually in the database
 */

import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'http://127.0.0.1:8090';
const ADMIN_EMAIL = 'admin@bmi.edu';
const ADMIN_PASSWORD = (process.env.POCKETBASE_ADMIN_PASSWORD ?? '');

async function checkStudents() {
  console.log('🔍 Checking Students in Database...\n');
  
  const pb = new PocketBase(POCKETBASE_URL);
  pb.autoCancellation(false);
  
  try {
    // Authenticate
    const authResponse = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });
    
    if (!authResponse.ok) {
      throw new Error('Authentication failed');
    }
    
    const authData = await authResponse.json();
    pb.authStore.save(authData.token, authData.admin);
    
    // Get all students
    const students = await pb.collection('students').getFullList();
    
    console.log(`📊 Total students in database: ${students.length}\n`);
    
    if (students.length === 0) {
      console.log('❌ No students found in database!');
      console.log('   The student you created may have been lost.\n');
    } else {
      console.log('✅ Students found:\n');
      students.forEach((student: any, index: number) => {
        console.log(`${index + 1}. ${student.firstName} ${student.lastName}`);
        console.log(`   ID: ${student.id}`);
        console.log(`   Email: ${student.email || 'N/A'}`);
        console.log(`   Phone: ${student.phone || 'N/A'}`);
        console.log(`   Faculty: ${student.faculty}`);
        console.log(`   Status: ${student.status}`);
        console.log(`   Created: ${student.created}`);
        console.log('');
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

checkStudents();
