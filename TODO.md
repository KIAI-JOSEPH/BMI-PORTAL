# BMI UMS — Implementation TODO

Generated from the codebase audit report. Items are ordered by severity within each
section. Each item includes the exact file(s) to change and a clear acceptance criterion.

---

## Legend

- 🔴 **Critical** — Security vulnerability or data-loss bug. Block deployment until fixed.
- 🟠 **High** — Functional bug or significant security gap. Fix before first real user.
- 🟡 **Medium** — Code quality, consistency, or maintainability debt. Fix in the next sprint.
- 🔵 **Low** — Hygiene, cleanup, and polish. Fix when touching the area anyway.

Progress: `0 / 57` items complete

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
- [ ] Done

### 1.2 Remove real student transcript from the repository
- **File:** `OFFICIAL_TRANSCRIPT_NYLIZP8YWFMLC1L_MARIGA.pdf` (repo root)
- **What to do:**
  1. Delete the file: `git rm OFFICIAL_TRANSCRIPT_NYLIZP8YWFMLC1L_MARIGA.pdf`
  2. Purge it from git history so it cannot be recovered: `git filter-repo --path OFFICIAL_TRANSCRIPT_NYLIZP8YWFMLC1L_MARIGA.pdf --invert-paths`
  3. Add `*.pdf` to `.gitignore` (or at minimum add the specific filename).
  4. Force-push the rewritten history.
- **Acceptance:** `git log --all --full-history -- "*.pdf"` returns no results.
- [ ] Done

### 1.3 Fix the `ca` undefined variable / `fetchAllCoreData` runtime bug
- **File:** `src/stores/dataStore.ts`
- **Lines:** ~173–195 (`fetchAllCoreData`)
- **What to do:**
  - The `Promise.all` call has **6** entries but only 5 are destructured.
    `getAllCampuses()` result is silently dropped and `ca` is used but never declared.
  - Fix the destructuring:
    ```
    const [stuRes, st, co, lib, tx, ca] = await Promise.all([
      getStudents({ perPage: 1000 }),
      getStaff({ perPage: 500 }),
      getCourses({ perPage: 500 }),
      getLibraryItems({ perPage: 500 }),
      getTransactions({ perPage: 500 }),
      getAllCampuses(),
    ]);
    ```
  - Also add `Campus` to the exports in `src/types.ts` (or import it from `src/services/campusService.ts` where it is already defined).
- **Acceptance:** `tsc --noEmit` passes with zero errors on `dataStore.ts`. Campuses load correctly after `fetchAllCoreData`.
- [ ] Done

### 1.4 Fix the login rate-limiter — value does not match stated policy
- **File:** `backend/src/routes/auth.ts`
- **Lines:** ~38–48 (`loginRateLimiter`)
- **What to do:**
  - The comment says "10 attempts per 15 minutes" but `limit` is set to `100`.
  - Decide on the correct value (recommend `10` for login brute-force protection) and update the code to match.
  - Also verify that the global `rateLimiter` in `backend/src/index.ts` does not override this — it should not apply to `/api/v1/auth/login` or should be more permissive than the login-specific one.
- **Acceptance:** After 10 failed login attempts from the same IP within 15 minutes, the endpoint returns `429`. The 11th attempt within the window is rejected.
- [ ] Done

---

## Section 2 — TypeScript Errors 🟠

All TypeScript errors must be resolved and `tsc --noEmit` must pass with zero errors before deployment. Run it with `npx tsc --noEmit` from the repo root.

### 2.1 Fix all errors in `src/stores/dataStore.ts`
- **File:** `src/stores/dataStore.ts`
- **Errors to fix:**
  1. `Module '"../types"' has no exported member 'Campus'` (line ~19)
     — Export `Campus` from `src/types.ts` or update the import to come from `src/services/campusService.ts`.
  2. `Cannot find name 'ca'` (line ~189) — covered by item 1.3 above.
  3. `This comparison appears to be unintentional because the types '…"Graduated" | "Suspended"' and '"Applicant"' have no overlap` (line ~243)
     — Either add `'Applicant'` to the `Student.status` union in `src/types.ts`, or change the filter to match an actual status value (e.g., `'Inactive'` if that is what applicants are stored as).
