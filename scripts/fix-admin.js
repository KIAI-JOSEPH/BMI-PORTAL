const PocketBase = require('pocketbase').default;
const pb = new PocketBase('http://127.0.0.1:8090');

async function createUser() {
  try {
    // Check if user exists
    try {
      const existing = await pb.collection('users').getFirstListItem('email="admin@bmi.edu"');
      console.log('User already exists:', existing.id);
      console.log('Testing login...');
      const auth = await pb.collection('users').authWithPassword('admin@bmi.edu', 'BMI@Admin2024!');
      console.log('Login test: SUCCESS');
      return;
    } catch {
      // User doesn't exist, create it
    }

    console.log('Creating admin user...');
    const user = await pb.collection('users').create({
      email: 'admin@bmi.edu',
      password: 'BMI@Admin2024!',
      passwordConfirm: 'BMI@Admin2024!',
      name: 'System Administrator',
      role: 'admin',
      department: 'IT Administration',
      isActive: true,
      emailVisibility: false,
    });
    console.log('User created:', user.id);

    // Verify login works
    const auth = await pb.collection('users').authWithPassword('admin@bmi.edu', 'BMI@Admin2024!');
    console.log('Login test: SUCCESS');
  } catch (e) {
    console.error('Error:', e.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check if PocketBase is running: make status');
    console.log('2. Create admin at: http://127.0.0.1:8090/_/');
    console.log('3. Then run this script again');
  }
}

createUser();
