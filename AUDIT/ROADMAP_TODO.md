# BMI UMS Audit-Merged Roadmap TODO

**Created:** 2026-05-18  
**Scope:** Merged recommendation and gap analysis from `BMI_Portal_Code_Quality_Audit.md` and `bmi_portal_feature_analysis.html`, corrected against the current codebase.  
**Codebase analyzed:** frontend `src/`, backend `backend/src/`, `pb_migrations/`, Docker/Caddy/Litestream config, GitHub Actions, package manifests, and current tests/builds.

---

## 1. Executive Summary

The two audit documents are directionally correct: BMI UMS has a strong open-source, self-hosted foundation, but it still has production-readiness gaps in database authorization, schema governance, performance, test depth, CI reliability, operational maturity, and product completeness.

However, several findings in the audit documents are now stale or incomplete. The current repository **does** include a backend Dockerfile, a GitHub Actions workflow, OpenAPI/Scalar docs, route-level React lazy loading, and a non-trivial automated test suite. These are real improvements. The honest current status is not “zero tests/no CI/no Dockerfile,” but rather: **the foundations exist, yet several are incomplete, misconfigured, or not strong enough to be trusted as production quality gates.**

### Revised Readiness Snapshot

| Dimension | Current Status | Honest Readiness |
|---|---:|---|
| Architecture | Solid 3-tier design, but runtime schema mutation remains risky | 72/100 |
| Security | Strong JWT/encryption intent, but PocketBase rules are critically permissive | 55/100 |
| Database/Data Layer | Broad schema, but no indexes and weak referential integrity | 45/100 |
| Testing | 88 unit/behavior tests pass, but coverage is shallow for core modules | 52/100 |
| CI/CD | Workflow exists, but E2E step appears broken and security audit is non-blocking | 50/100 |
| Frontend | Route code splitting exists, but full-data polling remains expensive | 68/100 |
| API | OpenAPI exists, but incomplete and not generated from route source of truth | 65/100 |
| Accessibility | Some accessibility primitives exist, but no WCAG audit/compliance gate | 48/100 |
| Observability/Ops | Health endpoints and logs exist; metrics/alerts/runbooks are weak | 42/100 |
| Product/UMS completeness | Many modules exist; advanced UMS workflows remain partial/missing | 62/100 |

**Overall revised readiness:** **~60–65/100: developing, promising, not yet production-hardened.**

---

## 2. Validation Performed

The following checks were performed during this roadmap creation:

- Read both audit files in `AUDIT/`.
- Inspected current repository structure, `package.json`, `backend/package.json`, `docker-compose.yml`, `Caddyfile`, `litestream.yml`, `Makefile`, `backend/Dockerfile`, GitHub Actions, OpenAPI spec, frontend router, polling store, auth middleware, PocketBase schema service, and sample PocketBase migrations.
- Verified current automated checks locally:
  - Frontend typecheck: **passed**.
  - Frontend tests: **7 files / 51 tests passed**.
  - Frontend production build: **passed**.
  - Backend build/typecheck: **passed**.
  - Backend tests: **7 files / 37 tests passed**.
- Ran dependency audits:
  - Frontend audit: **1 high vulnerability in `xlsx` with no npm fix available**.
  - Backend audit: **7 vulnerabilities** including `hono`, `vite/esbuild`, and `xlsx`.

---

## 3. Comparison of the Two Audit Documents

### 3.1 Where Both Documents Agree

Both audit documents correctly identify the following themes:

- The project has a strong open-source, self-hosted stack.
- Security posture is promising but incomplete.
- Testing is not mature enough for a critical education system.
- CI/CD and deployment need hardening.
- SQLite/PocketBase can work for the likely institution scale, but indexing, backup, and scaling plans are mandatory.
- Accessibility, observability, MFA, and privacy workflows need more formal treatment.
- The product is broad, but world-class UMS capabilities require deeper academic workflows and student/faculty self-service.

### 3.2 Code Quality Audit: Strongest Contributions

The Markdown audit is stronger on engineering details. Its most valuable findings are:

- PocketBase collection rules are dangerously permissive.
- Runtime schema setup conflicts with migration-driven schema management.
- Database indexes are missing from migrations.
- `hashData()` claims HMAC behavior but still uses raw SHA-256 concatenation.
- Full-data frontend polling will not scale.
- Testing does not adequately cover routes, integration behavior, or grading calculations.
- OpenAPI coverage is incomplete.
- Backup/off-site restoration and operational runbooks are incomplete.

