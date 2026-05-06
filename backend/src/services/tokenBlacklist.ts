/**
 * BMI UMS - Token Blacklist
 * In-memory blacklist for revoked JWT tokens.
 * Entries are auto-expired after the token's natural TTL to prevent unbounded growth.
 *
 * For multi-instance deployments, replace with Redis:
 *   await redis.setex(`blacklist:${jti}`, ttlSeconds, '1');
 */

interface BlacklistEntry {
  expiresAt: number; // Unix ms — when the token itself expires
}

const blacklist = new Map<string, BlacklistEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of blacklist.entries()) {
    if (entry.expiresAt <= now) {
      blacklist.delete(token);
    }
  }
}, 5 * 60 * 1000);

/**
 * Add a token to the blacklist until it naturally expires
 */
export function revokeToken(token: string, expiresAtMs: number): void {
  blacklist.set(token, { expiresAt: expiresAtMs });
}

/**
 * Check if a token has been revoked
 */
export function isTokenRevoked(token: string): boolean {
  const entry = blacklist.get(token);
  if (!entry) return false;
  if (entry.expiresAt <= Date.now()) {
    blacklist.delete(token);
    return false;
  }
  return true;
}

/**
 * Get current blacklist size (for monitoring)
 */
export function getBlacklistSize(): number {
  return blacklist.size;
}
