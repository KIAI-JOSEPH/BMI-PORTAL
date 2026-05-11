// BMI UMS - Authentication Routes (Re-implemented with Best Practices)
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { SignJWT, jwtVerify } from 'jose';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { rateLimiter } from 'hono-rate-limiter';
import { getPocketBase } from '../services/pocketbase.js';
import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { authMiddleware, getUser } from '../middleware/auth.js';
import { revokeToken } from '../services/tokenBlacklist.js';
import type { ApiResponse, User, JWTPayload } from '../types/index.js';

const authRouter = new Hono();

const SECRET = new TextEncoder().encode(CONFIG.JWT_SECRET);
const COOKIE_NAME = 'bmi_refresh_token';

// Strict rate limiter for login — 10 attempts per 15 minutes per IP
const loginRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  keyGenerator: (c) =>
    c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
  message: { success: false, error: 'Too many login attempts. Please try again in 15 minutes.' },
});

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password too long'),
  rememberMe: z.boolean().optional().default(false),
});

/**
 * Generate Access and Refresh Tokens
 */
async function generateTokens(user: User, rememberMe: boolean = false) {
  const accessToken = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(CONFIG.JWT_ACCESS_EXPIRES_IN)
    .sign(SECRET);

  // Extend refresh token to 30 days if rememberMe, otherwise 7 days
  const refreshExpiry = rememberMe ? '30d' : CONFIG.JWT_REFRESH_EXPIRES_IN;
  
  const refreshToken = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(refreshExpiry)
    .sign(SECRET);

  return { accessToken, refreshToken, refreshExpiry };
}

/**
 * Set Refresh Token Cookie
 */
function setRefreshCookie(c: any, token: string, maxAgeDays: number = 7) {
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: CONFIG.NODE_ENV === 'production', // Only secure in production
    sameSite: CONFIG.NODE_ENV === 'production' ? 'Strict' : 'Lax',
    path: '/',
    maxAge: maxAgeDays * 24 * 60 * 60,
  });
}

/**
 * POST /api/v1/auth/login
 * Authenticate user and return Access Token + Set Refresh Cookie
 */
authRouter.post('/login', loginRateLimiter, zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password, rememberMe } = c.req.valid('json');
    const pb = getPocketBase();
    
    // Authenticate with PocketBase
    const authData = await pb.collection('users').authWithPassword(email, password);
    const user = authData.record as unknown as User;
    
    if (!user.isActive) {
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Account is deactivated',
      }, 403);
    }
    
    const { accessToken, refreshToken, refreshExpiry } = await generateTokens(user, rememberMe);
    
    // Parse expiry to get days (e.g., '30d' -> 30)
    const maxAgeDays = parseInt(refreshExpiry, 10) || 7;
    
    // Set refresh token in HTTP-only cookie
    setRefreshCookie(c, refreshToken, maxAgeDays);
    
    // Update last login
    await pb.collection('users').update(user.id, {
      lastLogin: new Date().toISOString(),
    });
    
    logger.info('User logged in', { userId: user.id, email: user.email });
    
    return c.json<ApiResponse<{ token: string; user: Omit<User, 'password'> }>>({
      success: true,
      data: {
        token: accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          created: user.created,
          updated: user.updated,
        },
      },
    });
    
  } catch (error) {
    logger.error('Login error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Invalid credentials',
    }, 401);
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token from cookie
 */
authRouter.post('/refresh', async (c) => {
  const refreshToken = getCookie(c, COOKIE_NAME);
  
  if (!refreshToken) {
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Refresh token missing',
    }, 401);
  }
  
  try {
    const { payload } = await jwtVerify(refreshToken, SECRET);
    const jwtPayload = payload as unknown as JWTPayload;
    
    if (jwtPayload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    const pb = getPocketBase();
    const user = await pb.collection('users').getOne(jwtPayload.sub) as unknown as User;
    
    if (!user.isActive) {
      return c.json<ApiResponse<never>>({
        success: false,
        error: 'Account deactivated',
      }, 403);
    }
    
    // Generate new pair (Token Rotation)
    const tokens = await generateTokens(user);
    setRefreshCookie(c, tokens.refreshToken);
    
    return c.json<ApiResponse<{ token: string }>>({
      success: true,
      data: { token: tokens.accessToken },
    });
    
  } catch (error) {
    logger.error('Refresh token error:', error);
    deleteCookie(c, COOKIE_NAME);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Invalid refresh token',
    }, 401);
  }
});

