/**
 * BMI UMS - Certificate Verification Service
 * Connects to the backend API for certificate verification
 */

const API_URL = 'http://localhost:3001/api/v1';

export interface CertificateData {
  valid: boolean;
  certificate?: {
    serial_number: string;
    student_name: string;
    degree_title: string;
    graduation_class?: string;
    faculty: string;
    department: string;
    issue_date: string;
    graduation_date: string;
    gpa: number;
    status: 'active' | 'revoked' | 'suspended';
  };
  verification?: {
    timestamp: string;
    method: 'online' | 'offline' | 'qr_scan';
    hash_verified: boolean;
    verification_count: number;
  };
  error?: string;
  code?: string;
}

/**
 * Verify a certificate by serial number
 */
export async function verifyCertificate(
  serialNumber: string,
  options?: { qrScan?: boolean }
): Promise<CertificateData> {
  try {
    const response = await fetch(`${API_URL}/certificates/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serial_number: serialNumber,
        method: options?.qrScan ? 'qr_scan' : 'online',
      }),
    });

    const data = await response.json();

    if (!data.success) {
      return {
        valid: false,
        error: data.error || 'Verification failed',
        code: data.code || 'VERIFICATION_FAILED',
      };
    }

    return {
      valid: data.data.valid,
      certificate: data.data.certificate,
      verification: data.data.verification,
    };
  } catch (error) {
    console.error('Certificate verification error:', error);
    return {
      valid: false,
      error: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Get certificate by ID
 */
export async function getCertificate(id: string): Promise<CertificateData> {
  try {
    const response = await fetch(`${API_URL}/certificates/${id}`);
    const data = await response.json();

    if (!data.success) {
      return {
        valid: false,
        error: data.error || 'Certificate not found',
        code: 'NOT_FOUND',
      };
    }

    return {
      valid: data.data.status === 'ISSUED',
      certificate: {
        serial_number: data.data.serial_number,
        student_name: data.data.student_name,
        degree_title: data.data.degree,
        graduation_class: data.data.graduation_class,
        faculty: data.data.faculty,
        department: data.data.department,
        issue_date: data.data.issue_date,
        graduation_date: data.data.graduation_date,
        gpa: data.data.gpa,
        status: data.data.status.toLowerCase() as 'active' | 'revoked' | 'suspended',
      },
      verification: {
        timestamp: new Date().toISOString(),
        method: 'online',
        hash_verified: true,
        verification_count: data.data.verification_count,
      },
    };
  } catch (error) {
    console.error('Get certificate error:', error);
    return {
      valid: false,
      error: 'Network error',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Generate QR code URL for certificate
 */
export function getQRCodeUrl(serialNumber: string): string {
  return `${API_URL}/certificates/qr/${serialNumber}`;
}

/**
 * Check if backend is available
 */
export async function isBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL.replace('/api/v1', '')}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Legacy export for compatibility
export const verificationService = {
  verifyCertificate,
  getCertificate,
  getQRCodeUrl,
  isBackendAvailable,
};
