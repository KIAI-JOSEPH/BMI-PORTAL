import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

async function run() {
    try {
        const authData = await pb.admins.authWithPassword('admin@bmi.edu', 'BMIAdmin2024Secure');
        console.log('Admin logged in');
        
        try {
            const user = await pb.collection('users').getFirstListItem('email="admin@bmi.edu"');
            await pb.collection('users').update(user.id, { isActive: true });
            console.log('Admin user record activated');
        } catch (e) {
            await pb.collection('users').create({
                email: 'admin@bmi.edu',
                password: 'BMIAdmin2024Secure',
                passwordConfirm: 'BMIAdmin2024Secure',
                isActive: true,
                role: 'admin',
                name: 'System Admin'
            });
            console.log('Admin user record created');
        }
    } catch (err) {
        console.error('Failed to fix admin:', err);
    }
}
run();