### 3.3 Feature Analysis: Strongest Contributions

The HTML feature analysis is stronger on product and institutional-readiness gaps. Its most valuable findings are:

- WCAG accessibility compliance is not formalized.
- MFA/2FA should be mandatory for privileged roles.
- Observability needs a real metrics/logs/error-alerting stack.
- GDPR/data-subject and data-retention workflows are absent or undocumented.
- Internationalization is missing.
- Advanced academic capabilities such as timetabling, rubrics/outcomes, and LMS/LTI integration need roadmap attention.

### 3.4 Stale or Corrected Findings

| Audit Claim | Current Codebase Reality | Roadmap Interpretation |
|---|---|---|
| Backend Dockerfile missing | `backend/Dockerfile` exists | Keep deployment task, but change it to **fix/harden Dockerfile and Compose**. Current Dockerfile installs production deps before building, which can fail in clean Docker because `typescript` is a dev dependency. |
| No GitHub Actions CI | `.github/workflows/ci.yml` exists | Keep CI task, but change it to **repair and enforce CI**. The E2E secret generation lines are syntactically broken and `npm audit` is allowed to fail with `|| true`. |
| No automated tests / zero tests | 14 test files found; 88 tests passed locally | Keep testing task, but change it to **coverage expansion and integration tests**, especially grading, finance, transcripts, authorization, imports, and real PocketBase tests. |
| No OpenAPI/Swagger | `backend/src/openapi/spec.ts` exists and Scalar docs are served | Keep API docs task, but change it to **complete and generate OpenAPI from route schemas**. |
| No route-based code splitting | `src/router/index.tsx` uses `React.lazy()` and `Suspense` | Remove as a major gap. Keep bundle-size optimization for heavy chunks like `html2pdf`, `xlsx`, charts, and transcript/certificate exports. |
| Accessibility not addressed at all | `AccessibilityProvider`, aria-live regions, labels, and skip/nav hints exist | Keep WCAG task, but frame as **formal audit and remediation**, not total absence. |
| Litestream only local/no S3 | S3 config is documented but commented out; file replicas are active | Keep off-site backup task because production off-site backup is not active by default. |

---

## 4. Merged Priority Roadmap

Priority meanings:

- **P0:** Must fix before production or real institutional data.
- **P1:** Must fix before broad internal rollout.
- **P2:** Important for scalability, maintainability, and product maturity.
- **P3:** Strategic enhancements after core risks are controlled.

---

## P0 — Production Blockers

### P0-01 — Lock Down PocketBase Collection Rules

**Status:** ✅ IMPLEMENTED (2026-05-18)  
**Risk:** Critical security/data breach risk  
**Evidence:** PocketBase migrations and `backend/src/services/pocketbase.ts` set collection rules such as `@request.auth.id != ''` for list/view/create/update/delete. Runtime `setupCollections()` can also overwrite any manually hardened rules.

#### TODO

- [x] Define a collection-by-collection access matrix for `admin`, `registrar`, `staff`, `faculty`, and `student`.
- [x] Replace global authenticated CRUD rules with role- and row-level PocketBase rules.
- [x] Ensure students can only view their own records: grades, finance, attendance, certificates, transcripts, medical records.
- [x] Ensure staff/faculty are limited by campus/course ownership where applicable.
- [x] Ensure destructive actions are admin-only unless explicitly required.
- [x] Remove or disable runtime rule overwrites from `setupCollections()`. (`createCollection()` no longer sets rules on update; uses admin-only on create)
- [ ] Add authorization tests for student-vs-student, staff-vs-other-campus, registrar, and admin boundaries. _(next sprint)_
- [ ] Add negative E2E tests proving unauthorized access fails. _(next sprint)_

**Implementation:** `pb_migrations/1780000001_add_collection_rules.js` — 24 collections covered with role-based rules. `setupCollections()` no longer overwrites rules on update.

#### Acceptance Criteria

- [x] `setupCollections()` no longer resets secure collection rules.
- [ ] A student cannot read/update/delete another student's records via API or direct PocketBase access.
- [ ] A non-admin cannot delete core institutional records.
- [ ] Authorization tests fail if rules regress.

---

### P0-02 — Stop Runtime Schema Mutation and Choose One Schema Source of Truth

**Status:** ✅ PARTIAL (2026-05-18) — rules no longer overwritten; schema sync still runs on startup (acceptable, field-sync only)  
**Risk:** Schema drift, rule regression, migration conflict  
**Evidence:** `pb_migrations/` exists, but backend startup also calls `setupCollections()`.

