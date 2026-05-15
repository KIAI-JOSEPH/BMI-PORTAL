import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

async function run() {
    try {
        console.log('Logging in...');
        await pb.admins.authWithPassword('admin@bmi.edu', 'BMIAdmin2024Secure');
        
        let user;
        try {
            user = await pb.collection('users').getFirstListItem('email="admin@bmi.edu"');
            console.log('User found, updating...');
            await pb.collection('users').update(user.id, {
                isActive: true,
                role: 'admin'
            });
        } catch (e) {
            console.log('User not found, creating...');
            await pb.collection('users').create({
                email: 'admin@bmi.edu',
                password: 'BMIAdmin2024Secure',
                passwordConfirm: 'BMIAdmin2024Secure',
                role: 'admin',
                isActive: true,
                name: 'System Admin'
            });
        }
        console.log('✅ Admin activation complete!');
    } catch (err: any) {
        console.error('❌ Error:', err.message);
        if (err.data) console.error(JSON.stringify(err.data, null, 2));
    }
}

run();
