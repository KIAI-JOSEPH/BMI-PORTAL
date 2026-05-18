#!/usr/bin/env tsx
/**
 * Check the students collection schema
 */

import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'http://127.0.0.1:8090';
const ADMIN_EMAIL = 'admin@bmi.edu';
const ADMIN_PASSWORD = (process.env.POCKETBASE_ADMIN_PASSWORD ?? '');

async function checkSchema() {
  console.log('🔍 Checking Students Collection Schema...\n');
  
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
    
    // Get collection schema
    const collection = await pb.collections.getOne('students');
    
    console.log('📋 Students Collection Schema:\n');
    console.log(`Collection ID: ${collection.id}`);
    console.log(`Collection Name: ${collection.name}`);
    console.log(`Collection Type: ${collection.type}\n`);
    
    console.log('Fields:');
    console.log('─'.repeat(80));
    
    if (collection.schema && collection.schema.length > 0) {
      collection.schema.forEach((field: any) => {
        console.log(`${field.name}`);
        console.log(`  Type: ${field.type}`);
        console.log(`  Required: ${field.required || false}`);
        if (field.options) {
          console.log(`  Options: ${JSON.stringify(field.options)}`);
        }
        console.log('');
      });
    } else {
      console.log('⚠️  No schema fields defined!\n');
    }
    
    // Check for required fields
    const requiredFields = [
      'firstName', 'lastName', 'gender', 'faculty', 'department', 
      'careerPath', 'academicLevel', 'admissionYear', 'enrollmentTerm',
      'status', 'standing', 'gpa', 'avatarColor', 'studentId'
    ];
    
    const existingFields = collection.schema?.map((f: any) => f.name) || [];
    const missingFields = requiredFields.filter(f => !existingFields.includes(f));
    
    if (missingFields.length > 0) {
      console.log('⚠️  Missing required fields:');
      missingFields.forEach(f => console.log(`   - ${f}`));
      console.log('');
    } else {
      console.log('✅ All required fields are present\n');
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }
  }
}

checkSchema();
