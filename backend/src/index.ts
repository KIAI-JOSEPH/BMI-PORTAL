// BMI University Management System
// 100% Open Source Backend API
// License: MIT

import { fileURLToPath } from "url";
import path from "path";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as httpLogger } from "hono/logger";
import { rateLimiter } from "hono-rate-limiter";
import { CONFIG, validateConfig } from "./config/index.js";
import { logger } from "./utils/logger.js";
import {
  getPocketBase,
  setupCollections,
  healthCheck as pbHealthCheck,
  authenticateAdmin,
  createDefaultAdminIfNeeded,
  scheduleAdminTokenRefresh,
} from "./services/pocketbase.js";
import { seedAcademicReferenceDataIfEmpty } from "./services/academicSeed.js";
import { checkOllamaHealth } from "./services/ollama.js";
import { initJWTKeys } from "./middleware/auth.js";
import { getPoolStats } from "./services/pocketbasePool.js";
import { optimizeDatabase } from "./services/databaseOptimizer.js";
import { CacheManager, QueryMonitor } from "./services/queryOptimizer.js";

// OpenAPI docs
import { apiReference } from "@scalar/hono-api-reference";
import { openApiSpec } from "./openapi/spec.js";

// Import routes
import authRouter from "./routes/auth.js";
import aiRouter from "./routes/ai.js";
import studentsRouter from "./routes/students.js";
import staffRouter from "./routes/staff.js";
import coursesRouter from "./routes/courses.js";
import certificatesRouter from "./routes/certificates.js";
import financeRouter from "./routes/finance.js";
import libraryRouter from "./routes/library.js";
import dashboardRouter from "./routes/dashboard.js";
import importRouter from "./routes/import.js";
import { gradeRouter } from "./routes/grades.js";
import { gradingScalesRouter } from "./routes/grading-scales.js";
import { gradeAppealsRouter } from "./routes/grade-appeals.js";
import catalogRouter from "./routes/catalog.js";
import batchRouter from "./routes/batch.js";
import hostelRouter from "./routes/hostels.js";
import medicalRouter from "./routes/medical.js";
import inventoryRouter from "./routes/inventory.js";
import visitorRouter from "./routes/visitors.js";
import attendanceRouter from "./routes/attendance.js";
import campusesRouter from "./routes/campuses.js";
import transcriptsRouter from "./routes/transcripts.js";
import documentsRouter from "./routes/documents.js";

// Validate configuration
validateConfig();

// Create Hono app
const app = new Hono();

// ── Body size limit middleware (must be first) ────────────────────────────────
app.use("*", async (c, next) => {
  const contentLength = c.req.header("content-length");
  const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5MB hard limit
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return c.json(
      { success: false, error: "Request body too large. Maximum 5MB." },
      413,
    );
  }
  return await next();
});

