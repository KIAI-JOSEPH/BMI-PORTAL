// BMI University Management System
// 100% Open Source Backend API
// License: MIT

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as httpLogger } from 'hono/logger';
import { rateLimiter } from 'hono-rate-limiter';
import { CONFIG, validateConfig } from './config/index.js';
import { logger } from './utils/logger.js';
import { getPocketBase, setupCollections, healthCheck as pbHealthCheck, authenticateAdmin, createDefaultAdminIfNeeded } from './services/pocketbase.js';
import { checkOllamaHealth } from './services/ollama.js';

// Import routes
import authRouter from './routes/auth.js';
import aiRouter from './routes/ai.js';
import studentsRouter from './routes/students.js';
import staffRouter from './routes/staff.js';
import coursesRouter from './routes/courses.js';
import certificatesRouter from './routes/certificates.js';
import financeRouter from './routes/finance.js';
import libraryRouter from './routes/library.js';
import dashboardRouter from './routes/dashboard.js';

// Validate configuration
validateConfig();

// Create Hono app
const app = new Hono();

// Middleware
app.use('*', httpLogger());
app.use('*', cors({
  origin: CONFIG.CORS_ORIGIN,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Rate limiting
app.use('*', rateLimiter({
  windowMs: CONFIG.RATE_LIMIT_WINDOW_MS,
  limit: CONFIG.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
}));

// Health check endpoint (no auth required)
app.get('/health', async (c) => {
  const [pbHealthy, ollamaHealth] = await Promise.all([
    pbHealthCheck(),
    checkOllamaHealth(),
  ]);
  
  const status = pbHealthy ? 200 : 503;
  
  return c.json({
    success: pbHealthy,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      api: 'healthy',
      database: pbHealthy ? 'healthy' : 'unhealthy',
      ai: ollamaHealth.running ? (ollamaHealth.modelAvailable ? 'healthy' : 'model_missing') : 'offline',
    },
    environment: CONFIG.NODE_ENV,
  }, status);
});

// API routes
app.route('/api/v1/auth', authRouter);
app.route('/api/v1/ai', aiRouter);
app.route('/api/v1/students', studentsRouter);
app.route('/api/v1/staff', staffRouter);
app.route('/api/v1/courses', coursesRouter);
app.route('/api/v1/certificates', certificatesRouter);
app.route('/api/v1/finance', financeRouter);
app.route('/api/v1/library', libraryRouter);
app.route('/api/v1/dashboard', dashboardRouter);

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
    message: `Route ${c.req.method} ${c.req.path} not found`,
  }, 404);
});

// Error handler
app.onError((err, c) => {
  logger.error('Unhandled error:', err);
  return c.json({
    success: false,
    error: 'Internal Server Error',
    message: CONFIG.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  }, 500);
});

// Start server
async function startServer() {
  try {
    logger.info('Initializing BMI UMS API Server...');
    logger.info(`Environment: ${CONFIG.NODE_ENV}`);
    
    // Initialize PocketBase
    logger.info('Connecting to PocketBase...');
    const pb = getPocketBase();
    
    // Check PocketBase health
    const pbHealthy = await pbHealthCheck();
    if (!pbHealthy) {
      logger.error('PocketBase is not available. Please ensure it is running.');
      logger.info('Start PocketBase: cd backend && ./pocketbase serve');
      process.exit(1);
    }
    logger.info('✓ PocketBase connected');

    // Authenticate as admin to allow collection/user management
    try {
      await authenticateAdmin();
      logger.info('✓ PocketBase admin authenticated');
    } catch (error) {
      logger.warn('PocketBase admin auth failed (may need manual setup):', error);
    }

    // Setup collections
    try {
      await setupCollections();
      logger.info('✓ Database schema verified');
    } catch (error) {
      logger.warn('Database schema setup failed (may already exist):', error);
    }

    // Create default admin user if no users exist
    try {
      await createDefaultAdminIfNeeded();
      logger.info('✓ User initialization complete');
    } catch (error) {
      logger.warn('User initialization failed:', error);
    }
    
    // Check Ollama
    const ollamaHealth = await checkOllamaHealth();
    if (ollamaHealth.running && ollamaHealth.modelAvailable) {
      logger.info('✓ Ollama AI service connected');
    } else if (ollamaHealth.running && !ollamaHealth.modelAvailable) {
      logger.warn('⚠ Ollama is running but model is not available.');
      logger.info(`Download model: ollama pull ${CONFIG.OLLAMA_MODEL}`);
    } else {
      logger.warn('⚠ Ollama is not running. AI features will be unavailable.');
      logger.info('Start Ollama: ollama serve');
    }
    
    // Start HTTP server
    serve({
      fetch: app.fetch,
      port: CONFIG.PORT,
      hostname: CONFIG.HOST,
    }, (info) => {
      logger.info(`✓ Server running at http://${info.address}:${info.port}`);
      logger.info(`✓ Health check: http://${info.address}:${info.port}/health`);
      logger.info(`✓ API docs: http://${info.address}:${info.port}/api/v1`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

// Start
startServer();

export default app;