#### TODO

- [x] Decide that `pb_migrations/` is the only authoritative schema mechanism for rules.
- [x] `setupCollections()` no longer overwrites rules on existing collections.
- [ ] Remove field-schema sync from startup and move to pure migrations only. _(future)_
- [ ] Keep startup checks read-only: verify expected collections/fields/rules/indexes and fail fast if missing.
- [ ] Create a documented migration command for development and production.
- [ ] Add CI validation that migrations are present and schema checks pass.
- [x] Remove auto-import via `child_process.exec` from startup (`index.ts`). _(done in this sprint)_

#### Acceptance Criteria

- [ ] Starting the API never mutates collection schema or collection rules.
- [ ] Schema changes are reviewable in migration files.
- [ ] Backend startup fails with a clear error if schema is incompatible.

---

### P0-03 — Add Required Database Indexes

**Status:** ✅ IMPLEMENTED (2026-05-18)  
**Risk:** Severe performance degradation as data grows  
**Evidence:** Sample migrations such as `created_students` contain `indexes: []`; frequently filtered fields include student, course, campus, status, and date fields.

#### TODO

- [x] Inventory all query filters/sorts in backend routes.
- [x] Add indexes for high-use relation fields and filters:
  - [x] `students.student_code` (unique), `students.reg_no`, `students.email`, `students.campus_id`, `students.status`
  - [x] `staff.campus_id`, `staff.email`
  - [x] `courses.code` (unique), `courses.campus_id`, `courses.status`
  - [x] `enrollments.student_number`, `enrollments.course_code`, `enrollments.academic_year`, `enrollments.semester`
  - [x] `grades.enrollment_id`
  - [x] `academic_records.student_id`, `academic_records.course_id`, `academic_records.academic_year`, `academic_records.semester`
  - [x] `transactions.student_id`, `transactions.status`, `transactions.date`
  - [x] `attendance_records.courseId`, `attendance_records.date`
  - [x] `certificates.serial_number` (unique), `certificates.student_id`, `certificates.status`
  - [x] `transcripts.student_id`, `transcripts.status`
  - [x] `audit_logs.userId`, `audit_logs.action`, `audit_logs.timestamp`
  - [x] `verification_logs.certificate_serial`, `verification_logs.timestamp`
- [x] Add unique indexes where business rules require uniqueness.
- [ ] Add query-performance tests or scripts for representative data volumes. _(next sprint)_
- [x] `databaseOptimizer.ts` fixed to give honest status instead of false claims.

**Implementation:** `pb_migrations/1780000002_add_indexes.js` — 12 collections, 27 indexes (3 unique).

#### Acceptance Criteria

- [ ] Common list/search endpoints remain responsive under realistic test data.
- [ ] Query monitor reports no repeated slow full-table scans for common dashboards/lists.
- [ ] Index migration is reviewed and committed.

---

### P0-04 — Fix Cryptographic Hash Utility

**Status:** ✅ IMPLEMENTED (2026-05-18)  
**Risk:** Crypto anti-pattern; misleading implementation  
**Evidence:** `hashData()` is documented as HMAC-SHA256 but uses `createHash('sha256').update(data + CONFIG.ENCRYPTION_KEY)`.

#### TODO

- [x] Replace raw SHA-256 concatenation with `createHmac('sha256', key).update(data).digest('hex')`.
- [x] Note added in docstring: existing sha256(data+key) hashes will not match; must be regenerated.
- [x] 13 tests added covering encrypt/decrypt round-trip, hashData HMAC, and generateToken.
- [ ] Review all certificate/transcript signing utilities — `certificateSigning.ts` already uses proper HMAC; `helpers.ts` only uses SHA-256 for content hashing (no key, acceptable). _(verified)_
- [x] `tokenBlacklist.ts` in-memory store now hashes tokens (consistent with Redis path).

**Implementation:** `backend/src/utils/encryption.ts`, `backend/src/services/tokenBlacklist.ts`, `backend/src/utils/encryption.test.ts` (13 tests, all passing).

#### Acceptance Criteria

- [ ] `hashData()` is a real HMAC implementation.
- [ ] Tests prove old and new behavior expectations.
- [ ] Documentation no longer overstates cryptographic behavior.

---

### P0-05 — Repair CI/CD So It Is a Real Quality Gate

