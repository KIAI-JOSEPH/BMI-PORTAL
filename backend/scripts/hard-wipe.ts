const PB_URL = 'http://127.0.0.1:8090';

async function run() {
    try {
        const authRes = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: 'admin@bmi.edu', password: 'BMIAdmin2024Secure' })
        });
        const authData = await authRes.json();
        const token = authData.token;

        const collections = ['academic_records', 'grades', 'enrollments', 'students', 'courses', 'modules', 'campuses', 'staff'];
        
        for (const coll of collections) {
            console.log(`Wiping ${coll}...`);
            let hasMore = true;
            while (hasMore) {
                const listRes = await fetch(`${PB_URL}/api/collections/${coll}/records?perPage=200`, {
                    headers: { 'Authorization': token }
                });
                const listData = await listRes.json();
                if (!listData.items || listData.items.length === 0) {
                    hasMore = false;
                    break;
                }
                
                console.log(`Deleting batch of ${listData.items.length} from ${coll}...`);
                for (const r of listData.items) {
                    await fetch(`${PB_URL}/api/collections/${coll}/records/${r.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': token }
                    });
                }
            }
        }
        console.log('✨ All targeted collections wiped!');
    } catch (e) {
        console.error('❌ Error:', e);
    }
}
run();
