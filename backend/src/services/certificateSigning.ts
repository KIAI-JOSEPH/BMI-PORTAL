/**
 * BMI UMS - Certificate Digital Signing Service
 *
 * THREE-LAYER SECURITY ARCHITECTURE:
 *
 * Layer 1 — Content Hash (SHA-256, stored in DB, printed truncated on cert)
 *   Detects if any visible field was altered after issuance.
 *
 * Layer 2 — HMAC-SHA256 Hidden Token (NEVER printed, embedded only in QR)
 *   The QR URL contains: ?id=SERIAL&t=TOKEN
 *   TOKEN = HMAC(serial + studentId + issueDate + issuanceNonce, SECRET_KEY)
 *   The issuanceNonce is a random 16-byte value generated at issuance time.
 *   It is stored ONLY in the database — never on the certificate.
 *   Even if someone copies the serial number, they cannot forge the token
 *   because they don't know the nonce or the SECRET_KEY.
 *
 * Layer 3 — Offline JWT (self-contained, signed, for offline verification)
 *   Embedded in QR for environments without internet.
 *
 * WHAT AN ATTACKER SEES on the printed certificate:
 *   - Serial number (e.g. BMI/CER/2026/007960)
 *   - Truncated hash (e.g. A3F9B2C1-DE35-04F1)
 *   - QR code (encodes URL with hidden token)
 *
 * WHAT AN ATTACKER CANNOT COMPUTE:
 *   - The issuance nonce (random, stored only in DB)
 *   - The HMAC token (requires nonce + SECRET_KEY)
 *   - Therefore: cannot forge a valid QR for any certificate
 */

import { createHmac, createHash, randomBytes, timingSafeEqual } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';

// ─── Signing key derived from JWT_SECRET ─────────────────────────────────────
const SIGNING_KEY = createHash('sha256')
  .update(CONFIG.JWT_SECRET + '-cert-signing-v1')
  .digest();

// ─── Layer 1: Content Hash ────────────────────────────────────────────────────

/**
 * Generate SHA-256 content hash for tamper detection.
 * Covers all visible fields — any change invalidates the hash.
 * Stored in DB and printed (truncated) on the certificate.
 */
export async function generateContentHash(data: {
  serial: string;
  studentId: string;
  name: string;
  degree: string;
  issueDate: string;
}): Promise<string> {
  const input = [
    data.serial,
    data.studentId,
    data.name.toUpperCase().trim(),
    data.degree.toUpperCase().trim(),
    'BMI UNIVERSITY',
    data.issueDate,
  ].join('|');
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

// ─── Layer 2: Hidden HMAC Token ───────────────────────────────────────────────

/**
 * Generate a cryptographically random issuance nonce.
 * This is generated ONCE at certificate issuance and stored ONLY in the database.
 * It is NEVER printed on the certificate or shown to anyone.
 * Without this nonce, the QR token cannot be computed or forged.
 */
export function generateIssuanceNonce(): string {
  return randomBytes(16).toString('hex'); // 32 hex chars, 128 bits of entropy
}

/**
 * Build the canonical signing payload for the hidden QR token.
 * Includes the secret nonce — this is what makes the token unguessable.
 */
function buildHiddenPayload(data: {
  serial: string;
  studentId: string;
  issueDate: string;
  nonce: string; // secret — never printed
}): string {
  return [
    data.serial,
    data.studentId,
    data.issueDate,
    data.nonce,
    'BMI-CERT-TOKEN-V1',
  ].join('::');
}

/**
 * Generate the hidden QR token.
 * Returns 24 hex chars — compact for URLs, 96 bits of security.
 *
 * This token is embedded in the QR code URL as ?t=TOKEN
 * It is NOT printed anywhere on the certificate.
 * It can ONLY be verified by the server which has the nonce in its database.
 */
export function generateHiddenToken(data: {
  serial: string;
  studentId: string;
  issueDate: string;
  nonce: string;
}): string {
  const payload = buildHiddenPayload(data);
  return createHmac('sha256', SIGNING_KEY)
    .update(payload)
    .digest('hex')
    .substring(0, 24);
}

/**
 * Verify the hidden QR token using timing-safe comparison.
 * The server recomputes the token from its stored nonce and compares.
 *
 * Returns: 'valid' | 'invalid' | 'tampered'
 */
export function verifyHiddenToken(
  token: string,
  data: { serial: string; studentId: string; issueDate: string; nonce: string }
): boolean {
  if (!token || token.length !== 24) return false;
  const expected = generateHiddenToken(data);
  try {
    return timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(token, 'hex')
    );
  } catch {
    return false;
  }
}

