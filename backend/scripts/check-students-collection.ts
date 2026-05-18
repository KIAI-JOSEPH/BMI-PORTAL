/**
 * Check Students Collection
 * Verifies the students collection exists and can be accessed
 */

import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@bmi.edu';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || (process.env.POCKETBASE_ADMIN_PASSWORD ?? '');

async function checkStudentsCollection() {
  const pb = new PocketBase(POCKETBASE_URL);

  try {
    console.log('🔐 Authenticating as admin...');
    
    // Authenticate using the correct endpoint for PocketBase 0.22
    const authResponse = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (!authResponse.ok) {
      const error = await authResponse.json();
      throw new Error(`Auth failed: ${JSON.stringify(error)}`);
    }

    const authData = await authResponse.json();
    pb.authStore.save(authData.token, authData.admin);
    
    console.log('✅ Authenticated successfully');
    console.log('');

    // Check if students collection exists
    console.log('📋 Checking students collection...');
    const collections = await pb.collections.getList(1, 100);
    const studentsCollection = collections.items.find(c => c.name === 'students');

    if (!studentsCollection) {
      console.log('❌ Students collection does NOT exist!');
      console.log('');
      console.log('Available collections:');
      collections.items.forEach(c => console.log(`  - ${c.name}`));
      return;
    }

    console.log('✅ Students collection exists');
    console.log('');

    // Try to fetch students
    console.log('👥 Fetching students...');
    const students = await pb.collection('students').getList(1, 1000);
    
    console.log(`✅ Successfully fetched ${students.totalItems} students`);
    console.log('');
    
    if (students.totalItems > 0) {
      console.log('Sample student:');
      const sample = students.items[0];
      console.log(`  ID: ${sample.id}`);
      console.log(`  Name: ${sample.firstName} ${sample.lastName}`);
      console.log(`  Email: ${sample.email}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

checkStudentsCollection();
