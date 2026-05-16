/**
 * BMI UMS - PocketBase Connection Pool
 * Implements connection pooling for better scalability and performance
 */

import PocketBase from 'pocketbase';
import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';

interface PoolConfig {
  minSize: number;
  maxSize: number;
  acquireTimeout: number;
  idleTimeout: number;
}

interface PooledConnection {
  pb: PocketBase;
  inUse: boolean;
  lastUsed: number;
  created: number;
}

class PocketBaseConnectionPool {
  private pool: PooledConnection[] = [];
  private config: PoolConfig;
  private waitQueue: Array<(pb: PocketBase) => void> = [];
  private adminToken: string | null = null;
  private initPromise: Promise<void> | null = null;
  private _ready: boolean = false;
  
  constructor(config: Partial<PoolConfig> = {}) {
    this.config = {
      minSize: config.minSize || 2,
      maxSize: config.maxSize || 10,
      acquireTimeout: config.acquireTimeout || 5000,
      idleTimeout: config.idleTimeout || 60000,
    };
    
    // Start initialization and store the promise
    this.initPromise = this.initialize();
    
    // Start idle connection cleanup
    this.startIdleCleanup();
  }

  /**
   * Wait until the pool is initialized and authenticated
   */
  async waitUntilReady(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }
  
  /**
   * Initialize minimum pool size
   */
  private async initialize(): Promise<void> {
    logger.info(`Initializing PocketBase connection pool (min: ${this.config.minSize}, max: ${this.config.maxSize})`);
    
    for (let i = 0; i < this.config.minSize; i++) {
      await this.createConnection();
    }
    
    // Authenticate admin — degrade gracefully if it fails (e.g. fresh PB instance)
    try {
      await this.authenticateAdmin();
    } catch (err) {
      logger.warn('Connection pool: admin auth failed on init — pool will operate in degraded mode. Retry on next request.');
    }
    
    // Mark ready regardless so the server can still start and serve public routes
    this._ready = true;
    logger.info(`✓ Connection pool initialized with ${this.pool.length} connections`);
  }

  /**
   * Check if the pool is ready
   */
  get isReady(): boolean {
    return this._ready;
  }
  
