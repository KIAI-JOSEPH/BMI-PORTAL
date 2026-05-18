#!/usr/bin/env node
/**
 * BMI UMS — Tunnel Auto-Start / Auto-Restart
 *
 * Run once:  node scripts/tunnel-start.cjs
 * Run from npm: npm run tunnel
 *
 * What this script does automatically:
 *   1.  Kill old cloudflared process (if running)
 *   2.  Kill old local proxy process (port 4000)
 *   3.  Start cloudflared quick-tunnel → port 4000
 *   4.  Wait for the new public URL to appear in the log (up to 30 s)
 *   5.  Update VITE_VERIFY_URL in .env
 *   6.  Update VERIFY_PORTAL_URL in backend/.env
 *   7.  Rebuild the frontend (npm run build)  ← bakes the URL into every QR code
 *   8.  Start the local proxy server (serves dist/ + proxies /api to :3001)
 *   9.  Print the final live URL and service status
 *
 * Requirements:
 *   cloudflared must be installed:
 *     C:\Program Files (x86)\cloudflared\cloudflared.exe
 *   Backend must already be running on port 3001.
 *   PocketBase must already be running on port 8090.
 */

"use strict";

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

// ── Paths ─────────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, "..");
const LOGS = path.join(ROOT, "logs");
const CF_EXE = "C:\\Program Files (x86)\\cloudflared\\cloudflared.exe";
const CF_LOG = path.join(LOGS, "cloudflared.log");
const CF_ERR = path.join(LOGS, "cloudflared.err");
const CF_PID_FILE = path.join(LOGS, "cloudflared.pid");
const PX_PID_FILE = path.join(LOGS, "proxy.pid");
const PROXY_SCRIPT = path.join(__dirname, "local-proxy.cjs");
const FRONTEND_ENV = path.join(ROOT, ".env");
const BACKEND_ENV = path.join(ROOT, "backend", ".env");
const PROXY_PORT = 4000;
const TUNNEL_PORT = 4000; // cloudflared forwards to this port

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

/** Kill a Windows process by PID. */
function killPid(pid) {
  if (!pid) return;
  try {
    execSync(`taskkill /F /PID ${pid} 2>nul`, { stdio: "ignore" });
  } catch {}
}

/** Kill all processes listening on a given TCP port via netstat. */
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

/** Read a PID file and kill the recorded process. */
function killPidFile(file) {
  try {
    const pid = parseInt(fs.readFileSync(file, "utf8").trim(), 10);
    if (pid > 0) killPid(pid);
    fs.unlinkSync(file);
  } catch {}
}

/**
 * Launch a truly detached background process using Node's spawn.
 * stdout/stderr are redirected to log files if provided.
 * Returns the PID immediately without waiting for the process.
 */
function startDetached(
  exe,
  args,
  { cwd = ROOT, stdout = null, stderr = null } = {},
) {
  const outFd = stdout ? fs.openSync(stdout, "w") : "ignore";
  const errFd = stderr ? fs.openSync(stderr, "w") : "ignore";
  const child = spawn(exe, args, {
    cwd,
    detached: true,
    windowsHide: true,
    stdio: ["ignore", outFd, errFd],
  });
  child.unref(); // don't keep Node alive waiting for this child
  return child.pid || 0;
}

/** Async sleep — works in the main thread (no Atomics needed). */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Poll a file for a regex match, returning the first capture group. */
async function waitForPattern(file, regex, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const content = fs.readFileSync(file, "utf8");
      const m = content.match(regex);
      if (m) return m[1] || m[0];
    } catch {}
    await sleep(500);
  }
  return null;
}

/** Replace a KEY=value line in an env file (creates the line if missing). */
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

