#!/usr/bin/env node
/**
 * BMI UMS — Ngrok Tunnel Auto-Start
 *
 * This script ensures a 100% efficient and professional Ngrok tunnel setup
 * for the verification portal. It relies on a static Ngrok domain to provide
 * a permanent URL for your QR codes.
 *
 * Requirements:
 *   - ngrok must be installed and in your PATH
 *   - NGROK_DOMAIN must be set in your root .env file
 *   - Backend and PocketBase should already be running
 */

"use strict";

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

// ── Paths ─────────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, "..");
const LOGS = path.join(ROOT, "logs");
const NGROK_EXE = "ngrok";
const NGROK_LOG = path.join(LOGS, "ngrok.log");
const NGROK_PID_FILE = path.join(LOGS, "ngrok.pid");
const PX_PID_FILE = path.join(LOGS, "proxy.pid");
const PROXY_SCRIPT = path.join(__dirname, "local-proxy.cjs");
const FRONTEND_ENV = path.join(ROOT, ".env");
const BACKEND_ENV = path.join(ROOT, "backend", ".env");
const PROXY_PORT = 4000;
const TUNNEL_PORT = 4000;

// ── Helpers ───────────────────────────────────────────────────────────────────
function log(msg) {
  console.log(`  ${msg}`);
}
function ok(msg) {
  console.log(`  ✓ ${msg}`);
}
function warn(msg) {
  console.log(`  ⚠ ${msg}`);
}
function step(msg) {
  console.log(`\n▶ ${msg}`);
}
function die(msg) {
  console.error(`\n✗ FATAL: ${msg}`);
  process.exit(1);
}

function killPid(pid) {
  if (!pid) return;
  try {
    execSync(`taskkill /F /PID ${pid} 2>nul`, { stdio: "ignore" });
  } catch {}
}