  /**
   * Authenticate as admin and store token
   */
  private async authenticateAdmin(): Promise<void> {
    try {
      const response = await fetch(`${CONFIG.POCKETBASE_URL}/api/admins/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity: CONFIG.POCKETBASE_ADMIN_EMAIL,
          password: CONFIG.POCKETBASE_ADMIN_PASSWORD,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Admin authentication failed');
      }
      
      const data: any = await response.json();
      this.adminToken = data.token;
      
      // Apply token to all connections
      for (const conn of this.pool) {
        conn.pb.authStore.save(data.token, data.admin);
      }
      
      logger.info('✓ Admin authenticated for connection pool');
    } catch (error) {
      logger.error('Failed to authenticate admin for pool:', error);
      throw error;
    }
  }
  
  /**
   * Create a new connection
   */
  private async createConnection(): Promise<PooledConnection> {
    const pb = new PocketBase(CONFIG.POCKETBASE_URL);
    pb.autoCancellation(false);
    
    // Apply admin token if available
    if (this.adminToken) {
      pb.authStore.save(this.adminToken, null);
    }
    
    const conn: PooledConnection = {
      pb,
      inUse: false,
      lastUsed: Date.now(),
      created: Date.now(),
    };
    
    this.pool.push(conn);
    return conn;
  }
  
  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<PocketBase> {
    // Ensure pool is ready
    await this.waitUntilReady();

    // Try to find an available connection
    const available = this.pool.find(conn => !conn.inUse);
    
    if (available) {
      available.inUse = true;
      available.lastUsed = Date.now();
      return available.pb;
    }
    
    // Create new connection if under max size
    if (this.pool.length < this.config.maxSize) {
      const conn = await this.createConnection();
      conn.inUse = true;
      return conn.pb;
    }
    
    // Wait for a connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitQueue.indexOf(resolve);
        if (index > -1) {
          this.waitQueue.splice(index, 1);
        }
        reject(new Error('Connection acquire timeout'));
      }, this.config.acquireTimeout);
      
      this.waitQueue.push((pb: PocketBase) => {
        clearTimeout(timeout);
        resolve(pb);
      });
    });
  }
  
  /**
   * Release a connection back to the pool
   */
  release(pb: PocketBase): void {
    const conn = this.pool.find(c => c.pb === pb);
    
    if (!conn) {
      logger.warn('Attempted to release unknown connection');
      return;
    }
    
    conn.inUse = false;
    conn.lastUsed = Date.now();
    
    // If there are waiting requests, fulfill them
    if (this.waitQueue.length > 0) {
      const waiter = this.waitQueue.shift();
      if (waiter) {
        conn.inUse = true;
        waiter(pb);
      }
    }
  }
  
  /**
   * Execute a function with a pooled connection
   */
  async withConnection<T>(fn: (pb: PocketBase) => Promise<T>): Promise<T> {
    const pb = await this.acquire();
    try {
      return await fn(pb);
    } finally {
      this.release(pb);
    }
  }
  
  /**
   * Clean up idle connections
   */
  private startIdleCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const toRemove: number[] = [];
      
      for (let i = 0; i < this.pool.length; i++) {
        const conn = this.pool[i];
        
        // Don't remove if in use or below min size
        if (conn.inUse || this.pool.length <= this.config.minSize) {
          continue;
        }
        
        // Remove if idle for too long
        if (now - conn.lastUsed > this.config.idleTimeout) {
          toRemove.push(i);
        }
      }
      
      // Remove idle connections (in reverse to maintain indexes)
      for (let i = toRemove.length - 1; i >= 0; i--) {
        this.pool.splice(toRemove[i], 1);
      }
      
      if (toRemove.length > 0) {
        logger.info(`Cleaned up ${toRemove.length} idle connections (pool size: ${this.pool.length})`);
      }
    }, 30000); // Check every 30 seconds
  }
  
  /**
   * Refresh admin token periodically
   */
  async refreshAdminToken(): Promise<void> {
    try {
      const response = await fetch(`${CONFIG.POCKETBASE_URL}/api/admins/auth-refresh`, {
        method: 'POST',
        headers: {
          'Authorization': this.adminToken || '',
        },
      });
      
      if (response.ok) {
        const data: any = await response.json();
        this.adminToken = data.token;
        
        // Update all connections
        for (const conn of this.pool) {
          conn.pb.authStore.save(data.token, data.admin);
        }
        
        logger.info('✓ Admin token refreshed for connection pool');
      } else {
        // Re-authenticate if refresh fails
        await this.authenticateAdmin();
      }
    } catch (error) {
      logger.error('Failed to refresh admin token:', error);
      await this.authenticateAdmin();
    }
  }
  
  /**
   * Get pool statistics
   */
  getStats(): {
    total: number;
    inUse: number;
    available: number;
    waiting: number;
  } {
    return {
      total: this.pool.length,
      inUse: this.pool.filter(c => c.inUse).length,
      available: this.pool.filter(c => !c.inUse).length,
      waiting: this.waitQueue.length,
    };
  }
  
  /**
   * Close all connections
   */
  async close(): Promise<void> {
    logger.info('Closing connection pool...');
    this.pool = [];
    this.waitQueue = [];
    logger.info('✓ Connection pool closed');
  }
}

// Singleton instance
let poolInstance: PocketBaseConnectionPool | null = null;

/**
 * Get the connection pool instance
 */
export function getConnectionPool(): PocketBaseConnectionPool {
  if (!poolInstance) {
    poolInstance = new PocketBaseConnectionPool();
    
    // Schedule token refresh every 30 minutes
    setInterval(() => {
      poolInstance?.refreshAdminToken();
    }, 30 * 60 * 1000);
  }
  return poolInstance;
}

/**
 * Helper function to execute queries with automatic connection management
 */
export async function withPocketBase<T>(
  fn: (pb: PocketBase) => Promise<T>
): Promise<T> {
  const pool = getConnectionPool();
  await pool.waitUntilReady();
  return pool.withConnection(fn);
}

/**
 * Get pool statistics
 */
export function getPoolStats() {
  return poolInstance?.getStats() || {
    total: 0,
    inUse: 0,
    available: 0,
    waiting: 0,
  };
}
