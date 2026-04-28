#!/usr/bin/env tsx
/**
 * BMI UMS - Create First Admin User
 * Run this to create the initial administrator account
 */

import PocketBase from 'pocketbase';
import bcrypt from 'bcryptjs';

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';

// Default admin credentials (change these after first login!)
const DEFAULT_ADMIN = {
  email: 'admin@bmi.edu',
  password: 'BMI@Admin2024!',
  name: 'System Administrator',
  role: 'admin',
  department: 'IT Administration',
  isActive: true,
};

async function createAdmin() {
  console.log('🔧 BMI UMS - Create First Admin User');
  console.log(`Connecting to PocketBase at ${PB_URL}...`);
  
  const pb = new PocketBase(PB_URL);
  
  try {
    // Check if users collection exists, create it if not
    try {
      await pb.collections.getOne('users');
      console.log('✅ Users collection exists');
    } catch {
      console.log('⚠️  Users collection not found. Please run database migrations first:');
      console.log('   cd ~/bmi-ums && make migrate');
      process.exit(1);
    }
    
    // Check if admin already exists
    try {
      const existing = await pb.collection('users').getFirstListItem(`email="${DEFAULT_ADMIN.email}"`);
      console.log('ℹ️  Admin user already exists:');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Name: ${existing.name}`);
      console.log(`   Role: ${existing.role}`);
      console.log('\n✅ You can login with existing credentials');
      return;
    } catch {
      // Admin doesn't exist, create it
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 12);
    
    // Create admin user directly in database
    const admin = await pb.collection('users').create({
      email: DEFAULT_ADMIN.email,
      password: DEFAULT_ADMIN.password, // PocketBase will hash this
      passwordConfirm: DEFAULT_ADMIN.password,
      name: DEFAULT_ADMIN.name,
      role: DEFAULT_ADMIN.role,
      department: DEFAULT_ADMIN.department,
      isActive: DEFAULT_ADMIN.isActive,
      emailVisibility: false,
    });
    
    console.log('\n✅ Admin user created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('   Email:    admin@bmi.edu');
    console.log('   Password: BMI@Admin2024!');
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');
    console.log('\n🔗 Login at: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    
    // If we get auth error, we need to use admin token
    if (error instanceof Error && error.message.includes('auth')) {
      console.log('\n💡 To create an admin user manually:');
      console.log('   1. Open http://127.0.0.1:8090/_/');
      console.log('   2. Click "New admin" to create admin account');
      console.log('   3. Go to Collections → users');
      console.log('   4. Create a new user with role "admin"');
    }
    
    process.exit(1);
  }
}

createAdmin();
