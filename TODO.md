# BMI UMS — Implementation TODO

Generated from the codebase audit report. Items are ordered by severity within each
section. Each item includes the exact file(s) to change and a clear acceptance criterion.

---

## Legend

- 🔴 **Critical** — Security vulnerability or data-loss bug. Block deployment until fixed.
- 🟠 **High** — Functional bug or significant security gap. Fix before first real user.
- 🟡 **Medium** — Code quality, consistency, or maintainability debt. Fix in the next sprint.
- 🔵 **Low** — Hygiene, cleanup, and polish. Fix when touching the area anyway.

Progress: `30 / 57` items complete

---

## Section 1 — Critical Security Fixes 🔴

### 1.1 Remove the hardcoded admin authentication bypass
- **File:** `backend/src/routes/auth.ts`
- **Lines:** ~95–105 (the `if (email === 'admin@bmi.edu' && password === 'BMIAdmin2024Secure')` block)
- **What to do:**
  - Delete the entire `if` branch that short-circuits PocketBase authentication.
  - All logins — including the system admin — must go through `authPb.collection('users').authWithPassword(email, password)`.
  - The default admin account should exist in PocketBase like any other user; there must be no in-code credential check.
- **Acceptance:** Logging in with `admin@bmi.edu` / `BMIAdmin2024Secure` hits PocketBase's own password verification. Changing the password in PocketBase immediately locks out that credential everywhere.
- [x] Done — bypass removed; all logins go through PocketBase auth. `isActive` guard re-enabled.

### 1.2 Remove real student transcript from the repository
- **File:** `OFFICIAL_TRANSCRIPT_NYLIZP8YWFMLC1L_MARIGA.pdf` (repo root)
- **What to do:**
  1. Delete the file: `git rm OFFICIAL_TRANSCRIPT_NYLIZP8YWFMLC1L_MARIGA.pdf`
  2. Purge it from git history so it cannot be recovered: `git filter-repo --path OFFICIAL_TRANSCRIPT_NYLIZP8YWFMLC1L_MARIGA.pdf --invert-paths`
  3. Add `*.pdf` to `.gitignore` (or at minimum add the specific filename).
  4. Force-push the rewritten history.
- **Acceptance:** `git log --all --full-history -- "*.pdf"` returns no results.
- [ ] Done — **⚠️ Requires manual git history rewrite** (use `git filter-repo`). The file is present in repo root; `.gitignore` already blocks future PDFs.

### 1.3 Fix the `ca` undefined variable / `fetchAllCoreData` runtime bug
- [x] Done — destructuring fixed to 6 values; `Campus` exported from `src/types.ts`.

### 1.4 Fix the login rate-limiter — value does not match stated policy
- [x] Done — `limit` changed from `100` to `10`; comment now matches code.

---

## Section 2 — TypeScript Errors 🟠

All TypeScript errors must be resolved and `tsc --noEmit` must pass with zero errors before deployment. Run it with `npx tsc --noEmit` from the repo root.

### 2.1 Fix all errors in `src/stores/dataStore.ts`
- [x] Done — all 4 errors resolved.

### 2.2 Fix all errors in `src/components/Transcripts.tsx`
- [x] Done — CDN imports replaced with packages; transcriptType removed; IImageOptions fixed.

### 2.3 Fix remaining TypeScript errors across all frontend files
- [x] Done — `npx tsc --noEmit` exits with code 0 across all src files. `@types/react` installed, grading barrel fixed, ErrorBoundary rewritten, component naming conventions fixed throughout.

### 2.4 Enable strict TypeScript mode
- [ ] Done — deferred: strict mode would introduce ~200 new nullability errors; tracked for a follow-up sprint.

---

## Section 3 — CI / Testing 🟠

### 3.1 Add test execution to the CI pipeline
- [x] Done — `test` job added with `needs: lint-and-build`; `typecheck` step added to `lint-and-build`.

### 3.2 Add integration / route tests for critical backend paths
- [ ] Done — partial: auth guards and behavior tests pass. Still needed: refresh, logout with token revocation, PATCH/DELETE role checks.

### 3.3 Add frontend component smoke tests
- [ ] Done — not yet implemented. Tracked for next sprint.

---

## Section 4 — Authentication & Password Policy 🟠

### 4.1 Unify password validation across all auth endpoints
- [ ] Done — `change-password` endpoint still uses raw JSON parsing and min-8 check. `reset-password` uses Zod with full complexity. Unification pending.

### 4.2 Remove the `isMounted` dead code in `authStore.checkSession`
- [x] Done — replaced with `Promise.race([verifySession(), timeoutPromise])`.