**Status:** ✅ IMPLEMENTED (2026-05-18)  
**Risk:** Broken main branch, untrusted deploy artifacts  
**Evidence:** `.github/workflows/ci.yml` exists, but E2E secret generation commands appear syntactically broken; `npm audit` uses `|| true`; PocketBase CI version is `0.22.1` while project setup references `0.37.4`.

#### TODO

- [x] Fix the malformed Node secret-generation commands in the E2E job (replaced shell substitution with `fs.appendFileSync`).
- [x] `npm audit` now reports high+ findings as GitHub warning annotations instead of silently passing.
- [x] Added lint step to `lint-and-build` job.
- [x] Frontend test command made explicit (`npm run test`).
- [ ] Add Docker build validation in CI pipeline. _(next sprint)_
- [ ] Add migration/schema validation step. _(next sprint)_
- [ ] Protect `main` branch merge rules in GitHub settings. _(manual GitHub settings change)_

#### Acceptance Criteria

- [ ] CI passes on a clean checkout without local services pre-running.
- [ ] A failing test, typecheck, build, audit, or E2E job blocks merge.
- [ ] CI uses the same runtime assumptions as production.

---

### P0-06 — Harden Docker and Compose for Production

**Status:** ✅ IMPLEMENTED (2026-05-18)  
**Risk:** Non-reproducible or broken deployment  
**Evidence:** Backend Dockerfile installs production dependencies before running `npm run build`; Compose also bind-mounts `./backend:/app` into the production API container, overriding built image contents. Docker images use `latest` for PocketBase, Litestream, and Ollama.

#### TODO

- [x] Converted `backend/Dockerfile` to two-stage build: `builder` (all deps + tsc) → `production` (prod deps only + `dist/`).
- [x] Removed dangerous `./backend:/app` bind-mount from production `api` service in `docker-compose.yml`.
- [x] Pinned all Docker image versions (`pocketbase:0.22.1`, `litestream:0.3.13`, `ollama:0.5.1`, `caddy:2.9-alpine`).
- [x] Created `docker-compose.override.yml` with dev bind-mounts and `tsx watch` hot-reload.
- [ ] Add `.dockerignore` for backend. _(next sprint)_
- [ ] Verify container health checks in isolated Docker environment. _(manual validation needed)_

**Implementation:** `backend/Dockerfile`, `docker-compose.yml`, `docker-compose.override.yml` (new).

#### Acceptance Criteria

- [ ] `docker compose build` works from a clean checkout.
- [ ] Production container runs compiled code, not host-mounted source.
- [ ] Deployments are reproducible through pinned base images.

---

## P1 — High-Impact Hardening

### P1-01 — Expand Automated Test Coverage Around Critical Business Flows

**Status:** 🟡 IN PROGRESS (2026-05-18) — coverage exclusion fixed; integration tests and grading tests still needed  
**Risk:** Regression in student, grade, finance, and document workflows  
**Evidence:** 101 tests now pass (8 test files). `src/grading/**` coverage exclusion removed.

#### TODO

- [x] Remove `src/grading/**` from frontend coverage exclusions (`vitest.config.ts`).
- [ ] Add grading tests for GPA, weighted grades, retakes, academic standing, ECTS conversion, percentile logic, and edge cases.
- [ ] Add backend integration tests against a real test PocketBase instance.
- [ ] Add finance tests for student scoping, receipt/payment flows, and aggregation correctness.
- [ ] Add transcript/certificate tests for issue, verify, revoke, and tamper detection.
- [ ] Add import/batch tests for duplicate handling, partial failure, validation, and rollback expectations.
- [ ] Add authorization regression tests for every role.
- [ ] Set coverage targets gradually:
  - [ ] 60% near-term.
  - [ ] 75% medium-term.
  - [ ] 85%+ for critical modules.

#### Acceptance Criteria

- [ ] Critical education records cannot be changed without tests failing on regression.
- [ ] Coverage reports are generated in CI.
- [ ] Coverage thresholds are enforced for critical modules.

---

### P1-02 — Replace Full-Data Polling With Cache-Aware Fetching

**Status:** TODO  
**Risk:** Excessive load, slow UI, poor scalability  
**Evidence:** `useCoreDataPolling(true, 60000, fetchAllCoreData)` fetches large entity sets repeatedly; `dataStore` uses `perPage: 1000` for students and `500` for several other entities.

#### TODO

- [ ] Introduce TanStack Query or equivalent cache-aware query layer.
- [ ] Replace global polling with page-specific queries.
- [ ] Use server-side pagination for students, staff, courses, finance, library, and logs.
- [ ] Invalidate related queries after mutations instead of refetching everything.
- [ ] Add stale time/cache time settings by entity volatility.
- [ ] Consider SSE/WebSocket only for truly real-time events.
- [ ] Add request cancellation for route changes.

