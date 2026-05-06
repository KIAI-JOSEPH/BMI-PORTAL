#!/usr/bin/env tsx
/**
 * Check what role the admin user has in PocketBase
 */

import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'http://127.0.0.1:8090';
const ADMIN_EMAIL = 'admin@bmi.edu';
const ADMIN_PASSWORD = 'BMIAdmin2024Secure';

async function checkUserRole() {
  console.log('🔍 Checking User Role in PocketBase...\n');
  
  const pb = new PocketBase(POCKETBASE_URL);
  pb.autoCancellation(false);
  
  try {
    // Authenticate as admin using direct HTTP call
    console.log('1️⃣ Authenticating as PocketBase admin...');
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
      throw new Error(error.message || 'Authentication failed');
    }
    
    const authData = await authResponse.json();
    pb.authStore.save(authData.token, authData.admin);
    console.log('✅ Admin authenticated\n');
    
    // Check if users collection exists
    console.log('2️⃣ Checking users collection...');
    const users = await pb.collection('users').getList(1, 50);
    console.log(`✅ Found ${users.totalItems} users\n`);
    
    if (users.totalItems === 0) {
      console.log('⚠️  No users found in the users collection!');
      console.log('   This means there are no application users (only PocketBase admin exists)');
      console.log('\n📝 To fix this, you need to create an application user with admin role:');
      console.log('   1. Open http://localhost:8090/_/');
      console.log('   2. Go to Collections → users');
      console.log('   3. Click "New record"');
      console.log('   4. Fill in:');
      console.log('      - email: admin@bmi.edu');
      console.log('      - password: BMIAdmin2024Secure');
      console.log('      - passwordConfirm: BMIAdmin2024Secure');
      console.log('      - name: System Administrator');
      console.log('      - role: admin');
      console.log('      - isActive: true');
      console.log('      - verified: true');
      return;
    }
    
    // List all users and their roles
    console.log('3️⃣ User accounts found:');
    console.log('─'.repeat(80));
    users.items.forEach((user: any, index: number) => {
      console.log(`${index + 1}. ${user.email || user.username || 'No email'}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`   Verified: ${user.verified ? 'Yes' : 'No'}`);
      console.log('─'.repeat(80));
    });
    
    // Check if admin@bmi.edu exists
    console.log('\n4️⃣ Checking for admin@bmi.edu...');
    const adminUser = users.items.find((u: any) => u.email === ADMIN_EMAIL);
    
    if (!adminUser) {
      console.log('❌ User admin@bmi.edu NOT FOUND in users collection!');
      console.log('\n📝 This is the problem! The backend expects a user record with:');
      console.log('   - email: admin@bmi.edu');
      console.log('   - role: admin or registrar');
      console.log('\n   But only the PocketBase admin exists (which is different).');
      console.log('\n🔧 Solution: Create an application user as shown above.');
    } else {
      console.log('✅ Found admin@bmi.edu');
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Active: ${adminUser.isActive}`);
      
      if (adminUser.role !== 'admin' && adminUser.role !== 'registrar') {
        console.log(`\n⚠️  WARNING: User role is '${adminUser.role}' but needs to be 'admin' or 'registrar' to create students!`);
      } else {
        console.log('\n✅ User has correct role for creating students!');
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.data) {
      console.error('   Data:', error.data);
    }
  }
}

checkUserRole();
