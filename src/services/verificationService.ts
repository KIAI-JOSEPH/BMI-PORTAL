/**
 * BMI UMS — Unified Document Verification Service
 *
 * Uses POST /api/v1/documents/verify which handles both certificates
 * and transcripts based on the serial number prefix.
 *
 * QR URL scheme (standard):
 *   https://…/verify?id=BMI-TRANS-2026-123456&t=a3f9b2c1d4e5f6a7  (transcript)
 *   https://…/verify?id=BMI-2026-123456&t=a3f9b2c1d4e5f6a7          (certificate)
 *
 * Offline scheme:
 *   BMI-VERIFY::BMI-2026-123456::eyJ…   (certificate offline JWT)
 */

const API_URL = "/api/v1";

// ─── Shared result type ───────────────────────────────────────────────────────
export interface DocumentVerifyResult {
  valid: boolean;
  documentType?: "certificate" | "transcript";
  document?: {
    serial_number: string;
    holder_name: string;
    credential: string;
    institution: string;
    issued_at: string;
    status: "active" | "revoked" | "suspended";
    faculty?: string;
    department?: string;
    graduation_class?: string;
    gpa?: number;
    academic_year?: string;
  };
  verification?: {
    timestamp: string;
    method: string;
    token_verified: boolean;
    confidence: "high" | "medium" | "low";
    verification_count: number;
  };
  error?: string;
  code?: string;
}

export interface VerifyRequest {
  serial: string;
  t?: string; // HMAC nonce token (new, from QR)
  sig?: string; // legacy HMAC sig (backward compat)
  hash?: string; // legacy content hash (backward compat)
  offline_jwt?: string; // offline self-contained JWT
}

// ─── QR parser ───────────────────────────────────────────────────────────────
/**
 * Parse any BMI document QR payload into a verify request.
 *
 * Handles:
 *   1. Online URL  https://…/verify?id=SERIAL&t=TOKEN
 *   2. Offline JWT BMI-VERIFY::SERIAL::eyJ…
 *   3. Plain serial BMI-TRANS-2026-123456  or  BMI-2026-123456
 *   4. Legacy URL  ?id=SERIAL&sig=SIG  or  ?s=SERIAL&h=HASH
 */
export function parseQRPayload(qrContent: string): VerifyRequest | null {
  const s = qrContent.trim();

  // ── Offline format ────────────────────────────────────────────────────────
  if (s.startsWith("BMI-VERIFY::")) {
    const parts = s.split("::");
    if (parts.length === 3) {
      return { serial: parts[1], offline_jwt: parts[2] };
    }
  }

  // ── URL format ────────────────────────────────────────────────────────────
  if (s.includes("/verify?") || s.includes("?id=") || s.includes("?s=")) {
    try {
      const url = new URL(s.startsWith("http") ? s : `https://x.com${s}`);
      // New unified scheme: ?id=SERIAL&t=TOKEN
      const id = url.searchParams.get("id");
      const t = url.searchParams.get("t");
      // Legacy schemes
      const legacySig = url.searchParams.get("sig");
      const legacyHash =
        url.searchParams.get("h") || url.searchParams.get("hash");
      const legacySerial = url.searchParams.get("s"); // old DocumentService format

      const serial = id || legacySerial;
      if (serial) {
        return {
          serial,
          t: t || undefined,
          sig: legacySig || undefined,
          hash: legacyHash || undefined,
        };
      }
    } catch {
      // fall through
    }
  }

  // ── Plain serial number ───────────────────────────────────────────────────
  if (/^BMI-(TRANS-)?\d{4}-\d{6}$/i.test(s)) {
    return { serial: s.toUpperCase() };
  }

  return null;
}

// ─── Core verify call ─────────────────────────────────────────────────────────
/**
 * Verify a document against the backend.
 * Accepts any BMI document serial — the backend routes by prefix.
 */
export async function verifyDocument(
  req: VerifyRequest,
): Promise<DocumentVerifyResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(`${API_URL}/documents/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    return data as DocumentVerifyResult;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      return {
        valid: false,
        error:
          "Verification timed out. Please check your connection and try again.",
        code: "TIMEOUT",
      };
    }
    return {
      valid: false,
      error: "Network error. Please check your connection.",
      code: "NETWORK_ERROR",
    };
  }
}

/**
 * Parse a QR scan and immediately verify.
 */
export async function verifyQRScan(
  qrContent: string,
): Promise<DocumentVerifyResult> {
  const req = parseQRPayload(qrContent);
  if (!req) {
    return {
      valid: false,
      error:
        "Invalid QR code. This does not appear to be a BMI University document.",
      code: "INVALID_QR",
    };
  }
  return verifyDocument(req);
}

// ─── Backward-compat aliases ─────────────────────────────────────────────────
/** @deprecated Use verifyDocument() */
export async function verifyCertificate(
  req: VerifyRequest,
): Promise<DocumentVerifyResult> {
  return verifyDocument(req);
}
/** @deprecated Use verifyQRScan() */
export async function verifyQRCode(
  qrContent: string,
): Promise<DocumentVerifyResult> {
  return verifyQRScan(qrContent);
}
export function parseQRCode(qrContent: string): VerifyRequest | null {
  return parseQRPayload(qrContent);
}

// Admin helpers
export async function getVerificationStats(
  token: string,
): Promise<object | null> {
  try {
    const res = await fetch(`${API_URL}/certificates/verification/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

export const verificationService = {
  verifyDocument,
  verifyQRScan,
  verifyCertificate,
  verifyQRCode,
  parseQRPayload,
  parseQRCode,
  getVerificationStats,
};