// ─── Legacy: HMAC signature (kept for backward compatibility) ─────────────────

export function buildSigningPayload(data: {
  serial: string;
  studentId: string;
  studentName: string;
  degree: string;
  faculty: string;
  issueDate: string;
  gpa: number;
}): string {
  return [
    data.serial, data.studentId,
    data.studentName.toUpperCase().trim(),
    data.degree.toUpperCase().trim(),
    data.faculty.toUpperCase().trim(),
    data.issueDate, data.gpa.toFixed(2), 'BMI-UNIVERSITY',
  ].join('|');
}

export function signCertificate(payload: string): string {
  return createHmac('sha256', SIGNING_KEY).update(payload).digest('hex').substring(0, 32);
}

export function verifyCertificateSignature(payload: string, signature: string): boolean {
  if (!signature || signature.length !== 32) return false;
  const expected = signCertificate(payload);
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch { return false; }
}

// ─── Layer 3: Offline JWT ─────────────────────────────────────────────────────

export async function generateOfflineJWT(data: {
  serial: string;
  studentName: string;
  degree: string;
  faculty: string;
  issueDate: string;
  graduationClass: string;
}): Promise<string> {
  const secret = new TextEncoder().encode(CONFIG.JWT_SECRET + '-offline-cert-v1');
  return new SignJWT({
    sn: data.serial,
    n: data.studentName,
    d: data.degree,
    f: data.faculty,
    dt: data.issueDate,
    cl: data.graduationClass,
    iss: 'BMI University',
    aud: 'certificate-verifier',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('50y')
    .sign(secret);
}

export async function verifyOfflineJWT(token: string): Promise<{
  serial: string; studentName: string; degree: string;
  faculty: string; issueDate: string; graduationClass: string;
} | null> {
  try {
    const secret = new TextEncoder().encode(CONFIG.JWT_SECRET + '-offline-cert-v1');
    const { payload } = await jwtVerify(token, secret, {
      audience: 'certificate-verifier',
      issuer: 'BMI University',
    });
    return {
      serial: payload.sn as string, studentName: payload.n as string,
      degree: payload.d as string, faculty: payload.f as string,
      issueDate: payload.dt as string, graduationClass: payload.cl as string,
    };
  } catch (error) {
    logger.warn('Offline JWT verification failed:', error);
    return null;
  }
}

// ─── QR URL Builder ───────────────────────────────────────────────────────────

/**
 * Build the verification URL for the QR code.
 *
 * Format: https://bmi.ac.ke/verify?id=BMI-2026-007960&t=a3f9b2c1d4e5f6a7b8c9d0e1
 *
 * The URL contains:
 *   id  = serial number (visible on certificate — public)
 *   t   = hidden token (NOT printed anywhere — only in QR)
 *
 * An attacker who copies the serial number cannot forge the token.
 * An attacker who photographs the QR gets a token that only works for
 * that exact certificate — changing any field invalidates it.
 */
export function buildVerificationUrl(serial: string, hiddenToken: string, baseUrl?: string): string {
  const base = baseUrl || process.env.VITE_APP_URL || 'http://localhost:3000';
  return `${base}/verify?id=${encodeURIComponent(serial)}&t=${encodeURIComponent(hiddenToken)}`;
}

export function buildOfflineQRPayload(serial: string, offlineJWT: string): string {
  return `BMI-VERIFY::${serial}::${offlineJWT}`;
}

export function parseQRPayload(qrContent: string): {
  type: 'online' | 'offline';
  serial?: string;
  token?: string;
  offlineJWT?: string;
} | null {
  try {
    if (qrContent.startsWith('BMI-VERIFY::')) {
      const parts = qrContent.split('::');
      if (parts.length === 3) return { type: 'offline', serial: parts[1], offlineJWT: parts[2] };
    }
    if (qrContent.includes('/verify?') || qrContent.includes('?id=')) {
      const url = new URL(qrContent.startsWith('http') ? qrContent : `https://x.com${qrContent}`);
      const id = url.searchParams.get('id');
      const t = url.searchParams.get('t');
      const sig = url.searchParams.get('sig'); // legacy
      if (id) return { type: 'online', serial: id, token: t || sig || undefined };
    }
    if (/^BMI[-/]\d{4}[-/]/.test(qrContent.trim())) {
      return { type: 'online', serial: qrContent.trim() };
    }
    return null;
  } catch { return null; }
}