- **Acceptance:** `tsc --noEmit` shows zero errors for this file.
- [ ] Done

### 2.2 Fix all errors in `src/components/Transcripts.tsx`
- **File:** `src/components/Transcripts.tsx`
- **Errors to fix:**
  1. `Object literal may only specify known properties, and 'transcriptType' does not exist…` (line ~233)
     — Remove the `transcriptType` field from the object literal, or add it to the `BaseDocument` type in `src/types/documents.ts`.
  2. CDN imports `from 'https://esm.sh/jspdf@2.5.1?bundle'` and `from 'https://esm.sh/html2canvas@1.4.1?bundle'` (lines ~649, ~651)
     — Replace with the package imports that are already installed:
       `import jsPDF from 'jspdf';`
       `import html2canvas from 'html2canvas';`
     — Both packages are already in `package.json` via `html2pdf.js` (which bundles them) or add them directly: `npm install jspdf html2canvas`.
  3. `Argument of type '{ data: string; transformation: … }' is not assignable to parameter of type 'IImageOptions'` (line ~966)
     — Correct the `addImage` call to use the `IImageOptions` interface from jsPDF. The `transformation` property does not exist; use `width` and `height` as direct arguments instead.
- **Acceptance:** `tsc --noEmit` shows zero errors for this file. Transcript PDF generation works end-to-end.
- [ ] Done

### 2.3 Fix remaining TypeScript errors across other files
- **Files:** `src/App.tsx`, `src/stores/authStore.ts`, `src/components/Dashboard.tsx`, `vite.config.ts`
- **What to do:**
  - Run `npx tsc --noEmit` and address each remaining error one by one.
  - Do not use `// @ts-ignore` or `any` casts to silence errors — fix the root cause.
- **Acceptance:** `npx tsc --noEmit` exits with code `0` and no output.
- [ ] Done

### 2.4 Enable strict TypeScript mode
- **File:** `tsconfig.json` (frontend), `backend/tsconfig.json` (backend)
- **What to do:**
  - Add `"strict": true` to `compilerOptions` in both tsconfig files.
  - Fix all new errors that emerge (there will be `any` and nullability issues to address).
  - Remove `"skipLibCheck": true` from the frontend tsconfig once the library types are resolved.
- **Acceptance:** Both projects compile with `strict: true` and zero errors.
- [ ] Done

---

## Section 3 — CI / Testing 🟠

### 3.1 Add test execution to the CI pipeline
- **File:** `.github/workflows/ci.yml`
- **What to do:**
  - Add a dedicated `test` job that runs after `lint-and-build`:
    ```yaml
    test:
      runs-on: ubuntu-latest
      needs: lint-and-build
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '20.x', cache: 'npm' }
        - run: npm ci
        - run: cd backend && npm ci
        - run: npm run test          # frontend unit tests
        - run: cd backend && npm run test  # backend unit tests
    ```
  - Add a `typecheck` step to the existing `lint-and-build` job:
    ```yaml
    - name: Type check frontend
      run: npm run typecheck
    - name: Type check backend
      run: cd backend && npx tsc --noEmit
    ```
- **Acceptance:** Every push to `main`/`develop` runs all tests. A failing test blocks the merge.
- [ ] Done

### 3.2 Add integration / route tests for critical backend paths
- **Directory:** `backend/src/routes/`
- **What to do:**
  - Add tests for the following scenarios that currently have no coverage:
    - `POST /api/v1/auth/login` — returns `200` with valid credentials, returns `401` with wrong password, returns `429` after 10 failed attempts.
    - `POST /api/v1/auth/refresh` — returns `200` with valid cookie, `401` with missing cookie.
    - `POST /api/v1/auth/logout` — clears cookie, blacklists token.
    - `PATCH /api/v1/students/:id` — admin can update, `faculty` cannot update, unauthenticated gets `401`.
    - `DELETE /api/v1/students/:id` — only `admin` role succeeds; `registrar` gets `403`.
  - Use the existing pattern from `auth-guards.test.ts` and `students.behavior.test.ts`.
