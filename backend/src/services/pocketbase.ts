// BMI UMS - PocketBase Service
import PocketBase from 'pocketbase';
import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';

// Singleton PocketBase instance
let pb: PocketBase | null = null;

/**
 * Get PocketBase instance
 */
export function getPocketBase(): PocketBase {
  if (!pb) {
    pb = new PocketBase(CONFIG.POCKETBASE_URL);
    pb.autoCancellation(false);
    logger.info(`PocketBase initialized at ${CONFIG.POCKETBASE_URL}`);
  }
  return pb;
}

/**
 * Authenticate as admin (PocketBase 0.22 API)
 * Using direct HTTP call to avoid SDK version issues
 */
export async function authenticateAdmin(): Promise<void> {
  const pb = getPocketBase();
  try {
    // Direct HTTP call to admin auth endpoint
    const response = await fetch(`${CONFIG.POCKETBASE_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identity: CONFIG.POCKETBASE_ADMIN_EMAIL,
        password: CONFIG.POCKETBASE_ADMIN_PASSWORD,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Admin auth failed: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Manually set the auth store
    pb.authStore.save(data.token, data.admin);
    
    logger.info('PocketBase admin authenticated');
  } catch (error) {
    logger.error('Failed to authenticate PocketBase admin:', error);
    throw new Error('PocketBase authentication failed');
  }
}

/**
 * Schedule periodic admin token refresh (every 30 minutes)
 * Prevents silent auth failures when the admin token expires mid-session
 */
export function scheduleAdminTokenRefresh(): void {
  const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
  setInterval(async () => {
    try {
      const pb = getPocketBase();
      if (pb.authStore.isValid) {
        // Direct HTTP call to admin refresh endpoint
        const response = await fetch(`${CONFIG.POCKETBASE_URL}/api/admins/auth-refresh`, {
          method: 'POST',
          headers: {
            'Authorization': pb.authStore.token,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          pb.authStore.save(data.token, data.admin);
          logger.info('PocketBase admin token refreshed');
        } else {
          await authenticateAdmin();
          logger.info('PocketBase admin re-authenticated');
        }
      } else {
        await authenticateAdmin();
        logger.info('PocketBase admin re-authenticated');
      }
    } catch (error) {
      logger.warn('PocketBase admin token refresh failed:', error);
    }
  }, REFRESH_INTERVAL_MS);
}

/**
 * Create collections if they don't exist
 * This sets up the database schema
 */
export async function setupCollections(): Promise<void> {
  const pb = getPocketBase();
  
  try {
    // Check if collections exist
    const collections = await pb.collections.getList(1, 50);
    const existingNames = collections.items.map(c => c.name);
    
    logger.info(`Existing collections: ${existingNames.join(', ')}`);
    
    // Define required collections
    const requiredCollections = [
      'students',
      'staff',
      'courses',
      'certificates',
      'verification_logs',
      'transactions',
      'library_items',
      'audit_logs',
      'users',
    ];
    
    // Create missing collections
    for (const name of requiredCollections) {
      if (!existingNames.includes(name)) {
        logger.info(`Creating collection: ${name}`);
        await createCollection(name);
      }
    }
    
    logger.info('Database schema setup complete');
  } catch (error) {
    logger.error('Failed to setup collections:', error);
    throw error;
  }
}

/**
 * Create a single collection
 */
async function createCollection(name: string): Promise<void> {
  const pb = getPocketBase();
  
  type FieldSchema = { type: string; required?: boolean; options?: Record<string, unknown> };
  type CollectionSchema = { fields: Record<string, FieldSchema> };

  const schema: Record<string, CollectionSchema> = {
    students: {
      fields: {
        firstName: { type: 'text', required: true },
        lastName: { type: 'text', required: true },
        middleName: { type: 'text' },
        gender: { type: 'select', required: true, options: { values: ['Male', 'Female'] } },
        email: { type: 'email', required: true },
        phone: { type: 'text', required: true },
        nationality: { type: 'text' },
        faculty: { type: 'text', required: true },
        department: { type: 'text', required: true },
        careerPath: { type: 'text', required: true },
        academicLevel: { type: 'select', required: true, options: { values: ['Diploma', 'Degree', 'Masters', 'PhD'] } },
        admissionYear: { type: 'text', required: true },
        enrollmentTerm: { type: 'text', required: true },
        status: { type: 'select', required: true, options: { values: ['Active', 'Applicant', 'On Leave', 'Graduated', 'Suspended'] } },
        standing: { type: 'select', required: true, options: { values: ['Honor Roll', 'Good', 'Probation', 'Warning'] } },
        gpa: { type: 'number', required: true },
        avatarColor: { type: 'text', required: true },
        photo: { type: 'file' },
        photoZoom: { type: 'number' },
        photoPosition: { type: 'json' },
      }
    },
    users: {
      fields: {
        name: { type: 'text', required: true },
        role: { type: 'select', required: true, options: { values: ['admin', 'registrar', 'faculty', 'student', 'staff', 'viewer'] } },
        department: { type: 'text' },
        studentId: { type: 'text' },
        staffId: { type: 'text' },
        isActive: { type: 'bool', required: true },
        lastLogin: { type: 'date' },
      }
    },
    certificates: {
      fields: {
        serial_number: { type: 'text', required: true },
        student_id: { type: 'text', required: true },
        student_name: { type: 'text', required: true },
        degree: { type: 'text', required: true },
        graduation_class: { type: 'text' },
        faculty: { type: 'text', required: true },
        department: { type: 'text' },
        studentId: { type: 'text' },
        staffId: { type: 'text' },
        issue_date: { type: 'text', required: true },
        graduation_date: { type: 'text' },
        gpa: { type: 'number', required: true },
        status: { type: 'select', required: true, options: { values: ['ISSUED', 'REVOKED', 'SUSPENDED'] } },
        content_hash: { type: 'text', required: true },
        signature: { type: 'text' },
        issuance_nonce: { type: 'text' },    // SECRET — never sent to frontend
        hidden_token: { type: 'text' },      // derived from nonce — for fast lookup
        offline_jwt: { type: 'text' },
        verification_count: { type: 'number' },
      }
    },
    verification_logs: {
      fields: {
        certificate_serial: { type: 'text', required: true },
        result: { type: 'select', required: true, options: { values: ['valid', 'invalid', 'revoked', 'tampered', 'not_found'] } },
        method: { type: 'text', required: true },
        ip_address: { type: 'text' },
        user_agent: { type: 'text' },
        timestamp: { type: 'text', required: true },
      }
    },
  };
  
  try {
    // Check if collection already exists to avoid 400 error
    try {
      await pb.collections.getOne(name);
      logger.info(`Collection '${name}' already exists, skipping creation`);
      return;
    } catch (e) {
      // Collection doesn't exist, proceed to create
    }

    const fieldsSchema = schema[name]?.fields || {};
    const fieldsArray = Object.entries(fieldsSchema).map(([fieldName, config]) => ({
      name: fieldName,
      ...config
    }));

    await pb.collections.create({
      name,
      type: 'base',
      schema: fieldsArray,
      options: {
        allowEmailAuth: name === 'users',
        allowOAuth2Auth: name === 'users',
      },
    });
    
    logger.info(`Collection '${name}' created successfully`);
  } catch (error) {
    logger.error(`Failed to create collection '${name}':`, error);
    throw error;
  }
}

/**
 * Create default admin user if no users exist
 * This ensures the system is accessible on first run
 */
export async function createDefaultAdminIfNeeded(): Promise<void> {
  const pb = getPocketBase();

  try {
    // Check if any users exist
    const existingUsers = await pb.collection('users').getList(1, 1);

    if (existingUsers.totalItems > 0) {
      logger.info(`Users already exist (${existingUsers.totalItems} total), skipping default admin creation`);
      return;
    }

    // No users exist - create default admin
    logger.info('No users found. Creating default admin user...');

    await pb.collection('users').create({
      email: CONFIG.POCKETBASE_ADMIN_EMAIL,
      password: CONFIG.POCKETBASE_ADMIN_PASSWORD,
      passwordConfirm: CONFIG.POCKETBASE_ADMIN_PASSWORD,
      name: 'System Administrator',
      role: 'admin',
      department: 'IT Administration',
      isActive: true,
      verified: true,
      emailVisibility: false,
    });

    logger.info(`Default admin user created: ${CONFIG.POCKETBASE_ADMIN_EMAIL}`);
    logger.info(`Password: ${CONFIG.POCKETBASE_ADMIN_PASSWORD}`);
  } catch (error) {
    logger.error('Failed to create default admin user:', error);
    // Don't throw - allow system to continue, but admin will need to create user manually
  }
}

/**
 * Health check for PocketBase connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const pb = getPocketBase();
    await pb.health.check();
    return true;
  } catch {
    return false;
  }
}


