import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');
    try {
        console.log('Authenticating...');
        await pb.collection('_superusers').authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || 'admin@bmi.edu',
            process.env.POCKETBASE_ADMIN_PASSWORD || 'BMIAdmin2024Secure'
        );
        console.log('Authenticated!');
        
        console.log('Fetching staff...');
        const staff = await pb.collection('staff').getList(1, 1);
        console.log('Staff count:', staff.totalItems);
        
        console.log('Fetching users...');
        const users = await pb.collection('users').getList(1, 1);
        console.log('Users count:', users.totalItems);
        
        console.log('Success!');
    } catch (e: any) {
        console.error('Test failed:', e.message);
        if (e.data) console.error('Error data:', JSON.stringify(e.data));
    }
}

test();
