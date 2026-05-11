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
      const error: any = await response.json();
      throw new Error(`Admin auth failed: ${error.message || response.statusText}`);
    }

    const data: any = await response.json();
    
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
          const data: any = await response.json();
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
    
    // Define required collections in dependency order
    const requiredCollections = [
      'faculties',
      'departments',
      'programs',
      'courses',
      'program_courses',
      'staff',
      'students',
      'enrollments',
      'grades',
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
    faculties: {
      fields: {
        faculty_code: { type: 'text', required: true },
        name: { type: 'text', required: true },
      }
    },
    departments: {
      fields: {
        dept_code: { type: 'text', required: true },
        name: { type: 'text', required: true },
        faculty_code: { type: 'relation', required: true, options: { collectionId: 'faculties', maxSelect: 1 } },
      }
    },
    programs: {
      fields: {
        program_code: { type: 'text', required: true },
        name: { type: 'text', required: true },
        degree_level: { type: 'text', required: true },
        total_credits: { type: 'number', required: true },
        dept_code: { type: 'relation', required: true, options: { collectionId: 'departments', maxSelect: 1 } },
      }
    },
    courses: {
      fields: {
        course_code: { type: 'text', required: true },
        title: { type: 'text', required: true },
        credits: { type: 'number', required: true },
        is_elective: { type: 'bool' },
        faculty: { type: 'text' },
        department: { type: 'text' },
        level: { type: 'select', options: { values: ['Undergraduate', 'Postgraduate', 'Diploma', 'Certificate'], maxSelect: 1 } },
        status: { type: 'select', options: { values: ['Published', 'Draft', 'Archived'], maxSelect: 1 } },
        description: { type: 'text' },
        syllabus: { type: 'text' },
      }
    },
    program_courses: {
      fields: {
        program_code: { type: 'relation', required: true, options: { collectionId: 'programs', maxSelect: 1 } },
        course_code: { type: 'relation', required: true, options: { collectionId: 'courses', maxSelect: 1 } },
        is_required: { type: 'bool', required: true },
        sequence_order: { type: 'number' },
      }
    },
    staff: {
      fields: {
        staff_number: { type: 'text', required: true },
        first_name: { type: 'text', required: true },
        last_name: { type: 'text', required: true },
        email: { type: 'email' },
        phone: { type: 'text' },
        title: { type: 'text' },
        role: { type: 'text', required: true },
        dept_code: { type: 'relation', required: false, options: { collectionId: 'departments', maxSelect: 1 } },
        department: { type: 'text' },
        category: { type: 'select', options: { values: ['Academic', 'Administrative', 'Management'], maxSelect: 1 } },
        specialization: { type: 'text' },
        office: { type: 'text' },
        office_hours: { type: 'text' },
        status: { type: 'select', options: { values: ['Full-time', 'Part-time', 'On Leave'], maxSelect: 1 } },
        join_date: { type: 'text' },
        avatar_color: { type: 'text' },
      }
    },
    students: {
      fields: {
        student_number: { type: 'text', required: true },
        first_name: { type: 'text', required: true },
        last_name: { type: 'text', required: true },
        email: { type: 'email', required: true },
        phone: { type: 'text' },
        gender: { type: 'select', options: { values: ['Male', 'Female'], maxSelect: 1 } },
        admission_date: { type: 'text' },
        avatar_color: { type: 'text' },
        photo_zoom: { type: 'number' },
        photo_position: { type: 'json' },
        status: { type: 'select', required: true, options: { values: ['Active', 'Applicant', 'On Leave', 'Graduated', 'Suspended'], maxSelect: 1 } },
        program_code: { type: 'relation', required: true, options: { collectionId: 'programs', maxSelect: 1 } },
      }
    },
    enrollments: {
      fields: {
        student_number: { type: 'relation', required: true, options: { collectionId: 'students', maxSelect: 1 } },
        course_code: { type: 'relation', required: true, options: { collectionId: 'courses', maxSelect: 1 } },
        academic_year: { type: 'text', required: true },
        semester: { type: 'text', required: true },
      }
    },
    grades: {
      fields: {
        enrollment_id: { type: 'relation', required: true, options: { collectionId: 'enrollments', maxSelect: 1 } },
        percentage: { type: 'number', required: true },
        grade_letter: { type: 'text', required: true },
        gpa: { type: 'number' },
      }
    },
    users: {
      fields: {
        name: { type: 'text', required: true },
        role: { type: 'select', required: true, options: { values: ['admin', 'registrar', 'faculty', 'student', 'staff', 'viewer'], maxSelect: 1 } },
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
        status: { type: 'select', required: true, options: { values: ['ISSUED', 'REVOKED', 'SUSPENDED'], maxSelect: 1 } },
        content_hash: { type: 'text', required: true },
        signature: { type: 'text' },
        issuance_nonce: { type: 'text' },
        hidden_token: { type: 'text' },
        offline_jwt: { type: 'text' },
        verification_count: { type: 'number' },
      }
    },
    verification_logs: {
      fields: {
        certificate_serial: { type: 'text', required: true },
        result: { type: 'select', required: true, options: { values: ['valid', 'invalid', 'revoked', 'tampered', 'not_found'], maxSelect: 1 } },
        method: { type: 'text', required: true },
        ip_address: { type: 'text' },
        user_agent: { type: 'text' },
        timestamp: { type: 'text', required: true },
      }
    },
    transactions: {
      fields: {
        ref: { type: 'text', required: true },
        name: { type: 'text', required: true },
        desc: { type: 'text' },
        amt: { type: 'number', required: true },
        status: { type: 'select', required: true, options: { values: ['Paid', 'Pending', 'Failed'], maxSelect: 1 } },
        date: { type: 'text', required: true },
        student_id: { type: 'text' },
      }
    },
    library_items: {
      fields: {
        title: { type: 'text', required: true },
        author: { type: 'text', required: true },
        category: { type: 'select', required: true, options: { values: ['Theology', 'ICT', 'Business', 'Education', 'General'], maxSelect: 1 } },
        type: { type: 'select', required: true, options: { values: ['PDF', 'E-Book', 'Hardcopy', 'Journal', 'Video'], maxSelect: 1 } },
        status: { type: 'select', required: true, options: { values: ['Digital', 'Available', 'Borrowed', 'Reserved'], maxSelect: 1 } },
        year: { type: 'text' },
        description: { type: 'text' },
        downloadUrl: { type: 'text' },
        location: { type: 'text' },
        isbn: { type: 'text' },
      }
    },
    audit_logs: {
      fields: {
        action: { type: 'text', required: true },
        resource: { type: 'text', required: true },
        resourceId: { type: 'text' },
        userId: { type: 'text', required: true },
        userEmail: { type: 'text', required: true },
        details: { type: 'json' },
        ipAddress: { type: 'text' },
        userAgent: { type: 'text' },
        timestamp: { type: 'text', required: true },
      }
    }
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

    // Resolve collection names to their 15-char IDs for relation fields
    const allCollections = await pb.collections.getList(1, 100);
    const collectionIdMap = new Map(allCollections.items.map(c => [c.name, c.id]));

    const fieldsSchema = schema[name]?.fields || {};
    const fieldsArray = Object.entries(fieldsSchema).map(([fieldName, config]) => {
      // If this is a relation field, we must use the 15-char collection ID
      if (config.type === 'relation' && config.options?.collectionId) {
        const targetName = config.options.collectionId as string;
        if (collectionIdMap.has(targetName)) {
          config.options.collectionId = collectionIdMap.get(targetName);
        } else {
          logger.error(`Target collection '${targetName}' not found for relation field '${fieldName}' in '${name}'. Has it been created yet?`);
        }
      }
      return {
        name: fieldName,
        ...config
      };
    });

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


