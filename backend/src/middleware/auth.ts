// BMI UMS - Authentication Middleware

import type { Context, Next } from 'hono';
import { jwtVerify } from 'jose';
import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';

const SECRET = new TextEncoder().encode(CONFIG.JWT_SECRET);

// Store user data in a WeakMap attached to context
const userContext = new WeakMap<Context, { sub: string; email: string; role: string }>();

/**
 * Verify JWT token
 */
async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { sub: string; email: string; role: string };
  } catch {
    return null;
  }
}

/**
 * JWT Authentication Middleware
 * Verifies Bearer token and attaches user to context
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error: 'Authentication required',
    }, 401);
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return c.json({
      success: false,
      error: 'Invalid or expired token',
    }, 401);
  }

  // Store user info
  userContext.set(c, payload);
  
  await next();
}

/**
 * Get user from context
 */
export function getUser(c: Context) {
  return userContext.get(c);
}

/**
 * Role-based Authorization Middleware
 * Checks if user has required role
 */
export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = getUser(c);

    if (!user) {
      return c.json({
        success: false,
        error: 'Authentication required',
      }, 401);
    }

    if (!allowedRoles.includes(user.role)) {
      logger.warn(`Access denied: user with role '${user.role}' attempted unauthorized access`);
      return c.json({
        success: false,
        error: 'Access denied: insufficient permissions',
      }, 403);
    }

    await next();
  };
}

/**
 * Optional Auth Middleware
 * Attaches user if token valid, but doesn't reject if missing/invalid
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    if (payload) {
      c.set('user', payload);
    }
  }

  await next();
}