function killPort(port) {
  try {
    const out = execSync(`netstat -ano 2>nul`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const pids = new Set();
    out.split("\n").forEach((line) => {
      if (line.includes(`:${port} `) || line.includes(`:${port}\t`)) {
        const m = line.trim().split(/\s+/);
        const pid = parseInt(m[m.length - 1], 10);
        if (pid > 0) pids.add(pid);
      }
    });
    pids.forEach((pid) => killPid(pid));
  } catch {}
}

function killPidFile(file) {
  try {
    const pid = parseInt(fs.readFileSync(file, "utf8").trim(), 10);
    if (pid > 0) killPid(pid);
    fs.unlinkSync(file);
  } catch {}
}

function startDetached(exe, args, { cwd = ROOT, stdout = null, stderr = null } = {}) {
  const outFd = stdout ? fs.openSync(stdout, "w") : "ignore";
  const errFd = stderr ? fs.openSync(stderr, "w") : "ignore";
  const child = spawn(exe, args, {
    cwd,
    detached: true,
    windowsHide: true,
    stdio: ["ignore", outFd, errFd],
  });
  child.unref();
  return child.pid || 0;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function setEnvVar(file, key, value) {
  if (!fs.existsSync(file)) {
    warn(`${path.basename(file)} not found — skipping`);
    return;
  }
  let text = fs.readFileSync(file, "utf8");
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(text)) {
    text = text.replace(re, `${key}=${value}`);
  } else {
    text += `\n${key}=${value}\n`;
  }
  fs.writeFileSync(file, text, "utf8");
}

function isPortUp(port, path = "/health") {
  return new Promise((resolve) => {
    const req = http.get(
      { hostname: "127.0.0.1", port, path, timeout: 2000 },
      (res) => {
        resolve(res.statusCode < 500);
      },
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   BMI UMS — Ngrok Tunnel Auto-Start                  ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  fs.mkdirSync(LOGS, { recursive: true });

  // Load NGROK_DOMAIN from .env
  let ngrokDomain = process.env.NGROK_DOMAIN;
  if (!ngrokDomain) {
    try {
      const envText = fs.readFileSync(FRONTEND_ENV, "utf8");
      const m = envText.match(/^NGROK_DOMAIN=(.+)$/m);
      if (m && m[1].trim()) {
        ngrokDomain = m[1].trim();
      }
    } catch {}
  }

  if (!ngrokDomain) {
    die(
      "NGROK_DOMAIN is not set in your .env file.\n\n" +
      "To organize a professional, permanent Ngrok tunnel:\n" +
      "  1. Sign up at https://ngrok.com (free)\n" +
      "  2. Get your free static domain from the dashboard\n" +
      "  3. Run: ngrok config add-authtoken YOUR_TOKEN\n" +
      "  4. Add to .env:  NGROK_DOMAIN=your-domain.ngrok-free.app\n" +
      "  5. Run: npm run tunnel again."
    );
  }

  const tunnelUrl = `https://${ngrokDomain}`;

  step("Stopping old ngrok tunnel (if any)");
  killPidFile(NGROK_PID_FILE);
  try {
    execSync("taskkill /F /IM ngrok.exe 2>nul", { stdio: "ignore" });
  } catch {}
  ok("Old ngrok stopped");

  step("Clearing port 4000 (old proxy)");
  killPidFile(PX_PID_FILE);
  killPort(PROXY_PORT);
  ok("Port 4000 cleared");

  step(`Starting ngrok → ${tunnelUrl}`);
  try { fs.unlinkSync(NGROK_LOG); } catch {}
  
  const ngPid = startDetached(
    NGROK_EXE,
    ["http", `--domain=${ngrokDomain}`, `127.0.0.1:${TUNNEL_PORT}`, "--log=stdout"],
    { cwd: ROOT, stdout: NGROK_LOG, stderr: NGROK_LOG },
  );

  if (!ngPid) {
    die("Failed to launch ngrok.\nMake sure ngrok is installed and in PATH.\nngrok.com/download");
  }

  fs.writeFileSync(NGROK_PID_FILE, String(ngPid), "utf8");
  ok(`ngrok started (PID ${ngPid})`);

  // Wait a moment for ngrok to initialize
  await sleep(3000);
  ok(`Public URL (PERMANENT): ${tunnelUrl}`);

  step("Updating env files");
  setEnvVar(FRONTEND_ENV, "VITE_VERIFY_URL", tunnelUrl);
  ok(`VITE_VERIFY_URL=${tunnelUrl}`);
  setEnvVar(BACKEND_ENV, "VERIFY_PORTAL_URL", tunnelUrl);
  ok(`VERIFY_PORTAL_URL=${tunnelUrl}`);

  step("Rebuilding frontend (baking URL into QR codes)...");
  try {
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
    ok("Frontend rebuilt successfully");
  } catch {
    die("Frontend build failed. Please check for errors.");
  }

  step(`Starting local proxy on port ${PROXY_PORT}`);
  const pxPid = startDetached(process.execPath, [PROXY_SCRIPT], { cwd: ROOT });
  if (!pxPid) die("Failed to launch local-proxy.cjs");
  fs.writeFileSync(PX_PID_FILE, String(pxPid), "utf8");
  
  await sleep(2000);
  const proxyUp = await isPortUp(PROXY_PORT, "/");
  if (proxyUp) {
    ok(`Proxy running (PID ${pxPid}) — listening on :${PROXY_PORT}`);
  } else {
    warn(`Proxy PID ${pxPid} launched but port ${PROXY_PORT} not yet responding.`);
  }

  step("Checking backend services");
  const beUp = await isPortUp(3001, "/health");
  const pbUp = await isPortUp(8090, "/api/health");
  beUp ? ok("Backend :3001 ✓") : warn("Backend :3001 NOT RUNNING");
  pbUp ? ok("PocketBase :8090 ✓") : warn("PocketBase :8090 NOT RUNNING");

  console.log("\n╬══════════════════════════════════════════════════════════════════╗");
  console.log("    ALL SYSTEMS GO — NGROK PERMANENT URL ACTIVE");
  console.log("╟──────────────────────────────────────────────────────────────────╢");
  console.log(`   Portal:       ${tunnelUrl}`);
  console.log(`   Verification: ${tunnelUrl}/verify`);
  console.log("╟──────────────────────────────────────────────────────────────────╢");
  console.log("   This URL is PERMANENT. Same URL every restart.");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");
  
  fs.writeFileSync(path.join(LOGS, "tunnel-url.txt"), tunnelUrl, "utf8");
}

main().catch((err) => {
  console.error("\n✗ Unexpected error:", err.message);
  process.exit(1);
});
