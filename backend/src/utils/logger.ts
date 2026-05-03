// BMI UMS - Winston Logger Configuration
import winston from 'winston';
import { CONFIG } from '../config/index.js';

const { combine, timestamp, json, errors } = winston.format;

export const logger = winston.createLogger({
  level: CONFIG.LOG_LEVEL,
  defaultMeta: { service: 'bmi-ums-api' },
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  transports: [
    new winston.transports.Console({
      format: CONFIG.NODE_ENV === 'development' 
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : undefined
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
});

// Audit logger for security events
export const auditLogger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/audit.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});
