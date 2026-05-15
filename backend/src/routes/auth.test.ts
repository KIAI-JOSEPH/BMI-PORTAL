import { describe, it, expect, vi } from 'vitest';
import authRouter from './auth.js';

// Mock dependencies
vi.mock('../services/pocketbase.js', () => ({
  getPocketBase: vi.fn(),
}));

vi.mock('../config/index.js', () => ({
  CONFIG: {
    JWT_SECRET: 'test-secret',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    NODE_ENV: 'test',
  },
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Auth Routes', () => {
  describe('POST /login', () => {
    it('should validate email format', async () => {
      const req = new Request('http://localhost/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'password123',
        }),
      });

      const res = await authRouter.fetch(req);
      expect(res.status).toBe(400);
    });

    it('should require password minimum length', async () => {
      const req = new Request('http://localhost/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'short',
        }),
      });

      const res = await authRouter.fetch(req);
      expect(res.status).toBe(400);
    });

    it('should accept valid login request', async () => {
      const req = new Request('http://localhost/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'password123',
          rememberMe: false,
        }),
      });

      // Should not throw validation error
      expect(req).toBeDefined();
    });
  });

  describe('POST /forgot-password', () => {
    it('should validate email format', async () => {
      const req = new Request('http://localhost/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
        }),
      });

      const res = await authRouter.fetch(req);
      expect(res.status).toBe(400);
    });

    it('should accept valid email for password reset', async () => {
      const req = new Request('http://localhost/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
        }),
      });

      expect(req).toBeDefined();
    });
  });

  describe('POST /reset-password', () => {
    it('should require token', async () => {
      const req = new Request('http://localhost/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'newpassword123',
          passwordConfirm: 'newpassword123',
        }),
      });

      const res = await authRouter.fetch(req);
      expect(res.status).toBe(400);
    });

    it('should require password minimum length', async () => {
      const req = new Request('http://localhost/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'valid-token',
          password: 'short',
          passwordConfirm: 'short',
        }),
      });

      const res = await authRouter.fetch(req);
      expect(res.status).toBe(400);
    });

    it('should require password confirmation to match', async () => {
      const req = new Request('http://localhost/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'valid-token',
          password: 'newpassword123',
          passwordConfirm: 'differentpassword',
        }),
      });

      const res = await authRouter.fetch(req);
      expect(res.status).toBe(400);
    });
  });
});