// Middleware
app.use("*", httpLogger());
app.use(
  "*",
  cors({
    origin: CONFIG.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Rate limiting
app.use(
  "*",
  rateLimiter({
    windowMs: CONFIG.RATE_LIMIT_WINDOW_MS,
    limit:
      CONFIG.NODE_ENV === "development"
        ? 10000
        : CONFIG.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    keyGenerator: (c) =>
      c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
    message: {
      success: false,
      error: "Too many requests. Please try again later.",
      code: "RATE_LIMITED",
    },
    skip: (c) => c.req.path === "/health" || c.req.path === "/api/v1/health",
  }),
);

// Health check endpoint (no auth required)
app.get("/health", async (c) => {
  const [pbHealthy, ollamaHealth] = await Promise.all([
    pbHealthCheck(),
    checkOllamaHealth(),
  ]);

  const status = pbHealthy ? 200 : 503;

  // In production, return minimal info — don't expose internal topology
  if (CONFIG.NODE_ENV === "production") {
    return c.json(
      {
        status: pbHealthy ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }

  return c.json(
    {
      success: pbHealthy,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        api: "healthy",
        database: pbHealthy ? "healthy" : "unhealthy",
        ai: ollamaHealth.running
          ? ollamaHealth.modelAvailable
            ? "healthy"
            : "model_missing"
          : "offline",
      },
      environment: CONFIG.NODE_ENV,
    },
    status,
  );
});

// Performance monitoring endpoints
app.get("/api/v1/health/pool", async (c) => {
  const stats = getPoolStats();
  return c.json({ success: true, data: stats });
});

app.get("/api/v1/health/performance", async (c) => {
  const stats = QueryMonitor.getStats();
  return c.json({ success: true, data: stats });
});

app.get("/api/v1/health/cache", async (c) => {
  const stats = CacheManager.getStats();
  return c.json({ success: true, data: stats });
});

// ── API versioning headers ────────────────────────────────────────────────────
app.use("/api/v1/*", async (c, next) => {
  await next();
  c.res.headers.set("API-Version", "1.0.0");
  c.res.headers.set("API-Supported-Versions", "1.0.0");
  // When v2 is released, add: c.res.headers.set('Deprecation', 'true');
  // c.res.headers.set('Sunset', 'Sat, 01 Jan 2027 00:00:00 GMT');
  // c.res.headers.set('Link', '</api/v2>; rel="successor-version"');
});

// API routes
app.route("/api/v1/auth", authRouter);
app.route("/api/v1/ai", aiRouter);
app.route("/api/v1/students", studentsRouter);
app.route("/api/v1/staff", staffRouter);
app.route("/api/v1/courses", coursesRouter);
app.route("/api/v1/certificates", certificatesRouter);
app.route("/api/v1/finance", financeRouter);
app.route("/api/v1/library", libraryRouter);
app.route("/api/v1/dashboard", dashboardRouter);
app.route("/api/v1/import", importRouter);
app.route("/api/v1/grades", gradeRouter);
app.route("/api/v1/grading-scales", gradingScalesRouter);
app.route("/api/v1/grade-appeals", gradeAppealsRouter);
app.route("/api/v1/catalog", catalogRouter);
app.route("/api/v1/batch", batchRouter);
app.route("/api/v1/hostels", hostelRouter);
app.route("/api/v1/medical", medicalRouter);
app.route("/api/v1/inventory", inventoryRouter);
app.route("/api/v1/visitors", visitorRouter);
app.route("/api/v1/attendance", attendanceRouter);
app.route("/api/v1/campuses", campusesRouter);
app.route("/api/v1/transcripts", transcriptsRouter);
app.route("/api/v1/documents", documentsRouter);

// ── OpenAPI Documentation ────────────────────────────────────────────────────
// GET /api/openapi.json  — machine-readable spec (useful for code generators)
app.get("/api/openapi.json", (c) => {
  return c.json(openApiSpec);
});

// GET /api/docs  — Scalar interactive API reference (MIT, self-hosted)
app.get(
  "/api/docs",
  apiReference({
    spec: { url: "/api/openapi.json" },
    theme: "purple",
    title: "BMI UMS API Reference",
  }),
);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: "Not Found",
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    404,
  );
});

// Error handler
app.onError((err, c) => {
  logger.error("Unhandled error:", err);
  return c.json(
    {
      success: false,
      error: "Internal Server Error",
      message:
        CONFIG.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
    },
    500,
  );
});

// Start server
async function startServer() {
  try {
    logger.info("Initializing BMI UMS API Server...");
    logger.info(`Environment: ${CONFIG.NODE_ENV}`);

    // Initialize JWT keys (RS256 or HS256)
    await initJWTKeys();
    logger.info(
      `✓ JWT initialized (${process.env.JWT_PRIVATE_KEY ? "RS256" : "HS256"} mode)`,
    );

    // Initialize PocketBase
    logger.info("Connecting to PocketBase...");
    getPocketBase(); // Initialize connection

    // Check PocketBase health with a retry loop
    let pbHealthy = false;
    const maxRetries = 10;
    const retryDelayMs = 1000;

    logger.info("Checking PocketBase health...");
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      pbHealthy = await pbHealthCheck();
      if (pbHealthy) break;
      logger.warn(
        `PocketBase not ready (attempt ${attempt}/${maxRetries}), retrying in ${retryDelayMs}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }

    if (!pbHealthy) {
      logger.error("PocketBase is not available. Please ensure it is running.");
      logger.info("Start PocketBase: cd backend && ./pocketbase serve");
      process.exit(1);
    }
    logger.info("✓ PocketBase connected");

    // Authenticate as admin to allow collection/user management
    try {
      await authenticateAdmin();
      scheduleAdminTokenRefresh(); // keep token alive
      logger.info("✓ PocketBase admin authenticated");
    } catch (error) {
      logger.warn(
        "PocketBase admin auth failed (may need manual setup):",
        error,
      );
    }

    // Setup collections
    try {
      await setupCollections();
      logger.info("✓ Database schema verified");
    } catch (error) {
      logger.warn("Database schema setup failed (may already exist):", error);
    }

    try {
      await seedAcademicReferenceDataIfEmpty();
      logger.info("✓ Academic reference seed checked");
    } catch (error) {
      logger.warn("Academic seed skipped:", error);
    }

    // Create default admin user if no users exist
    try {
      await createDefaultAdminIfNeeded();
      logger.info("✓ User initialization complete");
    } catch (error) {
      logger.warn("User initialization failed:", error);
    }

    // Auto-populate Mukurweini and Giathugu campus data
    try {
      logger.info("Auto-populating Mukurweini and Giathugu campus data...");
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const scriptPath = path.resolve(
        __dirname,
        "../../scripts/import-mukurweini-giathugu.ts",
      );

      await execAsync(`npx tsx "${scriptPath}"`, {
        env: {
          ...process.env,
          PB_URL: CONFIG.POCKETBASE_URL,
          PB_EMAIL: CONFIG.POCKETBASE_ADMIN_EMAIL,
          PB_PASSWORD: CONFIG.POCKETBASE_ADMIN_PASSWORD,
        },
      });
      logger.info(
        "✓ Mukurweini and Giathugu campus data auto-populated successfully",
      );
    } catch (error) {
      logger.warn(
        "Failed to auto-populate Mukurweini and Giathugu data:",
        error,
      );
    }

    // No pool initialization needed — pocketbasePool now delegates to the
    // existing PocketBase singleton (zero overhead, same API surface).

    // Run database optimization
    logger.info("Running database optimization...");
    try {
      await optimizeDatabase();
      logger.info("✓ Database optimization complete");
    } catch (error) {
      logger.warn("Database optimization failed (non-critical):", error);
    }

    // Check Ollama
    const ollamaHealth = await checkOllamaHealth();
    if (ollamaHealth.running && ollamaHealth.modelAvailable) {
      logger.info("✓ Ollama AI service connected");
    } else if (ollamaHealth.running && !ollamaHealth.modelAvailable) {
      logger.warn("⚠ Ollama is running but model is not available.");
      logger.info(`Download model: ollama pull ${CONFIG.OLLAMA_MODEL}`);
    } else {
      logger.warn("⚠ Ollama is not running. AI features will be unavailable.");
      logger.info("Start Ollama: ollama serve");
    }

    // Start HTTP server
    server = serve(
      {
        fetch: app.fetch,
        port: CONFIG.PORT,
        hostname: CONFIG.HOST,
      },
      (info) => {
        logger.info(`✓ Server running at http://${info.address}:${info.port}`);
        logger.info(
          `✓ Health check: http://${info.address}:${info.port}/health`,
        );
      },
    );
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown — drain in-flight requests before exiting
let server: ReturnType<typeof serve> | null = null;

function gracefulShutdown(signal: string) {
  logger.info(`${signal} received — shutting down gracefully...`);
  if (server) {
    // @hono/node-server exposes close() for graceful drain
    (server as any).close?.(() => {
      logger.info("All connections drained. Exiting.");
      process.exit(0);
    });
    // Force exit after 10 seconds if connections don't drain
    setTimeout(() => {
      logger.warn("Forced shutdown after 10s timeout");
      process.exit(1);
    }, 10_000);
  } else {
    process.exit(0);
  }
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Start
startServer();

export default app;