/** Quick HTTP GET to check if a port is responding. */
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
  console.log("║   BMI UMS — Tunnel Auto-Start                        ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  // Ensure logs directory exists
  fs.mkdirSync(LOGS, { recursive: true });

  // ── Check cloudflared is installed ─────────────────────────────────────────
  if (!fs.existsSync(CF_EXE)) {
    die(
      "cloudflared not found at:\n  " +
        CF_EXE +
        "\n\n" +
        "Download the installer from:\n" +
        "  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.msi\n" +
        "Install it (Next → Next → Finish), then run this script again.",
    );
  }
  ok("cloudflared found");

  // ── Step 1: Kill old cloudflared ────────────────────────────────────────────
  step("Stopping old cloudflared tunnel (if any)");
  killPidFile(CF_PID_FILE);
  // Also kill any stray cloudflared.exe processes
  try {
    execSync("taskkill /F /IM cloudflared.exe 2>nul", { stdio: "ignore" });
  } catch {}
  ok("Old tunnel stopped");

  // ── Step 2: Kill old proxy on port 4000 ─────────────────────────────────────
  step("Clearing port 4000 (old proxy)");
  killPidFile(PX_PID_FILE);
  killPort(PROXY_PORT);
  ok("Port 4000 cleared");

  // ── Step 3: Start new cloudflared tunnel ────────────────────────────────────
  step(`Starting cloudflared quick-tunnel → http://localhost:${TUNNEL_PORT}`);
  // Remove old logs so waitForPattern doesn't match stale content
  try {
    fs.unlinkSync(CF_LOG);
  } catch {}
  try {
    fs.unlinkSync(CF_ERR);
  } catch {}

  const cfPid = startDetached(
    CF_EXE,
    ["tunnel", "--url", `http://localhost:${TUNNEL_PORT}`],
    { cwd: ROOT, stdout: CF_LOG, stderr: CF_ERR },
  );

  if (!cfPid) die("Failed to launch cloudflared. Check the exe path.");
  fs.writeFileSync(CF_PID_FILE, String(cfPid), "utf8");
  ok(`cloudflared started (PID ${cfPid})`);

  // ── Step 4: Wait for the public URL ─────────────────────────────────────────
  step("Waiting for Cloudflare to assign a public URL (up to 30 s)…");
  log("(Cloudflare is negotiating a tunnel — this usually takes 5–10 s)");

  // URL appears in BOTH stdout and stderr depending on CF version; check both
  const urlRegex = /https:\/\/([a-z0-9-]+\.trycloudflare\.com)/;
  let tunnelUrl = null;

  for (let i = 0; i < 60; i++) {
    await sleep(500);
    const content = [CF_LOG, CF_ERR]
      .filter((f) => fs.existsSync(f))
      .map((f) => fs.readFileSync(f, "utf8"))
      .join("\n");
    const m = content.match(urlRegex);
    if (m) {
      tunnelUrl = `https://${m[1]}`;
      break;
    }
  }

  if (!tunnelUrl) {
    log("cloudflared log tail:");
    try {
      log(fs.readFileSync(CF_LOG, "utf8").split("\n").slice(-5).join("\n"));
    } catch {}
    die(
      "Timed out waiting for tunnel URL. Check logs/cloudflared.log for errors.",
    );
  }
  ok(`Public URL: ${tunnelUrl}`);

  // ── Step 5: Update env files ─────────────────────────────────────────────────
  step("Updating env files with new public URL");
  setEnvVar(FRONTEND_ENV, "VITE_VERIFY_URL", tunnelUrl);
  ok(`Frontend .env  →  VITE_VERIFY_URL=${tunnelUrl}`);
  setEnvVar(BACKEND_ENV, "VERIFY_PORTAL_URL", tunnelUrl);
  ok(`Backend  .env  →  VERIFY_PORTAL_URL=${tunnelUrl}`);

  // ── Step 6: Rebuild frontend ─────────────────────────────────────────────────
  step("Rebuilding frontend (baking new URL into QR codes)…");
  try {
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
    ok("Frontend rebuilt successfully");
  } catch {
    die("npm run build failed — check the output above for errors.");
  }

  // ── Step 7: Start local proxy ─────────────────────────────────────────────────
  step(`Starting local proxy on port ${PROXY_PORT}`);
  const pxPid = startDetached(
    process.execPath, // path to node.exe
    [PROXY_SCRIPT],
    { cwd: ROOT },
  );
  if (!pxPid) die("Failed to launch local-proxy.cjs");
  fs.writeFileSync(PX_PID_FILE, String(pxPid), "utf8");

  // Give the proxy a moment to bind
  await sleep(2000);
  const proxyUp = await isPortUp(PROXY_PORT, "/");
  if (proxyUp) {
    ok(`Proxy started (PID ${pxPid}) — listening on :${PROXY_PORT}`);
  } else {
    warn(
      `Proxy PID ${pxPid} launched but port ${PROXY_PORT} not yet responding (may still be starting)`,
    );
  }

  // ── Step 8: Check backend and PocketBase ────────────────────────────────────
  step("Checking backend services");
  const backendUp = await isPortUp(3001, "/health");
  const pbUp = await isPortUp(8090, "/api/health");
  backendUp
    ? ok("Backend API  :3001  ✓")
    : warn("Backend API  :3001  NOT RUNNING — start it manually");
  pbUp
    ? ok("PocketBase   :8090  ✓")
    : warn("PocketBase   :8090  NOT RUNNING — start it manually");

  // ── Done ────────────────────────────────────────────────────────────────────
  console.log(
    "\n╔══════════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║                 ALL SYSTEMS GO                                   ║",
  );
  console.log(
    "╠══════════════════════════════════════════════════════════════════╣",
  );
  console.log(`║  Public portal:  ${tunnelUrl.padEnd(48)} ║`);
  console.log(`║  Verification:   ${(tunnelUrl + "/verify").padEnd(48)} ║`);
  console.log(
    "╠══════════════════════════════════════════════════════════════════╣",
  );
  console.log(
    "║  QR codes on every transcript now link to the public URL above.  ║",
  );
  console.log(
    "║  Anyone anywhere can scan → real student details are shown.      ║",
  );
  console.log(
    "╠══════════════════════════════════════════════════════════════════╣",
  );
  console.log(
    "║  NOTE: This URL changes on each tunnel restart.                  ║",
  );
  console.log(
    "║  Run  npm run tunnel  again after any restart to get a new one.  ║",
  );
  console.log(
    "║  For a permanent URL → deploy to a VPS (see docs/DEPLOYMENT.md) ║",
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════════╝\n",
  );

  // Save the current URL to a state file so other scripts can read it
  fs.writeFileSync(path.join(LOGS, "tunnel-url.txt"), tunnelUrl, "utf8");
}

main().catch((err) => {
  console.error("\n✗ Unexpected error:", err.message);
  process.exit(1);
});
