// BMI UMS - Encryption Utilities (AES-256 for data at rest)
import CryptoJS from 'crypto-js';
import { CONFIG } from '../config/index.js';

const SECRET_KEY = CONFIG.ENCRYPTION_KEY;

/**
 * Encrypt data using AES-256
 */
export function encrypt<T>(data: T): string {
  const jsonString = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
}

/**
 * Decrypt data using AES-256
 */
export function decrypt<T>(encryptedData: string): T {
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decryptedString) as T;
}

/**
 * Hash sensitive data (one-way, for comparison)
 */
export function hashData(data: string): string {
  return CryptoJS.SHA256(data + SECRET_KEY).toString();
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomValues = CryptoJS.lib.WordArray.random(length);
  for (let i = 0; i < length; i++) {
    token += chars.charAt(randomValues.words[i] % chars.length);
  }
  return token;
}