- **Acceptance:** `npm test` in `backend/` passes all new tests.
- [ ] Done

### 3.3 Add frontend component smoke tests
- **Directory:** `src/components/`
- **What to do:**
  - Add render tests for at minimum: `Login`, `Dashboard`, `Students`, `Grades`, `ErrorBoundary`.
  - Use `@testing-library/react` (already installed).
  - Tests should confirm the component renders without throwing and shows expected landmark text.
- **Acceptance:** `npm test` in the root passes all new tests. Coverage for these components appears in the coverage report.
- [ ] Done

---

## Section 4 — Authentication & Password Policy 🟠

### 4.1 Unify password validation across all auth endpoints
- **Files:** `backend/src/routes/auth.ts`
- **Problem:** Three different password policies:
  - `loginSchema`: min 12 characters
  - `change-password` endpoint: inline check, min 8 characters, no Zod
  - `reset-password`: Zod with complexity rules (uppercase, number, special char)
- **What to do:**
  - Extract a shared Zod schema for new/reset passwords:
    ```typescript
    const newPasswordSchema = z.string()
      .min(12, 'Password must be at least 12 characters')
      .max(128)
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character');
    ```
  - Apply it consistently to `reset-password` and `change-password`.
  - Refactor `change-password` to use `zValidator` like every other endpoint.
- **Acceptance:** Attempting to set a password shorter than 12 chars returns `400` from all three endpoints. All three endpoints use Zod for validation.
- [ ] Done

### 4.2 Remove the `isMounted` dead code in `authStore.checkSession`
- **File:** `src/stores/authStore.ts`
- **Lines:** ~37–55 (`checkSession`)
- **Problem:** `isMounted` is a React `useEffect` cleanup pattern. A Zustand action return value is discarded — no caller uses it. The flag is always `true` when checked, making it dead code.
- **What to do:**
  - Remove `let isMounted = true;` and `return () => { isMounted = false; };`.
  - Remove all `if (isMounted)` guards.
  - Keep the timeout / retry logic as-is (it is legitimate).
- **Acceptance:** `checkSession` still works correctly. No dead code remains.
- [ ] Done

---

## Section 5 — Security Hardening 🟡

### 5.1 Replace the weak token hash in the blacklist with SHA-256
- **File:** `backend/src/services/tokenBlacklist.ts`
- **Lines:** ~130–140 (`hashToken`)
- **Problem:** The current djb2-variant produces 32-bit integer hashes. With millions of tokens this will produce collisions, which could incorrectly block valid users.
- **What to do:**
  - Replace the custom implementation:
    ```typescript
    import { createHash } from 'crypto';

    function hashToken(token: string): string {
      return createHash('sha256').update(token, 'utf8').digest('hex').slice(0, 32);
    }
    ```
  - This gives 128-bit collision resistance while keeping the Redis key short.
- **Acceptance:** `hashToken` uses Node's `crypto` module. The output is always 32 hex chars. Two different JWTs never produce the same hash in any reasonable test.
- [ ] Done

### 5.2 Remove insecure default values from config
- **File:** `backend/src/config/index.ts`
- **What to do:**
  - Change every insecure default to `undefined` (or throw immediately if missing):
    - `JWT_SECRET: process.env.JWT_SECRET` (no fallback string)
    - `ENCRYPTION_KEY: process.env.ENCRYPTION_KEY` (no fallback string)
    - `POCKETBASE_ADMIN_PASSWORD: process.env.POCKETBASE_ADMIN_PASSWORD` (no fallback)
  - The `validateConfig()` function already throws on the old defaults — this just ensures the fallback is never silently used in tests or edge cases.
  - Add a `.env.example` file at `backend/.env.example` with placeholder comments for every required variable. This is what `SECURITY.md` recommends but the file was never created.
