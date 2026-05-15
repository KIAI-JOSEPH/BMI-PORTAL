async function run() {
    try {
        const authRes = await fetch('http://127.0.0.1:8090/api/admins/auth-with-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: 'admin@bmi.edu', password: 'BMIAdmin2024Secure' })
        });
        
        if (!authRes.ok) {
            console.error('Admin login failed:', await authRes.text());
            return;
        }
        
        const authData = await authRes.json();
        const token = authData.token;
        console.log('Admin logged in');
        
        // Check for user
        const listRes = await fetch('http://127.0.0.1:8090/api/collections/users/records?filter=email="admin@bmi.edu"', {
            headers: { 'Authorization': token }
        });
        const listData = await listRes.json();
        
        if (listData.totalItems > 0) {
            const user = listData.items[0];
            console.log('User found, updating...');
            await fetch(`http://127.0.0.1:8090/api/collections/users/records/${user.id}`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive: true })
            });
        } else {
            console.log('User not found, creating...');
            await fetch('http://127.0.0.1:8090/api/collections/users/records', {
                method: 'POST',
                headers: { 
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'admin@bmi.edu',
                    password: 'BMIAdmin2024Secure',
                    passwordConfirm: 'BMIAdmin2024Secure',
                    isActive: true,
                    role: 'admin',
                    name: 'System Admin'
                })
            });
        }
        console.log('✅ Done!');
    } catch (err) {
        console.error('Error:', err);
    }
}
run();
