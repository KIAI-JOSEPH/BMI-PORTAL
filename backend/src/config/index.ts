// BMI UMS - Configuration
import { config } from 'dotenv';

config();

export const CONFIG = {
  // Server
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  BCRYPT_ROUNDS: 12,
  
  // Encryption (for data at rest)
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'your-32-char-encryption-key!',
  
  // PocketBase
  POCKETBASE_URL: process.env.POCKETBASE_URL || 'http://127.0.0.1:8090',
  POCKETBASE_ADMIN_EMAIL: process.env.POCKETBASE_ADMIN_EMAIL || 'admin@bmi.edu',
  POCKETBASE_ADMIN_PASSWORD: process.env.POCKETBASE_ADMIN_PASSWORD || 'admin123456',
  
  // Ollama (Local LLM)
  OLLAMA_URL: process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3.2',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100, // per window
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || './logs/app.log',
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Validation
export function validateConfig(): void {
  if (CONFIG.NODE_ENV === 'production') {
    if (CONFIG.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
      console.warn('⚠️ WARNING: Using default JWT secret in production!');
    }
    if (CONFIG.ENCRYPTION_KEY === 'your-32-char-encryption-key!') {
      console.warn('⚠️ WARNING: Using default encryption key in production!');
    }
  }
}
