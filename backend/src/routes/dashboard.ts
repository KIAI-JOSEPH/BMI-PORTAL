// BMI UMS - Dashboard Routes (Aggregated Statistics)
import { Hono } from 'hono';
import { getPocketBase } from '../services/pocketbase.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import type { ApiResponse } from '../types/index.js';

const dashboardRouter = new Hono();

// Simple in-memory cache — prevents full table scans on every dashboard load
interface CacheEntry { data: unknown; expiresAt: number; }
const cache = new Map<string, CacheEntry>();
function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.data as T;
}
function setCached(key: string, data: unknown, ttlMs = 30_000): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// Apply auth middleware
dashboardRouter.use('*', authMiddleware);

/**
 * GET /api/v1/dashboard/stats
 * Get comprehensive dashboard statistics — uses paginated counts, not full table scans
 */
dashboardRouter.get('/stats', async (c) => {
  const CACHE_KEY = 'dashboard_stats';
  const cached = getCached<object>(CACHE_KEY);
  if (cached) return c.json<ApiResponse<object>>({ success: true, data: cached });

  try {
    const pb = getPocketBase();

    // Use getList with perPage=1 to get totalItems counts — no full table scan
    const [
      studentsAll, studentsActive, studentsApplicant, studentsGraduated,
      studentsTheology, studentsICT, studentsBusiness, studentsEducation,
      staffAll, staffAcademic, staffAdmin, staffMgmt,
      coursesAll, coursesPublished, coursesUG, coursesPG, coursesDip, coursesCert,
      certsAll, certsIssued, certsRevoked,
      txAll, txPaid, txPending,
      libAll, libDigital, libAvailable, libBorrowed,
    ] = await Promise.all([
      pb.collection('students').getList(1, 1),
      pb.collection('students').getList(1, 1, { filter: 'status = "Active"' }),
      pb.collection('students').getList(1, 1, { filter: 'status = "Applicant"' }),
      pb.collection('students').getList(1, 1, { filter: 'status = "Graduated"' }),
      pb.collection('students').getList(1, 1, { filter: 'faculty = "Theology"' }),
      pb.collection('students').getList(1, 1, { filter: 'faculty = "ICT"' }),
      pb.collection('students').getList(1, 1, { filter: 'faculty = "Business"' }),
      pb.collection('students').getList(1, 1, { filter: 'faculty = "Education"' }),
      pb.collection('staff').getList(1, 1),
      pb.collection('staff').getList(1, 1, { filter: 'category = "Academic"' }),
      pb.collection('staff').getList(1, 1, { filter: 'category = "Administrative"' }),
      pb.collection('staff').getList(1, 1, { filter: 'category = "Management"' }),
      pb.collection('courses').getList(1, 1),
      pb.collection('courses').getList(1, 1, { filter: 'status = "Published"' }),
      pb.collection('courses').getList(1, 1, { filter: 'level = "Undergraduate"' }),
      pb.collection('courses').getList(1, 1, { filter: 'level = "Postgraduate"' }),
      pb.collection('courses').getList(1, 1, { filter: 'level = "Diploma"' }),
      pb.collection('courses').getList(1, 1, { filter: 'level = "Certificate"' }),
      pb.collection('certificates').getList(1, 1),
      pb.collection('certificates').getList(1, 1, { filter: 'status = "ISSUED"' }),
      pb.collection('certificates').getList(1, 1, { filter: 'status = "REVOKED"' }),
      pb.collection('transactions').getList(1, 1),
      pb.collection('transactions').getList(1, 1, { filter: 'status = "Paid"' }),
      pb.collection('transactions').getList(1, 1, { filter: 'status = "Pending"' }),
      pb.collection('library_items').getList(1, 1),
      pb.collection('library_items').getList(1, 1, { filter: 'status = "Digital"' }),
      pb.collection('library_items').getList(1, 1, { filter: 'status = "Available"' }),
      pb.collection('library_items').getList(1, 1, { filter: 'status = "Borrowed"' }),
    ]);

    // Revenue: fetch only paid transactions (limited to last 1000 for performance)
    const paidTxRecords = await pb.collection('transactions').getList(1, 1000, {
      filter: 'status = "Paid"',
      fields: 'amt',
    });
    const totalRevenue = paidTxRecords.items.reduce((sum: number, t: any) => sum + (t.amt || 0), 0);

    const stats = {
      students: {
        total: studentsAll.totalItems,
        active: studentsActive.totalItems,
        applicants: studentsApplicant.totalItems,
        graduated: studentsGraduated.totalItems,
        byFaculty: {
          Theology: studentsTheology.totalItems,
          ICT: studentsICT.totalItems,
          Business: studentsBusiness.totalItems,
          Education: studentsEducation.totalItems,
        },
      },
      staff: {
        total: staffAll.totalItems,
        byCategory: {
          Academic: staffAcademic.totalItems,
          Administrative: staffAdmin.totalItems,
          Management: staffMgmt.totalItems,
        },
      },
      courses: {
        total: coursesAll.totalItems,
        published: coursesPublished.totalItems,
        byLevel: {
          Undergraduate: coursesUG.totalItems,
          Postgraduate: coursesPG.totalItems,
          Diploma: coursesDip.totalItems,
          Certificate: coursesCert.totalItems,
        },
      },
      certificates: {
        total: certsAll.totalItems,
        issued: certsIssued.totalItems,
        revoked: certsRevoked.totalItems,
      },
      finance: {
        totalRevenue,
        transactions: txAll.totalItems,
        paid: txPaid.totalItems,
        pending: txPending.totalItems,
      },
      library: {
        total: libAll.totalItems,
        digital: libDigital.totalItems,
        available: libAvailable.totalItems,
        borrowed: libBorrowed.totalItems,
      },
    };

    setCached(CACHE_KEY, stats, 30_000); // cache 30 seconds

    return c.json<ApiResponse<typeof stats>>({ success: true, data: stats });

  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    return c.json<ApiResponse<never>>({ success: false, error: 'Failed to fetch dashboard statistics' }, 500);
  }
});

