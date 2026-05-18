#!/usr/bin/env node
/**
 * BMI UMS — Create Transcript Registry Collections
 *
 * Creates two PocketBase collections directly via the Admin REST API:
 *   1. transcripts                    — the document registry
 *   2. transcript_verification_logs   — audit trail for verification attempts
 *
 * Run: node scripts/create-transcript-collections.js
 *
 * Prerequisites:
 *   PocketBase must be running on http://127.0.0.1:8090
 *   POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set
 *   (reads from backend/.env automatically)
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

// ── Load .env from backend/ ──────────────────────────────────────────────────
const envPath = path.join(__dirname, "..", "backend", ".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const [k, ...v] = line.split("=");
      if (k && v.length && !process.env[k.trim()]) {
        process.env[k.trim()] = v.join("=").trim();
      }
    });
}

const PB_URL = process.env.POCKETBASE_URL || "http://127.0.0.1:8090";
const PB_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || "admin@bmi.edu";
const PB_PASS = process.env.POCKETBASE_ADMIN_PASSWORD || "";

// ── Tiny fetch wrapper (no external deps) ────────────────────────────────────
function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(PB_URL + path);
    const payload = body ? JSON.stringify(body) : null;
    const headers = { "Content-Type": "application/json" };
    // PocketBase v0.22+ uses a plain Bearer token for both admin and user accounts
    if (token) headers["Authorization"] = token;
    if (payload) headers["Content-Length"] = Buffer.byteLength(payload);

    const opts = {
      hostname: url.hostname,
      port: url.port || 8090,
      path: url.pathname + url.search,
      method,
      headers,
    };

    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Collection definitions ────────────────────────────────────────────────────
const TRANSCRIPTS_COLLECTION = {
  name: "transcripts",
  type: "base",
  schema: [
    {
      name: "serial_number",
      type: "text",
      required: true,
      options: { min: null, max: 60 },
    },
    { name: "student_id", type: "text", required: true, options: {} },
    {
      name: "student_name",
      type: "text",
      required: true,
      options: { min: null, max: 300 },
    },
    {
      name: "programme",
      type: "text",
      required: true,
      options: { min: null, max: 300 },
    },
    {
      name: "academic_year",
      type: "text",
      required: false,
      options: { min: null, max: 20 },
    },
    { name: "content_hash", type: "text", required: true, options: {} },
    { name: "hidden_token", type: "text", required: true, options: {} },
    { name: "issuance_nonce", type: "text", required: true, options: {} },
    { name: "issued_at", type: "text", required: true, options: {} },
    {
      name: "status",
      type: "select",
      required: true,
      options: { maxSelect: 1, values: ["ISSUED", "REVOKED"] },
    },
    {
      name: "verification_count",
      type: "number",
      required: false,
      options: { min: 0, noDecimal: true },
    },
  ],
  // Publicly viewable for the verification endpoint; write is API-gated
  listRule: "@request.auth.id != ''",
  viewRule: "",
  createRule: "@request.auth.id != ''",
  updateRule: "@request.auth.id != ''",
  deleteRule: "@request.auth.id != ''",
};

const VERIFY_LOGS_COLLECTION = {
  name: "transcript_verification_logs",
  type: "base",
  schema: [
    { name: "transcript_serial", type: "text", required: true, options: {} },
    {
      name: "result",
      type: "select",
      required: true,
      options: {
        maxSelect: 1,
        values: ["valid", "invalid", "revoked", "tampered", "not_found"],
      },
    },
    { name: "ip_address", type: "text", required: false, options: { max: 45 } },
    { name: "timestamp", type: "text", required: true, options: {} },
  ],
  listRule: "@request.auth.id != ''",
  viewRule: "@request.auth.id != ''",
  createRule: "", // backend writes logs without auth token
  updateRule: "@request.auth.id != ''",
  deleteRule: "@request.auth.id != ''",
};

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("BMI UMS — Transcript Collection Setup");
  console.log("PocketBase:", PB_URL);
  console.log("Admin email:", PB_EMAIL);
  console.log("");

  // 1. Authenticate
  console.log("Authenticating as admin...");
  const authRes = await request("POST", "/api/admins/auth-with-password", {
    identity: PB_EMAIL,
    password: PB_PASS,
  });

  if (!authRes.body.token) {
    console.error(
      "Authentication failed:",
      authRes.body.message || authRes.body,
    );
    process.exit(1);
  }

  const token = authRes.body.token;
  console.log("✓ Authenticated");
  console.log("");

  // 2. Create each collection
  for (const col of [TRANSCRIPTS_COLLECTION, VERIFY_LOGS_COLLECTION]) {
    process.stdout.write(`Creating collection "${col.name}"... `);

    // Check if already exists
    const check = await request(
      "GET",
      `/api/collections/${col.name}`,
      null,
      token,
    );
    if (check.status === 200) {
      console.log("ALREADY EXISTS — skipping");
      continue;
    }

    const res = await request("POST", "/api/collections", col, token);
    if (res.status === 200 || res.status === 201) {
      console.log("✓ Created (id:", res.body.id, ")");
    } else {
      console.log(
        "FAILED:",
        res.status,
        JSON.stringify(res.body).substring(0, 200),
      );
    }
  }

  console.log("");
  console.log(
    "Done. Now restart the backend so it can use the new collections.",
  );
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
