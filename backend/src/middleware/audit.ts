// BMI UMS - Audit Logging Middleware
import type { Context, Next } from 'hono';
import { auditLogger } from '../utils/logger.js';
import type { AuditLog } from '../types/index.js';

/**
 * Audit Logging Middleware
 * Logs all requests to the audit log
 */
export async function auditMiddleware(c: Context, next: Next) {
  const start = Date.now();
  const user = c.get('user') as { sub: string; email: string } | undefined;
  
  // Log the request
  auditLogger.info('Request started', {
    method: c.req.method,
    path: c.req.path,
    userId: user?.sub || 'anonymous',
    userEmail: user?.email || 'anonymous',
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
    userAgent: c.req.header('user-agent'),
    timestamp: new Date().toISOString(),
  });
  
  await next();
  
  // Log the response
  const duration = Date.now() - start;
  auditLogger.info('Request completed', {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: `${duration}ms`,
    userId: user?.sub || 'anonymous',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log a specific action to the audit log
 */
export function logAction(
  action: AuditLog['action'],
  resource: string,
  details?: Record<string, unknown>
) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as { sub: string; email: string } | undefined;
    
    // Execute the handler first
    await next();
    
    // Only log if the response was successful
    if (c.res.status >= 200 && c.res.status < 300) {
      auditLogger.info('Action performed', {
        action,
        resource,
        userId: user?.sub || 'anonymous',
        userEmail: user?.email || 'anonymous',
        details,
        ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
        timestamp: new Date().toISOString(),
      });
    }
  };
}