- **Acceptance:** Starting the server without setting `JWT_SECRET` exits with the security error. `.env.example` exists and documents all required variables.
- [ ] Done

### 5.3 Replace hardcoded `BMIAdmin2024Secure` in all scripts with env-var fallback
- **Directory:** `backend/scripts/` (20+ files)
- **What to do:**
  - For every script file that contains the literal `BMIAdmin2024Secure`:
    ```typescript
    // Before
    const ADMIN_PASSWORD = 'BMIAdmin2024Secure';

    // After
    const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD) throw new Error('Set POCKETBASE_ADMIN_PASSWORD env var');
    ```
  - Alternatively, create a shared `scripts/config.ts` that all scripts import for their PocketBase connection, and centralise the env-var lookup there.
- **Acceptance:** Grepping for `BMIAdmin2024Secure` in the codebase returns zero results.
- [ ] Done

### 5.4 Tighten CORS configuration
- **File:** `backend/src/config/index.ts`, `backend/src/index.ts`
- **Problem:** `CORS_ORIGIN` defaults to `'*'`. The production warning exists but is just a `console.warn`.
- **What to do:**
  - Remove the `'*'` default; require `CORS_ORIGIN` to be explicitly set.
  - In `validateConfig()`, add `CORS_ORIGIN` to the required-in-production check and `process.exit(1)` if it is `'*'` in production (matching the behaviour of the other security checks).
- **Acceptance:** Starting in `NODE_ENV=production` with `CORS_ORIGIN=*` exits with a security error.
- [ ] Done

---

## Section 6 — Frontend Data & UI Correctness 🟡

### 6.1 Replace hardcoded dashboard data with real API calls
- **File:** `src/components/Dashboard.tsx`
- **What to do:**
  - Remove the hardcoded `revenueTrend` array (lines ~14–21). Fetch real month-by-month transaction totals from the backend (a new `GET /api/v1/dashboard/revenue-trend` endpoint, or compute it client-side from `useDataStore().transactions`).
  - Replace the hardcoded "Recent Activity" list with real data from the audit log endpoint (or a new `GET /api/v1/dashboard/recent-activity` endpoint returning the last N audit events).
  - Replace `events: 5` with a real count (or remove the stat card until the feature exists).
- **Acceptance:** The dashboard chart and activity feed show real data from the database. There are no hardcoded arrays in the component file.
- [ ] Done

### 6.2 Fix the `Student.status` enum mismatch
- **File:** `src/types.ts` (or wherever the status union is defined)
- **Problem:** `Student.status` is typed as `'Active' | 'Inactive' | 'Graduated' | 'Suspended'` but `'Applicant'` is used in multiple filter expressions, causing a TS error and always returning zero results.
- **What to do:**
  - **Option A (preferred):** Add `'Applicant'` to the `status` union and ensure PocketBase's collection schema allows it. Update the backend `studentSchema` in `students.ts` to include it.
  - **Option B:** Determine if applicants are stored differently (e.g., a separate `applications` collection) and fix the dashboard filter to query that collection.
- **Acceptance:** The "New Admissions" dashboard stat accurately reflects the count of students in the applicant/pending state. The TS error is resolved.
- [ ] Done

### 6.3 Switch frontend data fetching from page-size-1000 to real pagination
- **Files:** `src/stores/dataStore.ts`, relevant service files
- **Problem:** `getStudents({ perPage: 1000 })` loads the entire student table into browser memory on every poll. This will degrade significantly as data grows.
- **What to do:**
  - Change `dataStore` to only fetch the first page of each collection (e.g., `perPage: 50`).
  - Components that display lists (e.g., `Students.tsx`) should manage their own `page` / `search` state and call the service directly rather than filtering a full in-memory array.
  - Keep the summary stats (total count) coming from the metadata returned by the API (`meta.total`), not `students.length`.
