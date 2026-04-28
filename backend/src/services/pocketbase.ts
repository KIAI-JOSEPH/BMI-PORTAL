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
    
    // Auto-cancel pending requests on auth state change
    pb.autoCancellation(false);
    
    logger.info(`PocketBase initialized at ${CONFIG.POCKETBASE_URL}`);
  }
  
  return pb;
}

/**
 * Authenticate as admin
 */
export async function authenticateAdmin(): Promise<void> {
  const pb = getPocketBase();
  
  try {
    await pb.admins.authWithPassword(
      CONFIG.POCKETBASE_ADMIN_EMAIL,
      CONFIG.POCKETBASE_ADMIN_PASSWORD
    );
    
    logger.info('PocketBase admin authenticated');
  } catch (error) {
    logger.error('Failed to authenticate PocketBase admin:', error);
    throw new Error('PocketBase authentication failed');
  }
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
        role: { type: 'select', required: true, options: { values: ['admin', 'registrar', 'staff', 'viewer'] } },
        department: { type: 'text' },
        isActive: { type: 'bool', required: true },
        lastLogin: { type: 'date' },
      }
    },
  };
  
  try {
    await pb.collections.create({
      name,
      type: 'base',
      schema: schema[name]?.fields || {},
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
