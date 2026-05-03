/**
 * Check the students collection schema
 */

const PB_URL = 'http://127.0.0.1:8090';
const ADMIN_EMAIL = 'admin@bmi.edu';
const ADMIN_PASSWORD = 'BMIAdmin2024Secure';

async function checkSchema() {
  console.log('🔍 Checking Collection Schema');
  console.log('==============================\n');
  
  // Authenticate
  console.log('🔐 Authenticating...');
  const authResponse = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });
  
  if (!authResponse.ok) {
    console.error('❌ Authentication failed');
    process.exit(1);
  }
  
  const authData = await authResponse.json();
  console.log('✅ Authenticated\n');
  
  // Get collection schema
  console.log('📋 Fetching students collection schema...');
  const response = await fetch(`${PB_URL}/api/collections/students`, {
    headers: { 'Authorization': authData.token },
  });
  
  if (!response.ok) {
    console.error('❌ Failed to fetch collection schema');
    const error = await response.json();
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  }
  
  const collection = await response.json();
  
  console.log(`✅ Collection: ${collection.name}`);
  console.log(`   Type: ${collection.type}`);
  console.log(`   ID: ${collection.id}\n`);
  
  console.log('📝 Schema fields:');
  for (const field of collection.schema) {
    console.log(`\n   ${field.name} (${field.type}):`);
    console.log(`     Required: ${field.required}`);
    if (field.min) console.log(`     Min: ${field.min}`);
    if (field.max) console.log(`     Max: ${field.max}`);
    if (field.options) {
      console.log(`     Options:`, field.options);
    }
  }
  
  console.log('\n\n🔑 ID field configuration:');
  console.log(`   Type: ${collection.type}`);
  console.log(`   System: ${collection.system}`);
  
  // Check if there are any indexes
  if (collection.indexes && collection.indexes.length > 0) {
    console.log('\n📊 Indexes:');
    for (const index of collection.indexes) {
      console.log(`   - ${index}`);
    }
  }
}

checkSchema().catch(console.error);
