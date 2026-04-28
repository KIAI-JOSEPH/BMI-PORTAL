#!/usr/bin/env node
/**
 * BMI UMS - Database Seeding Script
 * Creates the first admin user using superuser credentials
 */

const http = require('http');

const POCKETBASE_URL = '127.0.0.1';
const POCKETBASE_PORT = 8090;
const ADMIN_EMAIL = 'admin@bmi.edu';
const ADMIN_PASSWORD = 'adminpass123';

const NEW_USER = {
  email: 'admin@bmi.edu',
  password: 'BMI@Admin2024!',
  passwordConfirm: 'BMI@Admin2024!',
  name: 'System Administrator',
  role: 'admin',
  department: 'IT Administration',
  isActive: true,
  emailVisibility: false,
};

// Helper function for HTTP requests
function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: POCKETBASE_URL,
      port: POCKETBASE_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
          });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function seedAdmin() {
  console.log('🔧 BMI UMS - Database Seeding');
  console.log('================================\n');

  try {
    // Step 1: Authenticate as superuser
    console.log('Step 1: Authenticating as superuser...');
    const authRes = await request(
      'POST',
      '/api/admins/auth-with-password',
      {},
      { identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    );

    if (authRes.status !== 200 || !authRes.data.token) {
      console.error('❌ Superuser authentication failed');
      console.error('   Status:', authRes.status);
      console.error('   Response:', authRes.data);
      console.log('\n💡 To fix:');
      console.log('   1. Ensure PocketBase is running: make start');
      console.log('   2. Create superuser: ./bin/pocketbase superuser create admin@bmi.edu adminpass123');
      process.exit(1);
    }

    const adminToken = authRes.data.token;
    console.log('✅ Superuser authenticated\n');

    // Step 2: Check if user already exists
    console.log('Step 2: Checking for existing user...');
    const listRes = await request(
      'GET',
      `/api/collections/users/records?filter=(email='${NEW_USER.email}')`,
      { Authorization: adminToken }
    );

    if (listRes.data.items && listRes.data.items.length > 0) {
      console.log('ℹ️  User already exists:', listRes.data.items[0].id);
      console.log('\n✅ Admin user is ready!');
      console.log('\n📧 Login Credentials:');
      console.log('   Email:    admin@bmi.edu');
      console.log('   Password: BMI@Admin2024!');
      console.log('   URL:      http://localhost:3000');
      return;
    }
    console.log('✅ No existing user found\n');

    // Step 3: Create the admin user
    console.log('Step 3: Creating admin user...');
    const createRes = await request(
      'POST',
      '/api/collections/users/records',
      { Authorization: adminToken },
      NEW_USER
    );

    if (createRes.status !== 200) {
      console.error('❌ Failed to create user');
      console.error('   Status:', createRes.status);
      console.error('   Response:', createRes.data);
      process.exit(1);
    }

    console.log('✅ Admin user created:', createRes.data.id);

    // Step 4: Verify login works
    console.log('\nStep 4: Verifying login...');
    const verifyRes = await request(
      'POST',
      '/api/collections/users/auth-with-password',
      {},
      { identity: NEW_USER.email, password: NEW_USER.password }
    );

    if (verifyRes.status === 200 && verifyRes.data.token) {
      console.log('✅ Login verification successful!\n');
    } else {
      console.log('⚠️  Login verification returned status:', verifyRes.status);
    }

    console.log('================================');
    console.log('✅ DATABASE SEEDED SUCCESSFULLY');
    console.log('================================');
    console.log('\n📧 Login Credentials:');
    console.log('   Email:    admin@bmi.edu');
    console.log('   Password: BMI@Admin2024!');
    console.log('   URL:      http://localhost:3000');
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedAdmin();
