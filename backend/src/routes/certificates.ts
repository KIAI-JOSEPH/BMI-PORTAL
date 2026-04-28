// BMI UMS - Certificates Routes
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import QRCode from 'qrcode';
import { getPocketBase } from '../services/pocketbase.js';
import { authMiddleware, requireRole, optionalAuthMiddleware } from '../middleware/auth.js';
import { auditMiddleware, logAction } from '../middleware/audit.js';
import { logger } from '../utils/logger.js';
import { parsePagination, generateContentHash, generateCertificateSerial, isValidCertificateSerial } from '../utils/helpers.js';
import { CONFIG } from '../config/index.js';
import type { ApiResponse, Certificate, CertificateVerificationResult } from '../types/index.js';

const certificatesRouter = new Hono();

// Apply auth middleware to all except verification endpoints
certificatesRouter.use('*', optionalAuthMiddleware);
certificatesRouter.use('*', auditMiddleware);

// Validation schemas
const generateCertificateSchema = z.object({
  studentId: z.string().min(1),
  degree: z.string().min(1),
  graduationClass: z.string().optional(),
  graduationDate: z.string().min(1),
  gpa: z.number().min(0).max(4),
});

const verifyCertificateSchema = z.object({
  serial: z.string().min(1),
  hash: z.string().optional(),
});

/**
 * GET /api/v1/certificates
 * List all certificates (admin/registrar only)
 */
certificatesRouter.get('/', requireRole('admin', 'registrar'), async (c) => {
  try {
    const pb = getPocketBase();
    
    const { page, perPage } = parsePagination(
      c.req.query('page'),
      c.req.query('perPage'),
      { page: 1, perPage: 20, maxPerPage: 100 }
    );
    
    const status = c.req.query('status');
    const filters: string[] = [];
    if (status) filters.push(`status = "${status}"`);
    
    const result = await pb.collection('certificates').getList(page, perPage, {
      filter: filters.join(' && ') || undefined,
      sort: '-issue_date',
      expand: 'student_id',
    });
    
    return c.json<ApiResponse<Certificate[]>>({
      success: true,
      data: result.items as unknown as Certificate[],
      meta: {
        page: result.page,
        perPage: result.perPage,
        total: result.totalItems,
      },
    });
    
  } catch (error) {
    logger.error('Get certificates error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to fetch certificates',
    }, 500);
  }
});

/**
 * GET /api/v1/certificates/:id
 * Get a single certificate
 */
certificatesRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const pb = getPocketBase();
    
    const certificate = await pb.collection('certificates').getOne(id, {
      expand: 'student_id',
    });
    
    return c.json<ApiResponse<Certificate>>({
      success: true,
      data: certificate as unknown as Certificate,
    });
    
  } catch (error) {
    logger.error('Get certificate error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Certificate not found',
    }, 404);
  }
});

/**
 * POST /api/v1/certificates/generate
 * Generate a new certificate
 */
certificatesRouter.post(
  '/generate',
  requireRole('admin', 'registrar'),
  zValidator('json', generateCertificateSchema),
  logAction('CREATE', 'certificates'),
  async (c) => {
    try {
      const data = c.req.valid('json');
      const pb = getPocketBase();
      
      // Get student details
      const student = await pb.collection('students').getOne(data.studentId);
      
      // Generate unique serial number
      const year = new Date().getFullYear();
      const existingCerts = await pb.collection('certificates').getFullList({
        filter: `serial_number ~ "BMI-${year}-"`,
      });
      
      const maxSequence = existingCerts.length;
      const serialNumber = generateCertificateSerial(year, maxSequence + 1);
      
      // Generate content hash
      const issueDate = new Date().toISOString().split('T')[0];
      const contentHash = generateContentHash({
        serial: serialNumber,
        studentId: data.studentId,
        name: student.firstName + ' ' + student.lastName,
        degree: data.degree,
        issueDate,
      });
      
      // Create certificate
      const certificate = await pb.collection('certificates').create({
        serial_number: serialNumber,
        student_id: data.studentId,
        student_name: student.firstName + ' ' + student.lastName,
        degree: data.degree,
        graduation_class: data.graduationClass,
        faculty: student.faculty,
        department: student.department,
        issue_date: issueDate,
        graduation_date: data.graduationDate,
        gpa: data.gpa,
        status: 'ISSUED',
        content_hash: contentHash,
        verification_count: 0,
      });
      
      // Update student status to Graduated
      await pb.collection('students').update(data.studentId, {
        status: 'Graduated',
      });
      
      logger.info('Certificate generated', { serialNumber, studentId: data.studentId });
      
      return c.json<ApiResponse<Certificate>>({
        success: true,
        data: certificate as unknown as Certificate,
        message: 'Certificate generated successfully',
      }, 201);
      
    } catch (error) {
      logger.error('Generate certificate error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to generate certificate',
      }, 500);
    }
  }
);

