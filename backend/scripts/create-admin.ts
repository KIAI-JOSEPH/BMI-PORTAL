/**
 * BMI UMS - Create/Update Admin User
 * Creates or updates the admin user with credentials from .env
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
config({ path: resolve(__dirname, '../.env') });

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@bmi.edu';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'BMI@Admin2024!';

async function createAdmin() {
  try {
    console.log('🚀 BMI UMS - Create/Update Admin User');
    console.log('======================================\n');
    
    console.log(`📧 Email: ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD}\n`);
    
    console.log('Creating/updating admin user...');
    
    // Use PocketBase CLI to create/update superuser
    const command = `./bin/pocketbase superuser upsert "${ADMIN_EMAIL}" "${ADMIN_PASSWORD}"`;
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: resolve(__dirname, '../..'),
    });
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('\n✅ Admin user created/updated successfully!');
    console.log('\nYou can now run the import script:');
    console.log('bash scripts/fresh-import.sh\n');
    
  } catch (error: any) {
    console.error('\n❌ Operation failed:', error.message);
    console.log('\nTry running this command manually:');
    console.log(`./bin/pocketbase superuser upsert "${ADMIN_EMAIL}" "${ADMIN_PASSWORD}"\n`);
    process.exit(1);
  }
}

createAdmin();
