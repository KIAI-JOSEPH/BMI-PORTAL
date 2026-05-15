import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function test() {
    try {
        const authData = await pb.collection('users').authWithPassword('admin@bmi.edu', 'BMIAdmin2024Secure');
        console.log('✅ Auth Success:', authData.record.id);
    } catch (err: any) {
        console.error('❌ Auth Failed:', err.status, err.message, JSON.stringify(err.data, null, 2));
    }
}

test();
