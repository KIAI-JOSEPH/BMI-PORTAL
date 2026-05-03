/**
 * BMI UMS - Certificate Verification Service
 * Supports:
 * - Online verification (serial + HMAC signature)
 * - Offline verification (self-contained signed JWT in QR)
 * - Legacy hash verification (backward compatibility)
 * - QR code parsing (URL format and offline BMI-VERIFY:: format)
 */

// Use relative path — Vite proxy handles dev, same-origin handles production
const API_URL = '/api/v1';

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

export interface VerifyRequest {
  serial?: string;
  t?: string;         // hidden token from QR (new — unforgeable)
  sig?: string;       // legacy HMAC signature (backward compat)
  hash?: string;      // legacy hash (backward compat)
  offline_jwt?: string;
  method?: 'online' | 'offline' | 'qr_scan';
}

/**
 * Parse a QR code payload into a verify request.
 * Handles three formats:
 * 1. Online URL: https://...verify?id=BMI-2024-123456&sig=abc123
 * 2. Offline JWT: BMI-VERIFY::BMI-2024-123456::eyJ...
 * 3. Plain serial: BMI-2024-123456
 * 4. Legacy URL: https://...verify?id=BMI-2024-123456&hash=abc123
 */
export function parseQRCode(qrContent: string): VerifyRequest | null {
  try {
    // Offline format: BMI-VERIFY::{serial}::{jwt}
    if (qrContent.startsWith('BMI-VERIFY::')) {
      const parts = qrContent.split('::');
      if (parts.length === 3) {
        return { serial: parts[1], offline_jwt: parts[2], method: 'offline' };
      }
    }

    // URL format — ?t= is new hidden token, ?sig= is legacy
    if (qrContent.includes('/verify?') || qrContent.includes('?id=')) {
      const url = new URL(qrContent.startsWith('http') ? qrContent : `https://x.com${qrContent}`);
      const id = url.searchParams.get('id');
      const t = url.searchParams.get('t');
      const sig = url.searchParams.get('sig'); // legacy
      const hash = url.searchParams.get('hash'); // legacy
      if (id) {
        return { serial: id, t: t || undefined, sig: sig || undefined, hash: hash || undefined, method: 'qr_scan' };
      }
    }

    // Plain serial number
    if (/^BMI-\d{4}-\d{6}$/.test(qrContent.trim())) {
      return { serial: qrContent.trim(), method: 'qr_scan' };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Verify a certificate against the backend.
 */
export async function verifyCertificate(req: VerifyRequest): Promise<CertificateData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${API_URL}/certificates/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();

    // The verify endpoint returns CertificateVerificationResult directly (not wrapped in ApiResponse)
    return {
      valid: data.valid,
      certificate: data.certificate,
      verification: data.verification,
      error: data.error,
      code: data.code,
    };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return { valid: false, error: 'Verification timed out. Please try again.', code: 'TIMEOUT' };
    }
    return { valid: false, error: 'Network error. Please check your connection.', code: 'NETWORK_ERROR' };
  }
}

/**
 * Verify a QR code scan — parses the QR content then calls verifyCertificate.
 */
export async function verifyQRCode(qrContent: string): Promise<CertificateData> {
  const req = parseQRCode(qrContent);
  if (!req) {
    return {
      valid: false,
      error: 'Invalid QR code format. This does not appear to be a BMI University certificate.',
      code: 'INVALID_QR',
    };
  }
  return verifyCertificate({ ...req, method: 'qr_scan' });
}

/**
 * Get verification statistics (admin use)
 */
export async function getVerificationStats(token: string): Promise<object | null> {
  try {
    const response = await fetch(`${API_URL}/certificates/verification/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

/**
 * Get verification logs (admin use)
 */
export async function getVerificationLogs(token: string, page = 1): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/certificates/verification/logs?page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    return data.success ? data : null;
  } catch {
    return null;
  }
}

// Unified service object for component use
export const verificationService = {
  verifyCertificate,
  verifyQRCode,
  parseQRCode,
  getVerificationStats,
  getVerificationLogs,
};