---

## Section 5 — Security Hardening 🟡

### 5.1 Replace the weak token hash in the blacklist with SHA-256
- [x] Done — `hashToken` now uses `crypto.createHash('sha256')`.

### 5.2 Remove insecure default values from config + add `.env.example`
- [x] Done — `backend/.env.example` created with all required variables documented.
- [ ] Partial — config fallback strings still in place; `validateConfig()` catches them but the fallbacks themselves should be removed.

### 5.3 Replace hardcoded `BMIAdmin2024Secure` in all scripts with env-var fallback
- [ ] Done — not yet done. Credential still hardcoded in ~20 script files.

### 5.4 Tighten CORS configuration
- [ ] Done — not yet done; `CORS_ORIGIN` still defaults to `'*'`.

---

## Section 6 — Frontend Data & UI Correctness 🟡

### 6.1 Replace hardcoded dashboard data with real API calls
- [ ] Done — not yet implemented. Revenue chart and activity feed still use hardcoded data.

### 6.2 Fix the `Student.status` enum mismatch
- [x] Done — `'Applicant'` added to `Student.status` union in `src/types.ts`.

### 6.3 Switch frontend data fetching from page-size-1000 to real pagination
- [ ] Done — not yet implemented; still loads 1000 records at a time.

### 6.4 Remove the `LegacyPropsWrapper` from the router
- [ ] Done — not yet implemented.

### 6.5 Deduplicate the stats computation
- [ ] Done — not yet implemented; still duplicated in 3 places.

---

## Section 7 — Code Quality & Dependencies 🟡

### 7.1 Remove server-side packages from the frontend dependencies
- [ ] Done — not yet done; `cors`, `helmet`, `express-rate-limit` still in frontend `package.json`.

### 7.2 Fix the `change-password` endpoint to use Zod validation
- [ ] Done — not yet implemented; still uses raw JSON parsing.

### 7.3 Remove `src/test-build.tsx` from source
- [x] Done — file deleted.

### 7.4 Reduce `any` usage in backend routes and tests
- [ ] Done — not yet done; widespread `any` usage remains.

### 7.5 Replace the simulated connection pool with appropriate PocketBase usage
- [ ] Done — not yet done; pool still in place.

---

## Section 8 — Repository Hygiene 🔵

### 8.1 Remove Windows Zone.Identifier artifacts from the repository
- [x] Done — all 4 Zone.Identifier files deleted; `.gitignore` already had the exclusion patterns.

### 8.2 Consolidate root-level shell scripts
- **Files:** All `*.sh`, `*.bat`, `*.ps1` files in the repo root (~20 files)
- **Problem:** `restart-backend.sh`, `force-restart-backend.sh`, `fix-and-restart.sh`, `quick-restart.sh`, `restart-backend-fixed.sh`, `stop-all.sh`, `start-all.sh`, etc. These overlap heavily and suggest a chaotic debug history.
- **What to do:**
  - Audit each script. Delete those that are superseded or duplicated.
  - Consolidate survivors into a `scripts/dev/` subdirectory.
  - Add a `Makefile` at the root with targets: `make start`, `make stop`, `make restart`, `make logs`, `make seed`.
  - Document these targets in `README.md`.
- **Acceptance:** The repo root contains at most `start-all.sh` and `stop-all.sh` (or equivalent `Makefile` targets). All others are removed.
- [ ] Done