/**
 * POST /api/v1/auth/logout
 * Revoke access token + clear refresh cookie
 */
authRouter.post('/logout', authMiddleware, async (c) => {
  // Revoke the current access token immediately
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const { payload } = await jwtVerify(token, SECRET);
      const expMs = (payload.exp ?? 0) * 1000;
      revokeToken(token, expMs);
    } catch {
      // Token already invalid — no action needed
    }
  }

  deleteCookie(c, COOKIE_NAME);
  return c.json<ApiResponse<null>>({
    success: true,
    data: null,
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/v1/auth/me
 * Get current user info (requires auth middleware)
 */
authRouter.get('/me', authMiddleware, async (c) => {
  const userPayload = getUser(c);
  
  if (!userPayload) {
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Not authenticated',
    }, 401);
  }
  
  try {
    const pb = getPocketBase();
    const userRecord = await pb.collection('users').getOne(userPayload.sub);
    
    return c.json<ApiResponse<User>>({
      success: true,
      data: userRecord as unknown as User,
    });
    
  } catch (error) {
    logger.error('Get user error:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'User not found',
    }, 404);
  }
});

/**
 * POST /api/v1/auth/forgot-password
 * Request password reset email
 */
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

authRouter.post('/forgot-password', zValidator('json', forgotPasswordSchema), async (c) => {
  try {
    const { email } = c.req.valid('json');
    const pb = getPocketBase();
    
    // PocketBase handles password reset email
    await pb.collection('users').requestPasswordReset(email);
    
    logger.info('Password reset requested', { email });
    
    return c.json<ApiResponse<null>>({
      success: true,
      data: null,
      message: 'Password reset email sent. Please check your inbox.',
    });
  } catch (error) {
    // Don't reveal if email exists (security best practice)
    logger.warn('Password reset request failed or email not found:', error);
    
    // Return same message regardless of success/failure
    return c.json<ApiResponse<null>>({
      success: true,
      data: null,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  }
});

/**
 * POST /api/v1/auth/reset-password
 * Complete password reset with token
 */
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Passwords do not match',
  path: ['passwordConfirm'],
});

authRouter.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
  try {
    const { token, password } = c.req.valid('json');
    const pb = getPocketBase();
    
    // Complete password reset via PocketBase
    await pb.collection('users').confirmPasswordReset(token, password, password);
    
    logger.info('Password reset completed');
    
    return c.json<ApiResponse<null>>({
      success: true,
      data: null,
      message: 'Password reset successful. Please log in with your new password.',
    });
  } catch (error) {
    logger.error('Password reset failed:', error);
    return c.json<ApiResponse<never>>({
      success: false,
      error: 'Invalid or expired reset token. Please request a new password reset.',
    }, 400);
  }
});

export default authRouter;
// Change password endpoint
authRoutes.post('/change-password', async (c) => {
    try {
        const { currentPassword, newPassword } = await c.req.json();

        if (!currentPassword || !newPassword) {
            return c.json({ success: false, error: 'Current password and new password are required' }, 400);
        }

        if (newPassword.length < 8) {
            return c.json({ success: false, error: 'New password must be at least 8 characters' }, 400);
        }

        const authHeader = c.req.header('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return c.json({ success: false, error: 'Unauthorized' }, 401);
        }

        const token = authHeader.substring(7);
        const { getPocketBase } = await import('../services/pocketbase');
        const pb = getPocketBase();

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const user = await pb.collection('users').getOne(payload.sub || payload.id);

            await pb.collection('users').authWithPassword(user.email, currentPassword);

            await pb.collection('users').update(user.id, {
                password: newPassword,
                passwordConfirm: newPassword,
            });

            return c.json({ success: true, message: 'Password updated successfully' });
        } catch {
            return c.json({ success: false, error: 'Current password is incorrect' }, 401);
        }
    } catch (error) {
        return c.json({ success: false, error: 'Failed to update password' }, 500);
    }
});
