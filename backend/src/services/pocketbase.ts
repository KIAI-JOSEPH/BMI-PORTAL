// BMI UMS - PocketBase Service
import PocketBase from "pocketbase";
import { CONFIG } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { fetchWithTimeout } from "../utils/helpers.js";

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
    const response = await fetchWithTimeout(
      `${CONFIG.POCKETBASE_URL}/api/admins/auth-with-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identity: CONFIG.POCKETBASE_ADMIN_EMAIL,
          password: CONFIG.POCKETBASE_ADMIN_PASSWORD,
        }),
      },
      5000,
    );

    if (!response.ok) {
      const error: any = await response.json();
      throw new Error(
        `Admin auth failed: ${error.message || response.statusText}`,
      );
    }

    const data: any = await response.json();

    // Manually set the auth store
    pb.authStore.save(data.token, data.admin);

    logger.info("PocketBase admin authenticated");
  } catch (error) {
    logger.error("Failed to authenticate PocketBase admin:", error);
    throw new Error("PocketBase authentication failed");
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
        const response = await fetchWithTimeout(
          `${CONFIG.POCKETBASE_URL}/api/admins/auth-refresh`,
          {
            method: "POST",
            headers: {
              Authorization: pb.authStore.token,
            },
          },
          5000,
        );

        if (response.ok) {
          const data: any = await response.json();
          pb.authStore.save(data.token, data.admin);
          logger.info("PocketBase admin token refreshed");
        } else {
          await authenticateAdmin();
          logger.info("PocketBase admin re-authenticated");
        }
      } else {
        await authenticateAdmin();
        logger.info("PocketBase admin re-authenticated");
      }
    } catch (error) {
      logger.warn("PocketBase admin token refresh failed:", error);
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
    const existingNames = collections.items.map((c) => c.name);

    logger.info(`Existing collections: ${existingNames.join(", ")}`);

    // Define required collections in dependency order
    const requiredCollections = [
      "campuses",
      "modules",
      "courses",
      "students",
      "academic_records",
      "staff",
      "enrollments",
      "grades",
      "certificates",
      "verification_logs",
      "transactions",
      "library_items",
      "audit_logs",
      "grade_appeals",
      "grading_scales",
      "hostels",
      "room_assignments",
      "medical_visits",
      "inventory_items",
      "visitors",
      "attendance_records",
      "users",
    ];

    // Create/Sync collections
    for (const name of requiredCollections) {
      await createCollection(name);
    }

    logger.info("Database schema setup complete");
  } catch (error) {
    logger.error("Failed to setup collections:", error);
    throw error;
  }
}

/**
 * Create a single collection
 */
async function createCollection(name: string): Promise<void> {
  const pb = getPocketBase();

  type FieldSchema = {
    type: string;
    required?: boolean;
    options?: Record<string, unknown>;
  };
  type CollectionSchema = { fields: Record<string, FieldSchema> };

  const schema: Record<string, CollectionSchema> = {
    campuses: {
      fields: {
        name: { type: "text", required: true },
        location: { type: "text" },
      },
    },
    modules: {
      fields: {
        name: { type: "text", required: true },
        semester: {
          type: "select",
          options: { values: ["Semester 1", "Semester 2"], maxSelect: 1 },
        },
        sort_order: { type: "number" },
      },
    },
    courses: {
      fields: {
        code: { type: "text", required: true },
        title: { type: "text", required: true },
        category: { type: "text" },
        credit_hours: { type: "number" },
        module_id: {
          type: "relation",
          options: { collectionId: "modules", maxSelect: 1 },
        },
      },
    },
    program_courses: {
      fields: {
        program_code: {
          type: "relation",
          required: true,
          options: { collectionId: "programs", maxSelect: 1 },
        },
        course_code: {
          type: "relation",
          required: true,
          options: { collectionId: "courses", maxSelect: 1 },
        },
        is_required: { type: "bool" },
        sequence_order: { type: "number" },
      },
    },
    staff: {
      fields: {
        staff_number: { type: "text", required: true },
        first_name: { type: "text", required: true },
        last_name: { type: "text", required: true },
        email: { type: "email" },
        phone: { type: "text" },
        role: { type: "text", required: true },
        category: {
          type: "select",
          options: {
            values: ["Academic", "Administrative", "Management"],
            maxSelect: 1,
          },
        },
        status: {
          type: "select",
          options: {
            values: ["Full-time", "Part-time", "On Leave"],
            maxSelect: 1,
          },
        },
        campus_id: {
          type: "relation",
          options: { collectionId: "campuses", maxSelect: 1 },
        },
        avatar_color: { type: "text" },
      },
    },
    students: {
      fields: {
        student_code: { type: "text", required: true },
        reg_no: { type: "text" },
        full_name: { type: "text", required: true },
        first_name: { type: "text" },
        last_name: { type: "text" },
        gender: {
          type: "select",
          options: { values: ["Male", "Female"], maxSelect: 1 },
        },
        date_of_birth: { type: "date" },
        nationality: { type: "text" },
        phone: { type: "text" },
        email: { type: "email" },
        admission_no: { type: "text" },
        admission_date: { type: "date" },
        programme: {
          type: "select",
          options: {
            values: ["Diploma in Theology & Christian Ministry"],
            maxSelect: 1,
          },
        },
        status: {
          type: "select",
          options: {
            values: ["Active", "Inactive", "Graduated", "Suspended"],
            maxSelect: 1,
          },
        },
        campus_id: {
          type: "relation",
          options: { collectionId: "campuses", maxSelect: 1 },
        },
        avatar_color: { type: "text" },
        photo_zoom: { type: "number" },
        photo_position: { type: "json", options: { maxSize: 2000000 } },
      },
    },
    academic_records: {
      fields: {
        student_id: {
          type: "relation",
          required: true,
          options: { collectionId: "students", maxSelect: 1 },
        },
        course_id: {
          type: "relation",
          required: true,
          options: { collectionId: "courses", maxSelect: 1 },
        },
        total_score: { type: "number" },
        ca_score: { type: "number" },
        exam_score: { type: "number" },
        grade: { type: "text" },
        grade_point: { type: "number" },
        remarks: { type: "text" },
        academic_year: { type: "text" },
        semester: { type: "text" },
      },
    },
    enrollments: {
      fields: {
        student_number: {
          type: "relation",
          required: true,
          options: { collectionId: "students", maxSelect: 1 },
        },
        course_code: {
          type: "relation",
          required: true,
          options: { collectionId: "courses", maxSelect: 1 },
        },
        academic_year: { type: "text", required: true },
        semester: { type: "text", required: true },
      },
    },
    grades: {
      fields: {
        enrollment_id: {
          type: "relation",
          required: true,
          options: { collectionId: "enrollments", maxSelect: 1 },
        },
        percentage: { type: "number", required: true },
        grade_letter: { type: "text", required: true },
        gpa: { type: "number" },
      },
    },
    users: {
      fields: {
        name: { type: "text", required: true },
        role: {
          type: "select",
          required: true,
          options: {
            values: [
              "admin",
              "registrar",
              "faculty",
              "student",
              "staff",
              "viewer",
            ],
            maxSelect: 1,
          },
        },
        department: { type: "text" },
        studentId: { type: "text" },
        staffId: { type: "text" },
        isActive: { type: "bool", required: true },
        lastLogin: { type: "date" },
      },
    },
    certificates: {
      fields: {
        serial_number: { type: "text", required: true },
        student_id: { type: "text", required: true },
        student_name: { type: "text", required: true },
        degree: { type: "text", required: true },
        graduation_class: { type: "text" },
        faculty: { type: "text", required: true },
        department: { type: "text" },
        studentId: { type: "text" },
        staffId: { type: "text" },
        issue_date: { type: "text", required: true },
        graduation_date: { type: "text" },
        gpa: { type: "number", required: true },
        status: {
          type: "select",
          required: true,
          options: { values: ["ISSUED", "REVOKED", "SUSPENDED"], maxSelect: 1 },
        },
        content_hash: { type: "text", required: true },
        signature: { type: "text" },
        issuance_nonce: { type: "text" },
        hidden_token: { type: "text" },
        offline_jwt: { type: "text" },
        verification_count: { type: "number" },
      },
    },
    verification_logs: {
      fields: {
        certificate_serial: { type: "text", required: true },
        result: {
          type: "select",
          required: true,
          options: {
            values: ["valid", "invalid", "revoked", "tampered", "not_found"],
            maxSelect: 1,
          },
        },
        method: { type: "text", required: true },
        ip_address: { type: "text" },
        user_agent: { type: "text" },
        timestamp: { type: "text", required: true },
      },
    },
    transactions: {
      fields: {
        ref: { type: "text", required: true },
        name: { type: "text", required: true },
        desc: { type: "text" },
        amt: { type: "number", required: true },
        status: {
          type: "select",
          required: true,
          options: { values: ["Paid", "Pending", "Failed"], maxSelect: 1 },
        },
        date: { type: "text", required: true },
        student_id: { type: "text" },
      },
    },
    library_items: {
      fields: {
        title: { type: "text", required: true },
        author: { type: "text", required: true },
        category: {
          type: "select",
          required: true,
          options: {
            values: ["Theology", "ICT", "Business", "Education", "General"],
            maxSelect: 1,
          },
        },
        type: {
          type: "select",
          required: true,
          options: {
            values: ["PDF", "E-Book", "Hardcopy", "Journal", "Video"],
            maxSelect: 1,
          },
        },
        status: {
          type: "select",
          required: true,
          options: {
            values: ["Digital", "Available", "Borrowed", "Reserved"],
            maxSelect: 1,
          },
        },
        year: { type: "text" },
        description: { type: "text" },
        downloadUrl: { type: "text" },
        location: { type: "text" },
        isbn: { type: "text" },
      },
    },
    audit_logs: {
      fields: {
        action: { type: "text", required: true },
        resource: { type: "text", required: true },
        resourceId: { type: "text" },
        userId: { type: "text", required: true },
        userEmail: { type: "text", required: true },
        details: { type: "json", options: { maxSize: 2000000 } },
        ipAddress: { type: "text" },
        userAgent: { type: "text" },
        timestamp: { type: "text", required: true },
      },
    },
    grade_appeals: {
      fields: {
        student_id: { type: "text", required: true },
        student_name: { type: "text", required: true },
        enrollment_id: { type: "text", required: true },
        course_code: { type: "text", required: true },
        course_name: { type: "text", required: true },
        current_grade: { type: "text", required: true },
        appeal_reason: { type: "text", required: true },
        status: {
          type: "select",
          options: {
            values: [
              "Pending",
              "Under Review",
              "Approved",
              "Denied",
              "Withdrawn",
            ],
            maxSelect: 1,
          },
        },
        instructor_response: { type: "text" },
        resolution_notes: { type: "text" },
        submitted_at: { type: "date", required: true },
        resolved_at: { type: "date" },
      },
    },
    grading_scales: {
      fields: {
        name: { type: "text", required: true },
        description: { type: "text" },
        scale_data: {
          type: "json",
          required: true,
          options: { maxSize: 2000000 },
        },
        is_default: { type: "bool" },
        academic_year: { type: "text" },
        created_by: { type: "text" },
      },
    },
    hostels: {
      fields: {
        name: { type: "text", required: true },
        type: {
          type: "select",
          required: true,
          options: { values: ["Male", "Female"], maxSelect: 1 },
        },
        capacity: { type: "number", required: true },
        location: { type: "text", required: true },
        status: {
          type: "select",
          required: true,
          options: {
            values: ["Available", "Near Capacity", "Full"],
            maxSelect: 1,
          },
        },
      },
    },
    room_assignments: {
      fields: {
        studentId: { type: "text", required: true },
        studentName: { type: "text", required: true },
        hostelId: {
          type: "relation",
          required: true,
          options: { collectionId: "hostels", maxSelect: 1 },
        },
        roomNumber: { type: "text", required: true },
        checkInDate: { type: "text", required: true },
        status: {
          type: "select",
          required: true,
          options: { values: ["Active", "Revoked"], maxSelect: 1 },
        },
      },
    },
    medical_visits: {
      fields: {
        studentId: { type: "text", required: true },
        studentName: { type: "text", required: true },
        condition: { type: "text", required: true },
        bloodType: { type: "text" },
        date: { type: "text", required: true },
        attendingStaff: { type: "text" },
        status: {
          type: "select",
          required: true,
          options: { values: ["Normal", "Urgent", "Follow-up"], maxSelect: 1 },
        },
        vitals: { type: "json", options: { maxSize: 2000000 } },
        notes: { type: "text" },
      },
    },
    inventory_items: {
      fields: {
        name: { type: "text", required: true },
        category: { type: "text", required: true },
        quantity: { type: "number", required: true },
        condition: {
          type: "select",
          required: true,
          options: { values: ["New", "Good", "Fair", "Poor"], maxSelect: 1 },
        },
        location: { type: "text", required: true },
        lastUpdated: { type: "text" },
      },
    },
    visitors: {
      fields: {
        name: { type: "text", required: true },
        purpose: { type: "text", required: true },
        host: { type: "text", required: true },
        checkIn: { type: "text", required: true },
        checkOut: { type: "text" },
        status: {
          type: "select",
          required: true,
          options: { values: ["Active", "Checked Out"], maxSelect: 1 },
        },
      },
    },
    attendance_records: {
      fields: {
        courseId: { type: "text", required: true },
        date: { type: "text", required: true },
        records: {
          type: "json",
          required: true,
          options: { maxSize: 2000000 },
        },
      },
    },
  };

  try {
    // Check if collection already exists to avoid 400 error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let existingCollection: any;
    try {
      existingCollection = await pb.collections.getOne(name);
      logger.info(`Collection '${name}' exists, syncing schema...`);
    } catch (e) {
      // Collection doesn't exist, proceed to create
    }

    // Resolve collection names to their 15-char IDs for relation fields
    const allCollections = await pb.collections.getList(1, 100);
    const collectionIdMap = new Map(
      allCollections.items.map((c) => [c.name, c.id]),
    );

    const fieldsSchema = schema[name]?.fields || {};
    const fieldsArray = Object.entries(fieldsSchema).map(
      ([fieldName, config]) => {
        // If this is a relation field, we must use the 15-char collection ID
        if (config.type === "relation" && config.options?.collectionId) {
          const targetName = config.options.collectionId as string;
          if (collectionIdMap.has(targetName)) {
            config.options.collectionId = collectionIdMap.get(targetName);
          } else {
            logger.error(
              `Target collection '${targetName}' not found for relation field '${fieldName}' in '${name}'. Has it been created yet?`,
            );
          }
        }

        const fieldDef: any = {
          name: fieldName,
          ...config,
        };

        // CRITICAL: Preserve existing field IDs to prevent PocketBase from dropping the column and wiping data
        if (existingCollection && existingCollection.schema) {
          const existingField = existingCollection.schema.find(
            (f: any) => f.name === fieldName,
          );
          if (existingField && existingField.id) {
            fieldDef.id = existingField.id;
          }
        }

        return fieldDef;
      },
    );

    if (existingCollection) {
      const collType = (existingCollection as any).type || "base";
      // IMPORTANT: Rules are NEVER set here — they are managed exclusively by
      // pb_migrations (see pb_migrations/1780000001_add_collection_rules.js).
      // Overwriting rules on every startup defeats any hardening the migrations apply.
      await pb.collections.update(existingCollection.id, {
        name,
        type: collType,
        schema: fieldsArray,
      });
      logger.info(`Collection '${name}' updated successfully`);
      return;
    }

    await pb.collections.create({
      name,
      type: name === "users" ? "auth" : "base",
      schema: fieldsArray,
      // New collections get admin-only rules by default.
      // The rules migration (pb_migrations/1780000001_add_collection_rules.js)
      // will set proper role-based rules. We never default to @request.auth.id != ''
      // as it grants any authenticated user full CRUD access to all records.
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      options:
        name === "users"
          ? {
              allowEmailAuth: true,
              allowOAuth2Auth: true,
              allowUsernameAuth: true,
              exceptEmailDomains: null,
              manageRule: null,
              minPasswordLength: 8,
              onlyEmailDomains: null,
              requireEmail: false,
            }
          : {},
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
    // ALWAYS ensure the core admin user exists, is active, and has the admin role
    const adminEmail = CONFIG.POCKETBASE_ADMIN_EMAIL;
    let adminUser = null;

    try {
      adminUser = await pb
        .collection("users")
        .getFirstListItem(`email="${adminEmail}"`);
    } catch (e) {
      // User not found, will create
    }

    if (adminUser) {
      // Lock the account properties
      if (
        !adminUser.isActive ||
        adminUser.role !== "admin" ||
        !adminUser.name
      ) {
        logger.info(
          `Locking/Restoring admin user account properties for ${adminEmail}`,
        );
        await pb.collection("users").update(adminUser.id, {
          isActive: true,
          role: "admin",
          name: "System Administrator",
          verified: true,
        });
      }
    } else {
      // No admin exists - create default admin
      logger.info("Admin user not found. Creating locked admin user...");
      await pb.collection("users").create({
        email: adminEmail,
        password: CONFIG.POCKETBASE_ADMIN_PASSWORD,
        passwordConfirm: CONFIG.POCKETBASE_ADMIN_PASSWORD,
        name: "System Administrator",
        role: "admin",
        department: "IT Administration",
        isActive: true,
        verified: true,
        emailVisibility: false,
      });
      logger.info(`Locked admin user created: ${adminEmail}`);
    }
  } catch (error) {
    logger.error("Failed to secure admin user account:", error);
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