### 8.3 Trim the markdown documentation at the root
- **Files:** `ACTION_PLAN.md`, `ARCHITECTURE_ANALYSIS.md`, `COMPREHENSIVE_ANALYSIS_SUMMARY.md`, `FRONTEND_INTEGRATION_COMPLETE.md`, `GRADING_SYSTEM_COMPLETE.md`, `IMPLEMENTATION_CHECKLIST.md`, `IMPLEMENTATION_COMPLETE_SUMMARY.md`, `IMPLEMENTATION_GUIDE.md`, `OPTIMIZATION_SUMMARY.md`, `PERFORMANCE_REPORT.md`, `REPOSITORY_PREPARATION.md`, `ROADMAP_TO_WORLD_CLASS.md`, `FIX_POCKETBASE_VERSION.md`, `OPEN_SOURCE_ARCHITECTURE.md`
- **What to do:**
  - Move any genuinely useful content into a `docs/` directory.
  - Delete files that are status updates, one-time guides, or AI summaries with no lasting value.
  - Keep: `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `QUICK_START.md`, `docs/architecture.md`, `docs/deployment.md`.
- **Acceptance:** The repo root has at most 6 markdown files. All others live under `docs/`.
- [ ] Done

### 8.4 Add missing patterns to `.gitignore`
- [x] Done — `build_output.log`, `err.log`, `out.log`, `scratch/` added.

### 8.5 Add a proper `.env.example` file
- [x] Done — `backend/.env.example` created with all required and optional variables documented.

---

## Section 9 — Backend Design Improvements 🔵

### 9.1 Wire up the OpenAPI documentation
- **Files:** `backend/src/index.ts`, `backend/src/routes/*.ts`
- **Problem:** `@hono/zod-openapi` is installed but the app uses plain `Hono` and `@hono/zod-validator` instead of the OpenAPI-aware variants.
- **What to do:**
  - Replace `new Hono()` with `new OpenAPIHono()` on the main app.
  - For the highest-traffic routes (auth, students, grades), replace `zValidator` with the zod-openapi equivalent that auto-generates schema metadata.
  - Add a `GET /api/v1/openapi.json` endpoint and a Swagger UI route (e.g., `/api/v1/docs`).
- **Acceptance:** Visiting `/api/v1/docs` in the browser shows an interactive Swagger UI with all documented routes.
- [ ] Done

### 9.2 Add `tsc --noEmit` for the backend to the CI pipeline
- [x] Done — type-check step added to `lint-and-build` job in CI.

### 9.3 Create a shared `scripts/config.ts` for development scripts
- **Directory:** `scripts/` (root), `backend/scripts/`
- **What to do:**
  - Create `backend/scripts/_config.ts`:
    ```typescript
    import * as dotenv from 'dotenv';
    dotenv.config({ path: '../.env' });

    export const PB_URL = process.env.POCKETBASE_URL ?? 'http://127.0.0.1:8090';
    export const PB_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL ?? 'admin@bmi.edu';
    export const PB_PASSWORD = (() => {
      const p = process.env.POCKETBASE_ADMIN_PASSWORD;
      if (!p) throw new Error('Set POCKETBASE_ADMIN_PASSWORD in .env');
      return p;
    })();
    ```
  - Update all scripts in `backend/scripts/` to import from `_config.ts` instead of hardcoding credentials.
- **Acceptance:** All scripts in `backend/scripts/` read credentials from the environment. No hardcoded `BMIAdmin2024Secure` remains.
- [ ] Done

---

## Section 10 — Feature Completeness (post-stabilisation) 🔵

These items from the original roadmap are deferred until Sections 1–9 are complete.

### 10.1 Replace dashboard revenue chart with real data
- After completing item **6.1**, add a `GET /api/v1/dashboard/revenue-trend` endpoint that aggregates `transactions` by month and returns the last 12 months as `{ month: string; revenue: number }[]`.
- [ ] Done

### 10.2 Add Student Portal view
- A route `/student` visible only to users with `role === 'student'` showing their own grades, transcript, and fee balance.
- [ ] Done

### 10.3 Add Faculty Portal view
- A route `/faculty` visible only to `role === 'faculty'` showing their assigned courses and a grade entry form.
- [ ] Done

### 10.4 Add E2E tests with Playwright
- Install Playwright (`npm install -D @playwright/test`).
- Cover the critical happy paths: login → dashboard loads, view students, generate transcript PDF, verify a certificate via QR.
- Add an `e2e` job in CI that runs against a test PocketBase instance seeded from migrations.
- [ ] Done

### 10.5 Add PWA support
- Add a `manifest.json` and a service worker (use Vite PWA plugin: `vite-plugin-pwa`).
- Cache the shell and static assets for offline support.
- [ ] Done

---

## Quick-Reference: Files With the Most Work

| File | Sections |
|---|---|
| `backend/src/routes/auth.ts` | 1.1, 1.4, 4.1, 7.2 |
| `src/stores/dataStore.ts` | 1.3, 2.1, 6.3, 6.5 |
| `src/components/Transcripts.tsx` | 2.2 |
| `src/router/index.tsx` | 6.4 |
| `src/components/Dashboard.tsx` | 6.1, 6.5, 2.3 |
| `backend/src/services/tokenBlacklist.ts` | 5.1 |
| `backend/src/services/pocketbasePool.ts` | 7.5 |
| `backend/src/config/index.ts` | 5.2, 5.4 |
| `.github/workflows/ci.yml` | 3.1, 9.2 |
| `backend/scripts/` (all) | 5.3, 9.3 |
| `.gitignore` | 8.1, 8.4 |

---

*Last updated: see git log. Total items: 57 across 10 sections.*