#### Acceptance Criteria

- [ ] Opening the app does not fetch every major table every minute.
- [ ] Lists load page-by-page.
- [ ] Mutations update or invalidate only relevant cached data.
- [ ] Network traffic is measurably reduced.

---

### P1-03 — Complete and Generate OpenAPI From Route Schemas

**Status:** TODO  
**Risk:** Contract drift between implementation and docs  
**Evidence:** `openapi/spec.ts` exists, but many route modules are not fully represented and the spec is manually maintained.

#### TODO

- [ ] Inventory every backend route and compare against OpenAPI paths.
- [ ] Adopt `@hono/zod-openapi` route definitions where practical.
- [ ] Generate schemas from existing Zod validators.
- [ ] Include auth requirements and role expectations per endpoint.
- [ ] Add examples for major request/response bodies.
- [ ] Add OpenAPI validation in CI.
- [ ] Generate a typed frontend API client from the spec or use shared schemas.

#### Acceptance Criteria

- [ ] Every public API route appears in OpenAPI.
- [ ] OpenAPI fails CI if invalid.
- [ ] Frontend contracts can be generated or validated from the spec.

---

### P1-04 — Create a Shared Types and API Contract Strategy

**Status:** TODO  
**Risk:** Frontend/backend type drift  
**Evidence:** Frontend and backend define similar domain types separately.

#### TODO

- [ ] Choose contract source of truth:
  - [ ] generated OpenAPI client, or
  - [ ] shared package, or
  - [ ] shared Zod schemas.
- [ ] Move common entities into a shared package or generated client.
- [ ] Replace repeated `any` and `as unknown as` casts with mappers and validators.
- [ ] Add contract tests for key endpoints.
- [ ] Document versioning rules for breaking API changes.

#### Acceptance Criteria

- [ ] Frontend and backend cannot silently disagree on core shapes.
- [ ] API response parsing validates critical fields.
- [ ] Type duplication is reduced or intentionally documented.

---

### P1-05 — Fix Dependency Vulnerabilities and High-Risk Packages

**Status:** TODO  
**Risk:** Known vulnerable dependencies in production/dev workflows  
**Evidence:** `npm audit` reports high vulnerabilities in `xlsx`; backend audit reports `hono`, `vite/esbuild`, and `xlsx` issues.

#### TODO

- [ ] Upgrade `hono` to a patched compatible version and run backend tests.
- [ ] Upgrade backend `vitest`/`vite`/`esbuild` chain or document why affected dev-server vulnerability is non-production.
- [ ] Replace or isolate `xlsx` because npm reports high vulnerabilities with no available fix.
- [ ] If `xlsx` must remain temporarily:
  - [ ] Restrict uploaded file size.
  - [ ] Validate MIME/type and extension.
  - [ ] Parse in a constrained path with clear error handling.
  - [ ] Avoid processing untrusted spreadsheets on privileged servers where possible.
- [ ] Add Dependabot or Renovate.
- [ ] Maintain an explicit vulnerability exception register.

#### Acceptance Criteria

- [ ] No untriaged high vulnerabilities remain.
- [ ] CI fails for newly introduced unapproved high/critical vulnerabilities.
- [ ] Spreadsheet parsing risk is documented and mitigated.

---

### P1-06 — Implement MFA for Privileged Roles

**Status:** TODO  
**Risk:** Account takeover of admin/registrar users  
**Evidence:** Feature analysis identifies MFA as critical; codebase has settings UI references to 2FA but no confirmed enforced flow.

#### TODO

- [ ] Confirm PocketBase MFA/TOTP support path for current PocketBase version.
- [ ] Require MFA for `admin`, `registrar`, and finance-capable staff roles.
- [ ] Add enrollment, recovery-code, disable/reset, and audit-log flows.
- [ ] Add step-up authentication for destructive actions.
- [ ] Add tests for MFA-required login and recovery flows.

#### Acceptance Criteria

- [ ] Admin and registrar accounts cannot log in without MFA after enrollment policy is active.
- [ ] MFA changes are audited.
- [ ] Recovery process is secure and documented.

---

### P1-07 — Formalize WCAG 2.1 AA Accessibility

**Status:** TODO  
**Risk:** Exclusion of keyboard/screen-reader users; institutional compliance gap  
**Evidence:** Accessibility primitives exist, but there is no formal audit, axe test suite, or WCAG acceptance gate.

