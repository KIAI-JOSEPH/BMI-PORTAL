import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function test() {
  try {
    console.log('Testing PocketBase authentication...');
    console.log('PocketBase URL:', pb.baseUrl);
    
    // Try admin auth
    const authData = await pb.admins.authWithPassword('admin@bmi.edu', 'BMIAdmin2024Secure');
    console.log('✅ Admin authentication successful!');
    console.log('Admin:', authData.admin.email);
    console.log('Token:', authData.token.substring(0, 20) + '...');
    
  } catch (error: any) {
    console.error('❌ Authentication failed:', error.message);
    console.error('Status:', error.status);
    console.error('Response:', error.response);
  }
}

test();
