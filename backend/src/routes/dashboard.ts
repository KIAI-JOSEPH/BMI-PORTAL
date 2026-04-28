// BMI UMS - Dashboard Routes (Aggregated Statistics)
import { Hono } from 'hono';
import { getPocketBase } from '../services/pocketbase.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import type { ApiResponse } from '../types/index.js';

const dashboardRouter = new Hono();

// Apply auth middleware
dashboardRouter.use('*', authMiddleware);

/**
 * GET /api/v1/dashboard/stats
 * Get comprehensive dashboard statistics
 */
dashboardRouter.get('/stats', async (c) => {
  try {
    const pb = getPocketBase();
    
    // Fetch all collections in parallel
    const [
      students,
      staff,
      courses,
      certificates,
      transactions,
      libraryItems,
    ] = await Promise.all([
      pb.collection('students').getFullList(),
      pb.collection('staff').getFullList(),
      pb.collection('courses').getFullList(),
      pb.collection('certificates').getFullList(),
      pb.collection('transactions').getFullList(),
      pb.collection('library_items').getFullList(),
    ]);
    
    const paidTransactions = transactions.filter(t => t.status === 'Paid');
    const totalRevenue = paidTransactions.reduce((sum, t) => sum + (t.amt || 0), 0);
    
    const stats = {
      students: {
        total: students.length,
        active: students.filter((s: any) => s.status === 'Active').length,
        applicants: students.filter((s: any) => s.status === 'Applicant').length,
        graduated: students.filter((s: any) => s.status === 'Graduated').length,
        byFaculty: {
          Theology: students.filter((s: any) => s.faculty === 'Theology').length,
          ICT: students.filter((s: any) => s.faculty === 'ICT').length,
          Business: students.filter((s: any) => s.faculty === 'Business').length,
          Education: students.filter((s: any) => s.faculty === 'Education').length,
        },
      },
      staff: {
        total: staff.length,
        byCategory: {
          Academic: staff.filter((s: any) => s.category === 'Academic').length,
          Administrative: staff.filter((s: any) => s.category === 'Administrative').length,
          Management: staff.filter((s: any) => s.category === 'Management').length,
        },
      },
      courses: {
        total: courses.length,
        published: courses.filter((c: any) => c.status === 'Published').length,
        byLevel: {
          Undergraduate: courses.filter((c: any) => c.level === 'Undergraduate').length,
          Postgraduate: courses.filter((c: any) => c.level === 'Postgraduate').length,
          Diploma: courses.filter((c: any) => c.level === 'Diploma').length,
          Certificate: courses.filter((c: any) => c.level === 'Certificate').length,
        },
      },
      certificates: {
        total: certificates.length,
        issued: certificates.filter((c: any) => c.status === 'ISSUED').length,
        revoked: certificates.filter((c: any) => c.status === 'REVOKED').length,
        totalVerifications: certificates.reduce((sum: number, c: any) => sum + (c.verification_count || 0), 0),
      },
      finance: {
        totalRevenue,
        transactions: transactions.length,
        paid: paidTransactions.length,
        pending: transactions.filter((t: any) => t.status === 'Pending').length,
      },
      library: {
        total: libraryItems.length,
        digital: libraryItems.filter((i: any) => i.status === 'Digital').length,
        available: libraryItems.filter((i: any) => i.status === 'Available').length,
        borrowed: libraryItems.filter((i: any) => i.status === 'Borrowed').length,
      },
    };
    
    return c.json<ApiResponse<typeof stats>>({
      success: true,
      data: stats,
    });
    
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch dashboard statistics',
    }, 500);
  }
});

/**
 * GET /api/v1/dashboard/recent-activity
 * Get recent system activity
 */
dashboardRouter.get('/recent-activity', async (c) => {
  try {
    const pb = getPocketBase();
    
    // Get recent items from various collections
    const [
      recentStudents,
      recentTransactions,
      recentCertificates,
    ] = await Promise.all([
      pb.collection('students').getList(1, 5, { sort: '-created' }),
      pb.collection('transactions').getList(1, 5, { sort: '-date' }),
      pb.collection('certificates').getList(1, 5, { sort: '-issue_date' }),
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
    
    return c.json<ApiResponse<typeof activity>>({
      success: true,
      data: activity,
    });
    
  } catch (error) {
    logger.error('Get recent activity error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch recent activity',
    }, 500);
  }
});

/**
 * GET /api/v1/dashboard/system-health
 * Get system health status
 */
dashboardRouter.get('/system-health', async (c) => {
  try {
    const health = {
      database: true,
      api: true,
      ai: false,
      lastBackup: null as string | null,
      uptime: process.uptime(),
    };
    
    return c.json<ApiResponse<typeof health>>({
      success: true,
      data: health,
    });
    
  } catch (error) {
    logger.error('Get system health error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch system health',
    }, 500);
  }
});

export default dashboardRouter;