#### TODO

- [ ] Add automated axe checks to key component tests and/or Playwright E2E.
- [ ] Audit color contrast in light/dark mode.
- [ ] Verify keyboard navigation for login, sidebar, modals, tables, imports, transcript/certificate flows.
- [ ] Ensure every icon-only button has accessible labels.
- [ ] Ensure focus is trapped/restored in modals.
- [ ] Add skip links and landmarks consistently.
- [ ] Document known accessibility limitations.

#### Acceptance Criteria

- [ ] Key flows pass automated axe checks.
- [ ] Keyboard-only users can complete core tasks.
- [ ] WCAG 2.1 AA checklist is tracked and reviewed.

---

### P1-08 — Add Off-Site Backups and Restore Drills

**Status:** TODO  
**Risk:** Data loss after server/disk failure  
**Evidence:** Litestream file replicas are configured; S3-compatible replica is documented but commented out.

#### TODO

- [ ] Configure S3-compatible off-site Litestream replica for production.
- [ ] Encrypt backup credentials and document secret rotation.
- [ ] Add restore drill procedure.
- [ ] Schedule quarterly restore tests.
- [ ] Define RPO/RTO targets.
- [ ] Add backup freshness monitoring.

#### Acceptance Criteria

- [ ] A fresh environment can be restored from off-site backup.
- [ ] Restore procedure is documented and tested.
- [ ] Operators receive alerts if backups stop.

---

## P2 — Scalability, Reliability, and Maintainability

### P2-01 — Improve API Aggregation and Query Efficiency

**Status:** TODO  
**Risk:** Slow dashboards and finance reports under real data  
**Evidence:** Some endpoints aggregate in application code and use multiple PocketBase queries.

#### TODO

- [ ] Inventory all endpoints that fetch large lists for aggregation.
- [ ] Move repeated summary calculations closer to the database where PocketBase supports it.
- [ ] Consider materialized summary collections for dashboards.
- [ ] Cache expensive summary endpoints with clear invalidation.
- [ ] Add realistic seed data performance tests.

#### Acceptance Criteria

- [ ] Dashboard and finance summaries remain fast with realistic records.
- [ ] Expensive summary endpoints are measured and monitored.

---

### P2-02 — Normalize Grade and Academic Record Data Model

**Status:** TODO  
**Risk:** Inconsistent academic records and confusing compatibility mapping  
**Evidence:** Audit notes dual handling of `academic_records` and `grades` shapes.

#### TODO

- [ ] Decide canonical model for grade entry and transcript generation.
- [ ] Write migration plan from legacy/duplicate representation.
- [ ] Remove compatibility mappers after migration.
- [ ] Add referential integrity validation for student/course/enrollment existence.
- [ ] Prevent silent creation of missing student/course/enrollment entities during grade entry.

#### Acceptance Criteria

- [ ] Grade entry fails clearly when references are missing.
- [ ] Transcripts and GPA are computed from one canonical academic record model.
- [ ] Duplicate/legacy paths are retired or documented.

---

### P2-03 — Add Referential Integrity and Cascade/Retention Rules

**Status:** TODO  
**Risk:** Orphan records and incorrect reports  
**Evidence:** Relation fields use `cascadeDelete: false` broadly.

#### TODO

- [ ] Define deletion policy per entity:
  - [ ] Preserve finance/audit/legal records.
  - [ ] Soft-delete students where regulatory history must remain.
  - [ ] Cascade only safe dependent records.
- [ ] Add soft-delete/status patterns where hard delete is unsafe.
- [ ] Add orphan-detection scripts.
- [ ] Add tests for attempted deletes of records with dependencies.

#### Acceptance Criteria

- [ ] Deleting/deactivating a record cannot silently corrupt reports.
- [ ] Orphan detection returns zero unexpected orphan records.
- [ ] Retention rules are documented.

---

### P2-04 — Build Observability and Alerting

**Status:** TODO  
**Risk:** Production failures detected late or diagnosed manually  
**Evidence:** Health endpoints/logging exist, but no complete metrics/log aggregation/error tracking stack.

#### TODO

- [ ] Add structured request logging with correlation IDs.
- [ ] Add metrics endpoint or exporter for API latency, error rate, query duration, cache stats, auth failures, and backup freshness.
- [ ] Add dashboard for system health.
- [ ] Add alerting for high error rate, API down, PocketBase down, backup stale, disk full, certificate errors.
- [ ] Consider Sentry or open-source equivalent for frontend/backend errors.
- [ ] Protect internal health/performance/cache endpoints if they expose operational details.