- **Acceptance:** The initial app load fetches at most 50 students. Scrolling or paginating in the Students view loads the next page on demand.
- [ ] Done

### 6.4 Remove the `LegacyPropsWrapper` from the router
- **File:** `src/router/index.tsx`
- **What to do:**
  - Remove `LegacyPropsWrapper` entirely.
  - Update each component that still reads the legacy props (`students`, `setStudents`, etc.) to call `useDataStore()` directly instead.
  - Verify that removing the wrapper does not break any component (components that already use the store need no change; only those still relying on props need updating).
- **Acceptance:** `LegacyPropsWrapper` does not appear anywhere in the codebase. All list/detail components read from Zustand stores.
- [ ] Done

### 6.5 Deduplicate the stats computation
- **Files:** `src/stores/dataStore.ts`, `src/App.tsx`, `src/components/Dashboard.tsx`
- **Problem:** The same `{ students, admissions, tuition, events }` calculation is written three times.
- **What to do:**
  - Keep `getStats()` in `dataStore` as the single source of truth.
  - Delete the `React.useMemo` stat blocks from `App.tsx` and `Dashboard.tsx`.
  - Update `Dashboard.tsx` to call `useDataStore((s) => s.getStats())`.
- **Acceptance:** The stats calculation exists in exactly one place.
- [ ] Done

---

## Section 7 — Code Quality & Dependencies 🟡

### 7.1 Remove server-side packages from the frontend dependencies
- **File:** `package.json` (root / frontend)
- **Problem:** `cors`, `helmet`, and `express-rate-limit` are listed as runtime `dependencies`. These are Node.js server libraries; they serve no purpose in a browser bundle.
- **What to do:**
  - Run: `npm uninstall cors helmet express-rate-limit`
  - If any frontend code imports them (unlikely), replace with browser-compatible alternatives.
- **Acceptance:** `package.json` does not list `cors`, `helmet`, or `express-rate-limit` under `dependencies` or `devDependencies`.
- [ ] Done

### 7.2 Fix the `change-password` endpoint to use Zod validation
- **File:** `backend/src/routes/auth.ts`
- **Lines:** `authRouter.post('/change-password', ...)`
- **What to do:**
  - Create a `changePasswordSchema`:
    ```typescript
    const changePasswordSchema = z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: newPasswordSchema,  // reuse from item 4.1
    });
    ```
  - Apply `zValidator('json', changePasswordSchema)` to the route.
  - Remove the manual `if (!currentPassword || !newPassword)` and length check.
- **Acceptance:** The endpoint validates via Zod. Sending a body missing `currentPassword` returns a structured `400` with field-level errors.
- [ ] Done

### 7.3 Remove `src/test-build.tsx` from source
- **File:** `src/test-build.tsx`
- **What to do:** Delete the file. It is a development artifact that should not be in `src/`.
- **Acceptance:** `src/test-build.tsx` does not exist.
- [ ] Done

### 7.4 Reduce `any` usage in backend routes and tests
- **Files:** `backend/src/routes/*.ts`, `backend/src/routes/*.test.ts`
- **Problem:** Widespread use of `c: any`, `(c as any)`, `error: any`, etc. This defeats TypeScript's purpose.
- **What to do:**
  - In route handlers, replace `error: any` with `error: unknown` and use type narrowing:
    ```typescript
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
    ```
  - In test files, type the mock context properly using Hono's `Context` type or the existing `AppEnv` type.
  - Use the `AppEnv` generic in route files: `const router = new Hono<AppEnv>();`.
- **Acceptance:** `any` appears zero times in `backend/src/routes/` (outside of third-party type issues).
- [ ] Done