/**
 * POST /api/v1/certificates/verify
 * Verify a certificate (public endpoint)
 */
certificatesRouter.post('/verify', async (c) => {
  try {
    const body = await c.req.json();
    const { serial, hash } = body;
    
    if (!serial || !isValidCertificateSerial(serial)) {
      return c.json<CertificateVerificationResult>({
        valid: false,
        error: 'Invalid certificate serial number format. Expected: BMI-YYYY-NNNNNN',
        code: 'INVALID_FORMAT',
      });
    }
    
    const pb = getPocketBase();
    
    // Find certificate
    const certificates = await pb.collection('certificates').getFullList({
      filter: `serial_number = "${serial}"`,
    });
    
    if (certificates.length === 0) {
      return c.json<CertificateVerificationResult>({
        valid: false,
        error: 'Certificate not found in registry',
        code: 'CERT_NOT_FOUND',
      });
    }
    
    const cert = certificates[0] as unknown as Certificate;
    
    // Check status
    if (cert.status === 'REVOKED') {
      return c.json<CertificateVerificationResult>({
        valid: false,
        error: 'Certificate has been revoked',
        code: 'CERT_REVOKED',
        certificate: {
          serial_number: cert.serial_number,
          student_name: cert.student_name,
          degree_title: cert.degree,
          graduation_class: cert.graduation_class,
          faculty: cert.faculty,
          department: cert.department,
          issue_date: cert.issue_date,
          graduation_date: cert.graduation_date,
          gpa: cert.gpa,
          status: 'revoked',
        },
      });
    }
    
    if (cert.status === 'SUSPENDED') {
      return c.json<CertificateVerificationResult>({
        valid: false,
        error: 'Certificate is temporarily suspended',
        code: 'CERT_SUSPENDED',
      });
    }
    
    // Verify hash
    const hashVerified = !hash || hash === cert.content_hash;
    
    if (hash && !hashVerified) {
      return c.json<CertificateVerificationResult>({
        valid: false,
        error: 'Certificate content has been tampered with',
        code: 'CERT_TAMPERED',
      });
    }
    
    // Increment verification count
    await pb.collection('certificates').update(cert.id, {
      verification_count: (cert.verification_count || 0) + 1,
    });
    
    // Log verification
    logger.info('Certificate verified', { serialNumber: serial, hashVerified });
    
    return c.json<CertificateVerificationResult>({
      valid: true,
      certificate: {
        serial_number: cert.serial_number,
        student_name: cert.student_name,
        degree_title: cert.degree,
        graduation_class: cert.graduation_class,
        faculty: cert.faculty,
        department: cert.department,
        issue_date: cert.issue_date,
        graduation_date: cert.graduation_date,
        gpa: cert.gpa,
        status: 'active',
      },
      verification: {
        timestamp: new Date().toISOString(),
        method: 'online',
        hash_verified: hashVerified,
        verification_count: (cert.verification_count || 0) + 1,
      },
    });
    
  } catch (error) {
    logger.error('Verify certificate error:', error);
    return c.json<CertificateVerificationResult>({
      valid: false,
      error: 'Verification service temporarily unavailable',
      code: 'SERVICE_ERROR',
    }, 500);
  }
});

/**
 * GET /api/v1/certificates/:id/qr
 * Generate QR code for certificate
 */
certificatesRouter.get('/:id/qr', async (c) => {
  try {
    const id = c.req.param('id');
    const pb = getPocketBase();
    
    const certificate = await pb.collection('certificates').getOne(id) as unknown as Certificate;
    
    // Generate verification URL
    const baseUrl = process.env.VITE_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify?id=${certificate.serial_number}&hash=${certificate.content_hash}`;
    
    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#4B0082',
        light: '#FFFFFF',
      },
    });
    
    return c.json<ApiResponse<{ qrCode: string; url: string }>>({
      success: true,
      data: {
        qrCode: qrCodeDataUrl,
        url: verificationUrl,
      },
    });
    
  } catch (error) {
    logger.error('Generate QR error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Failed to generate QR code',
    }, 500);
  }
});

/**
 * PATCH /api/v1/certificates/:id/revoke
 * Revoke a certificate
 */
certificatesRouter.patch(
  '/:id/revoke',
  requireRole('admin'),
  logAction('UPDATE', 'certificates'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const pb = getPocketBase();
      
      await pb.collection('certificates').update(id, {
        status: 'REVOKED',
      });
      
      logger.info('Certificate revoked', { certificateId: id });
      
      return c.json<ApiResponse<null>>({
        success: true,
        data: null,
        message: 'Certificate revoked successfully',
      });
      
    } catch (error) {
      logger.error('Revoke certificate error:', error);
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Failed to revoke certificate',
      }, 500);
    }
  }
);

export default certificatesRouter;