/**
 * GET /api/v1/dashboard/recent-activity
 * Get recent system activity — paginated, no full table scans
 */
dashboardRouter.get('/recent-activity', async (c) => {
  try {
    const pb = getPocketBase();

    const [recentStudents, recentTransactions, recentCertificates] = await Promise.all([
      pb.collection('students').getList(1, 5, { sort: '-created', fields: 'id,firstName,lastName,created' }),
      pb.collection('transactions').getList(1, 5, { sort: '-date', fields: 'id,name,desc,date,amt,status' }),
      pb.collection('certificates').getList(1, 5, { sort: '-issue_date', fields: 'id,student_name,degree,issue_date' }),
    ]);

    const activity = [
      ...recentStudents.items.map((s: any) => ({
        type: 'student',
        action: 'New student registered',
        description: `${s.firstName} ${s.lastName}`,
        timestamp: s.created,
        id: s.id,
      })),
      ...recentTransactions.items.map((t: any) => ({
        type: 'finance',
        action: 'Payment recorded',
        description: `${t.name} - ${t.desc}`,
        timestamp: t.date,
        id: t.id,
        amount: t.amt,
        status: t.status,
      })),
      ...recentCertificates.items.map((c: any) => ({
        type: 'certificate',
        action: 'Certificate issued',
        description: `${c.student_name} - ${c.degree}`,
        timestamp: c.issue_date,
        id: c.id,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return c.json<ApiResponse<typeof activity>>({ success: true, data: activity });

  } catch (error) {
    logger.error('Get recent activity error:', error);
    return c.json<ApiResponse<never>>({ success: false, error: 'Failed to fetch recent activity' }, 500);
  }
});

/**
 * GET /api/v1/dashboard/system-health
 */
dashboardRouter.get('/system-health', async (c) => {
  try {
    const health = {
      database: true,
      api: true,
      ai: false,
      uptime: Math.floor(process.uptime()),
      uptimeHuman: formatUptime(process.uptime()),
    };
    return c.json<ApiResponse<typeof health>>({ success: true, data: health });
  } catch (error) {
    logger.error('Get system health error:', error);
    return c.json<ApiResponse<never>>({ success: false, error: 'Failed to fetch system health' }, 500);
  }
});

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

export default dashboardRouter;