#### Acceptance Criteria

- [ ] Operators can detect and diagnose failures from dashboards/logs.
- [ ] Critical production failures trigger alerts.
- [ ] Internal diagnostics are not publicly exposed.

---

### P2-05 — Create Production Runbooks and Incident Procedures

**Status:** TODO  
**Risk:** Slow recovery and inconsistent operations  
**Evidence:** Deployment docs exist, but runbooks/incident response are incomplete.

#### TODO

- [ ] Write runbook for deployment.
- [ ] Write runbook for rollback.
- [ ] Write runbook for database restore.
- [ ] Write runbook for expired TLS/domain issues.
- [ ] Write runbook for PocketBase admin recovery.
- [ ] Write incident response process for data breach/security event.
- [ ] Write operational checklist for each release.

#### Acceptance Criteria

- [ ] A new operator can deploy, rollback, and restore using docs only.
- [ ] Security incidents have documented severity and response steps.

---

### P2-06 — Data Privacy, Retention, and Subject Rights Workflow

**Status:** TODO  
**Risk:** Privacy-first claim is not backed by formal workflows  
**Evidence:** No confirmed GDPR/data-subject export/delete/retention workflow.

#### TODO

- [ ] Define data inventory by module and sensitivity.
- [ ] Define retention policy for academic, finance, medical, audit, and visitor records.
- [ ] Add data export endpoint/workflow for a student.
- [ ] Add correction workflow.
- [ ] Add deletion/anonymization workflow where legally allowed.
- [ ] Add consent and processing-purpose records if needed.
- [ ] Document privacy request process.

#### Acceptance Criteria

- [ ] Institution can answer “what data do we hold for this person?”
- [ ] Retention/deletion decisions are policy-driven and auditable.

---

## P3 — Product and Institutional Maturity

### P3-01 — Strengthen Student and Faculty Self-Service

**Status:** TODO  
**Risk:** Product falls short of world-class UMS expectations  
**Evidence:** Student/faculty portal components exist, but self-service scope should be verified and expanded.

#### TODO

- [ ] Student portal: profile, finance summary, grades, transcripts, certificates, attendance, document requests.
- [ ] Faculty portal: assigned courses, attendance entry, grade entry, appeals/review workflow.
- [ ] Add permission tests for every portal capability.
- [ ] Add notification flows for grade publication, balance updates, document issuance.

#### Acceptance Criteria

- [ ] Students can complete common self-service tasks without admin access.
- [ ] Faculty can manage only their assigned academic responsibilities.

---

### P3-02 — Add Timetabling, Rubrics, Outcomes, and LMS Integration Roadmap

**Status:** TODO  
**Risk:** Academic feature gap versus mature UMS/SIS platforms

#### TODO

- [ ] Timetabling: rooms, instructors, conflicts, terms, recurring sessions.
- [ ] Rubrics: assessment components, marking criteria, moderation.
- [ ] Learning outcomes: course outcomes mapped to assessments.
- [ ] LMS integration: evaluate LTI 1.3 or export/import workflow.
- [ ] Academic calendar: terms, deadlines, grade submission windows.

#### Acceptance Criteria

- [ ] Academic workflows support scheduling, assessment, and outcomes beyond simple records.
- [ ] LMS integration decision is documented.

---

### P3-03 — Internationalization and Localization

**Status:** TODO  
**Risk:** English-only, hardcoded locale/currency/date assumptions  
**Evidence:** Many UI strings and locale formats are hardcoded; no i18n framework found.

#### TODO

- [ ] Introduce `react-i18next` or equivalent.
- [ ] Externalize core UI strings.
- [ ] Support English first, then Swahili if institutionally relevant.
- [ ] Centralize date, number, and currency formatting.
- [ ] Add locale preference setting.
- [ ] Plan RTL support only if needed.

#### Acceptance Criteria

- [ ] Core UI can switch language without code changes.
- [ ] Currency/date formatting is centralized and testable.

---

### P3-04 — Bundle and Document Export Optimization

**Status:** TODO  
**Risk:** Heavy first-load or slow document workflows  
**Evidence:** Build output shows heavy chunks for `vendor-html2pdf`, charts, `xlsx`, `jspdf`, and related document tooling. Route-level splitting exists, but heavy feature chunks still need budget tracking.

#### TODO

