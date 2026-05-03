// BMI UMS - Encryption Utilities
// Uses Node.js built-in crypto (AES-256-GCM) — authenticated encryption
// CryptoJS is kept only for legacy hash utilities

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { CONFIG } from '../config/index.js';

// Derive a proper 32-byte key from the config string using SHA-256
const KEY = createHash('sha256').update(CONFIG.ENCRYPTION_KEY).digest();

const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt data using AES-256-GCM (authenticated encryption)
 * Returns: iv:authTag:ciphertext (all hex)
 */
export function encrypt<T>(data: T): string {
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const jsonString = JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(jsonString, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt<T>(encryptedData: string): T {
  const [ivHex, authTagHex, cipherHex] = encryptedData.split(':');
  if (!ivHex || !authTagHex || !cipherHex) throw new Error('Invalid encrypted data format');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(cipherHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8')) as T;
}

/**
 * Hash sensitive data (one-way, for comparison) using HMAC-SHA256
 */
export function hashData(data: string): string {
  return createHash('sha256').update(data + CONFIG.ENCRYPTION_KEY).digest('hex');
}

/**
 * Generate a cryptographically secure random token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}
