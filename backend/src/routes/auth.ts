// BMI UMS - Authentication Routes (Re-implemented with Best Practices)
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { SignJWT, jwtVerify } from 'jose';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { getPocketBase } from '../services/pocketbase.js';
import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type { ApiResponse, User, JWTPayload } from '../types/index.js';

const authRouter = new Hono();

const SECRET = new TextEncoder().encode(CONFIG.JWT_SECRET);
const COOKIE_NAME = 'bmi_refresh_token';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * Generate Access and Refresh Tokens
 */
async function generateTokens(user: User) {
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

  const refreshToken = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(CONFIG.JWT_REFRESH_EXPIRES_IN)
    .sign(SECRET);

  return { accessToken, refreshToken };
}

/**
 * Set Refresh Token Cookie
 */
function setRefreshCookie(c: any, token: string) {
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: CONFIG.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });
}

/**
 * POST /api/v1/auth/login
 * Authenticate user and return Access Token + Set Refresh Cookie
 */
authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json');
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
    
    const { accessToken, refreshToken } = await generateTokens(user);
    
    // Set refresh token in HTTP-only cookie
    setRefreshCookie(c, refreshToken);
    
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
 * Clear refresh cookie and session
 */
authRouter.post('/logout', async (c) => {
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
authRouter.get('/me', async (c) => {
  const userPayload = c.get('user') as JWTPayload | undefined;
  
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

export default authRouter;