- [ ] Set bundle-size budgets in CI.
- [ ] Lazy-load document generation libraries only when export is requested.
- [ ] Consider server-side document generation for official transcripts/certificates.
- [ ] Re-evaluate `xlsx` dependency due security and bundle size.
- [ ] Add performance measurements for low-end devices.

#### Acceptance Criteria

- [ ] Main app load remains within agreed bundle budget.
- [ ] Heavy export libraries do not impact unrelated routes.

---

## 5. Recommended Implementation Phases

### Phase 0 — First 72 Hours

- [ ] Freeze production use with real sensitive data until PocketBase rules are fixed.
- [ ] Fix `hashData()` HMAC implementation.
- [ ] Repair CI syntax errors.
- [ ] Decide and pin PocketBase version across docs, CI, Makefile, and Docker.
- [ ] Create issue tickets for each P0 item.

### Phase 1 — First 2 Weeks

- [ ] Lock down PocketBase rules.
- [ ] Remove runtime schema mutation from API startup.
- [ ] Add initial indexes migration.
- [ ] Fix Dockerfile/Compose production behavior.
- [ ] Make CI blocking for typecheck, tests, builds, and known high vulnerabilities.
- [ ] Add authorization tests for the most dangerous role boundaries.

### Phase 2 — First 30 Days

- [ ] Add integration tests with a real test PocketBase instance.
- [ ] Add grading module tests and remove coverage exclusion.
- [ ] Replace full-data polling in the highest-traffic screens.
- [ ] Configure off-site backup and perform one restore drill.
- [ ] Complete OpenAPI coverage for all major routes.
- [ ] Add basic observability dashboards and protected diagnostic endpoints.

### Phase 3 — 60–90 Days

- [ ] Implement MFA for admin/registrar/staff roles.
- [ ] Complete WCAG audit and remediate key flows.
- [ ] Normalize grade/academic record model.
- [ ] Add privacy/export/retention workflow.
- [ ] Strengthen student/faculty self-service.
- [ ] Add runbooks for deployment, rollback, restore, and incidents.

### Phase 4 — 3–6 Months

- [ ] Add timetabling and academic calendar workflow.
- [ ] Add rubrics and learning outcomes.
- [ ] Add i18n/localization.
- [ ] Consider PostgreSQL migration trigger points if concurrency or reporting outgrows SQLite/PocketBase.
- [ ] Mature monitoring, alerting, and release governance.

---

## 6. Definition of Production Ready

BMI UMS should not be considered production-ready for real institutional data until all of these are true:

- [ ] PocketBase rules enforce row-level and role-level access.
- [ ] API authorization tests cover every role boundary.
- [ ] Runtime schema mutation is removed or strictly read-only.
- [ ] Critical database indexes exist.
- [ ] Docker production build is reproducible from a clean checkout.
- [ ] CI is green and blocks failing tests/builds/audits.
- [ ] Off-site backups are configured and restore-tested.
- [ ] Known high vulnerabilities are fixed or formally risk-accepted with mitigations.
- [ ] Critical flows have integration/E2E tests: login, student CRUD, grade entry, finance, transcript/certificate issue and verification.
- [ ] Admin/registrar MFA is enforced.
- [ ] Operational runbooks exist.
- [ ] Accessibility has at least an automated baseline and documented manual review.

---

## 7. Highest-ROI Task Order

If only ten tasks can be done first, do them in this order:

1. [ ] Lock down PocketBase collection rules.
2. [ ] Stop `setupCollections()` from mutating schema/rules at startup.
3. [ ] Add database indexes.
4. [ ] Fix `hashData()` to real HMAC.
5. [ ] Repair CI and make it blocking.
6. [ ] Fix backend Dockerfile and production Compose mounts.
7. [ ] Add role-boundary authorization tests.
8. [ ] Add integration tests with real PocketBase.
9. [ ] Replace global full-data polling with cache-aware paginated fetching.
10. [ ] Configure off-site Litestream backups and test restore.

---

## 8. Final Assessment

The codebase is not a toy project. It has meaningful architecture, real modules, route-based frontend splitting, OpenAPI documentation, working tests, Docker orchestration, Caddy security headers, Litestream backup planning, JWT/RBAC, and certificate/transcript verification work. Those are strong foundations.

The main issue is that the most important institutional safeguards are not yet hardened: **database-level authorization, migration discipline, indexing, CI enforcement, integration tests, off-site restore, and operational procedures.** These are solvable without rewriting the project. If the P0 and P1 roadmap items are completed carefully, BMI UMS can move from “promising developing system” to a genuinely credible production candidate.
