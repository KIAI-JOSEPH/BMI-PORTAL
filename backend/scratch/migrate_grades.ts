
import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'http://127.0.0.1:8090';
const ADMIN_EMAIL = 'admin@bmi.edu';
const ADMIN_PASSWORD = 'BMIAdmin2024Secure';

async function migrateGrades() {
  const pb = new PocketBase(POCKETBASE_URL);
  
  try {
    // 1. Authenticate manually
    const authResponse = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });

    if (!authResponse.ok) {
      throw new Error(`Admin auth failed: ${authResponse.statusText}`);
    }

    const authData: any = await authResponse.json();
    pb.authStore.save(authData.token, authData.admin);
    console.log('Authenticated as admin');

    // 2. Get enrollments collection ID
    const enrollmentsCol = await pb.collections.getOne('enrollments');
    const enrollmentsId = enrollmentsCol.id;

    // 3. Update grades collection schema
    const gradesCol = await pb.collections.getOne('grades');
    
    // Define new relational schema
    const newSchema = [
      {
        name: 'enrollment_id',
        type: 'relation',
        required: true,
        options: {
          collectionId: enrollmentsId,
          cascadeDelete: false,
          maxSelect: 1,
          minSelect: null
        }
      },
      {
        name: 'percentage',
        type: 'number',
        required: true,
        options: {
          min: 0,
          max: 100
        }
      },
      {
        name: 'grade_letter',
        type: 'text',
        required: true
      },
      {
        name: 'gpa',
        type: 'number',
        options: {
          min: 0,
          max: 4
        }
      }
    ];

    console.log('Updating grades collection schema to relational...');
    await pb.collections.update(gradesCol.id, {
      schema: newSchema
    });
    
    console.log('Migration complete. grades collection is now relational.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateGrades();