### 7.5 Replace the simulated connection pool with appropriate PocketBase usage
- **File:** `backend/src/services/pocketbasePool.ts`
- **Problem:** PocketBase is a single-process SQLite server over HTTP. Creating multiple `PocketBase` JS client instances does not give traditional connection-pooling benefits — each instance is a stateless HTTP client wrapper. The overhead of the pool is higher than its benefit.
- **What to do:**
  - Replace the pool with a single, shared, authenticated `PocketBase` singleton (which `pocketbase.ts` already provides via `getPocketBase()`).
  - Remove `pocketbasePool.ts` and `withPocketBase()` helper.
  - Update all files that call `withPocketBase(async (pb) => ...)` to call `getPocketBase()` directly.
- **Acceptance:** `pocketbasePool.ts` is deleted. All routes use the singleton from `pocketbase.ts`. Performance is equivalent or better due to reduced object allocation.
- [ ] Done

---

## Section 8 — Repository Hygiene 🔵

### 8.1 Remove Windows Zone.Identifier artifacts from the repository
- **Files:**
  - `vite.config.tsZone.Identifier`
  - `Transcripts.tsxZone.Identifier`
  - `bmi_portal_audit_report.htmlZone.Identifier`
  - `teaching_guide.mdZone.Identifier`
- **What to do:**
  1. `git rm "vite.config.tsZone.Identifier" "src/components/Transcripts.tsxZone.Identifier"` (and others)
  2. Add `*.Identifier` and `*Zone.Identifier` to `.gitignore`.
- **Acceptance:** No `Zone.Identifier` files appear in `git status` or `git ls-files`.
- [ ] Done

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
- **File:** `.gitignore`
- **What to do:**
  - Add the following lines:
    ```
    # Windows alternate data streams
    *.Identifier
    *Zone.Identifier

    # Uploaded/generated PDFs and spreadsheets
    *.pdf
    *.xlsx
    *.xls
    !UMS_Import_Template_BMI.xlsx   # keep the template

    # Runtime artifacts
    build_output.log
    err.log
    out.log
    backend/err.log
    backend/out.log

    # Scratch / dev workspace
    scratch/
    ```
- **Acceptance:** Running `git status` after the above changes shows no untracked Zone.Identifier files, PDFs, or log files.
- [ ] Done

### 8.5 Add a proper `.env.example` file
- **File:** `backend/.env.example` (create new)
- **What to do:**
  Create the file with all required and optional variables, commented:
  ```
  # ── Server ─────────────────────────────────────────────
  PORT=3001
  HOST=0.0.0.0
  NODE_ENV=development

  # ── Security (REQUIRED — generate with: openssl rand -hex 32) ──
  JWT_SECRET=
  ENCRYPTION_KEY=

  # ── JWT Algorithm (optional — set both for RS256, omit for HS256) ──
  # JWT_PRIVATE_KEY=
  # JWT_PUBLIC_KEY=

  # ── PocketBase ──────────────────────────────────────────
  POCKETBASE_URL=http://127.0.0.1:8090
  POCKETBASE_ADMIN_EMAIL=admin@bmi.edu
  POCKETBASE_ADMIN_PASSWORD=

  # ── Ollama AI (optional) ────────────────────────────────
  OLLAMA_URL=http://127.0.0.1:11434
  OLLAMA_MODEL=llama3.2

  # ── CORS (set to your frontend domain in production) ───
  CORS_ORIGIN=http://localhost:3000

  # ── Redis (optional — for multi-instance token blacklist) ──
  REDIS_ENABLED=false
  REDIS_URL=redis://localhost:6379
  ```
- **Acceptance:** `backend/.env.example` exists and is committed. `backend/.env` is in `.gitignore`.
- [ ] Done

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
- **File:** `.github/workflows/ci.yml`
- **What to do:**
  - Inside the `lint-and-build` job, after `npm ci` for the backend, add:
    ```yaml
    - name: Type check backend
      run: cd backend && npx tsc --noEmit
    ```
- **Acceptance:** A TypeScript error in backend code causes the CI job to fail.
- [ ] Done

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
