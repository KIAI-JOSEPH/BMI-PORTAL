import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  login,
  logout,
  getToken,
  getCurrentUser,
  isAuthenticated,
  isTokenExpired,
  getTokenTimeRemaining,
  isTokenExpiringSoon,
  wasRememberMeSelected,
  requestPasswordReset,
  resetPassword,
} from './authService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = vi.fn();

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('should store token and user on successful login', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'test-token',
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'admin' },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      });

      const result = await login('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('bmi_token', 'test-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('bmi_user', JSON.stringify(mockResponse.data.user));
    });

    it('should return error on failed login', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid credentials',
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      });

      const result = await login('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const result = await login('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should pass rememberMe to backend', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'test-token',
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'admin' },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      });

      await login('test@example.com', 'password123', true);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
            rememberMe: true,
          }),
        })
      );
      expect(localStorage.setItem).toHaveBeenCalledWith('bmi_remember_me', 'true');
    });
  });

  describe('logout', () => {
    it('should clear localStorage and redirect', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      await logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('bmi_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('bmi_user');
      expect(localStorage.removeItem).toHaveBeenCalledWith('bmi_token_expiry');
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('stored-token');

      const token = getToken();

      expect(token).toBe('stored-token');
    });

    it('should return null when no token', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const token = getToken();

      expect(token).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorageMock.getItem.mockReturnValue('token');

      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      localStorageMock.getItem.mockReturnValue(null);

      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return parsed user from localStorage', () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test', role: 'admin' };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(user));

      const result = getCurrentUser();

      expect(result).toEqual(user);
    });

    it('should return null when no user', () => {
      localStorageMock.getItem.mockReturnValue(null);

      expect(getCurrentUser()).toBeNull();
    });

    it('should return null on invalid JSON', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      expect(getCurrentUser()).toBeNull();
    });
  });

  describe('token expiry', () => {
    it('isTokenExpired should return true when no expiry', () => {
      localStorageMock.getItem.mockReturnValue(null);

      expect(isTokenExpired()).toBe(true);
    });

    it('isTokenExpired should return true when past expiry', () => {
      const pastTime = Date.now() - 1000;
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'bmi_token_expiry') return pastTime.toString();
        return null;
      });

      expect(isTokenExpired()).toBe(true);
    });

    it('getTokenTimeRemaining should return 0 when no expiry', () => {
      localStorageMock.getItem.mockReturnValue(null);

      expect(getTokenTimeRemaining()).toBe(0);
    });

    it('isTokenExpiringSoon should return false when no expiry', () => {
      localStorageMock.getItem.mockReturnValue(null);

      expect(isTokenExpiringSoon()).toBe(false);
    });
  });

  describe('wasRememberMeSelected', () => {
    it('should return remember me preference', () => {
      localStorageMock.getItem.mockReturnValue('true');

      expect(wasRememberMeSelected()).toBe(true);
    });

    it('should return false when no preference stored', () => {
      localStorageMock.getItem.mockReturnValue(null);

      expect(wasRememberMeSelected()).toBe(false);
    });
  });

  describe('requestPasswordReset', () => {
    it('should send password reset request', async () => {
      const mockResponse = {
        success: true,
        message: 'Reset email sent',
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      });

      const result = await requestPasswordReset('user@example.com');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/forgot-password'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com' }),
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('should complete password reset', async () => {
      const mockResponse = {
        success: true,
        message: 'Password reset successful',
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      });

      const result = await resetPassword('token123', 'newpassword', 'newpassword');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/reset-password'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            token: 'token123',
            password: 'newpassword',
            passwordConfirm: 'newpassword',
          }),
        })
      );
      expect(result.success).toBe(true);
    });
  });
});
