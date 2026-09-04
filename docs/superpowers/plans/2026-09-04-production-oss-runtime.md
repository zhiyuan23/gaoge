# Gaoge Production OSS Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make new `gaoge` admin-avatar uploads use the personal `gaoge-assets` OSS bucket through `gaoge/admin-avatar/`, persist the production configuration across releases, and add the confirmed safe OSS lifecycle policy without migrating existing local images.

**Architecture:** Keep the existing application storage implementation. Add an optional release-local `.env.oss` file whose contents are allowlisted to the six `ALIYUN_OSS_*` variables by the PM2 ecosystem file; the deployment workflow links this file to `/var/www/gaoge/api/shared/oss.env`, which remains server-managed and is not overwritten by `DEPLOY_ENV_FILE_API`. The shared Bucket lifecycle is configured separately in Alibaba Cloud with exact prefix `gaoge/admin-avatar/`.

**Tech Stack:** Node.js 22, PM2, GitHub Actions, Alibaba Cloud OSS, Node built-in test runner.

## Execution Status (2026-09-04)

- Repository implementation is complete on local isolated branch `codex/oss-production`; focused tests, 248 API tests, typecheck, build, Prettier, ESLint, and `git diff --check` passed.
- A mode-`0600` server-only `oss.env` was created from the existing personal-account credential without displaying its values. The unique test-object PUT to `gaoge/admin-avatar/` was rejected with OSS `AccessDenied 403`, before any object was created.
- Per the confirmed fail-closed boundary, the new server file was removed, the commit was not pushed or deployed, and Bucket versioning/lifecycle were not changed. Resume only after an authorized credential can write and delete the exact target prefix; do not change RAM or AccessKeys under this plan.

## Global Constraints

- Modify only `gaoge` and `gaoge-compass`; never modify `gaoge-finance-news`, `gaoge-club`, other projects, or the `lncjzx` Alibaba Cloud account.
- Never print or commit AccessKey ID, AccessKey Secret, tokens, database URLs, JWT secrets, or complete environment files.
- Existing local image URLs are not migrated or deleted.
- Current OSS object versions never expire or transition storage class.
- Noncurrent versions expire permanently after 30 days; expired sole delete markers are removed; multipart uploads are aborted after 7 days; access tracking stays off.
- Bucket ACL, policy, CORS, CDN, transfer acceleration, RAM and AccessKey configuration remain unchanged.
- The Bucket remains private; each new avatar PUT sets object-level `public-read` so the existing public HTTPS URL contract still works without a Bucket-level permission change.

---

### Task 1: Load an allowlisted server-managed OSS environment

**Files:**

- Modify: `scripts/verify-production-runtime-guard.test.mjs`
- Modify: `apps/api/ecosystem.config.cjs`

**Interfaces:**

- Consumes: `.env` for the existing runtime and optional `.env.oss` for OSS-only values.
- Produces: PM2 `env` containing the base runtime plus only `ALIYUN_OSS_REGION`, `ALIYUN_OSS_BUCKET`, `ALIYUN_OSS_ACCESS_KEY_ID`, `ALIYUN_OSS_ACCESS_KEY_SECRET`, `ALIYUN_OSS_PUBLIC_BASE_URL`, and `ALIYUN_OSS_PREFIX` from `.env.oss`.

- [ ] **Step 1: Extend the existing ecosystem test**

Create `.env.oss` in the test fixture with all six OSS variables plus an attempted `DATABASE_URL` override. Assert that the OSS variables are loaded and the database URL still comes from `.env`.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test scripts/verify-production-runtime-guard.test.mjs`

Expected: the ecosystem runtime test fails because `.env.oss` is not read.

- [ ] **Step 3: Implement the minimal allowlisted merge**

Refactor the ecosystem file to parse optional env files and copy only the six named OSS keys from `.env.oss` into `runtimeEnv`; keep `.env` authoritative for all non-OSS values.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `node --test scripts/verify-production-runtime-guard.test.mjs`

Expected: 7 tests pass with zero failures.

### Task 2: Persist the OSS environment link across API releases

**Files:**

- Modify: `scripts/verify-production-runtime-guard.test.mjs`
- Modify: `.github/workflows/deploy-api.yml`
- Modify: `docs/conventions/env-and-config.md`

**Interfaces:**

- Consumes: `/var/www/gaoge/api/shared/oss.env` with mode `0600`.
- Produces: each API release has `.env.oss -> /var/www/gaoge/api/shared/oss.env`; a missing file remains a safe local-storage fallback.

- [ ] **Step 1: Add a failing workflow assertion**

Assert that the API deployment creates the `.env.oss` symlink from the shared `oss.env` path and does not upload or print that file.

- [ ] **Step 2: Run the deployment test and verify RED**

Run: `node --test scripts/verify-production-runtime-guard.test.mjs`

Expected: failure on the missing `.env.oss` link.

- [ ] **Step 3: Add the release symlink and document ownership**

Add one `ln -sfn` beside the existing `.env` link and document that `shared/oss.env` is server-managed, OSS-only, mode `0600`, and never committed or logged.

- [ ] **Step 4: Run focused verification**

Run: `node --test scripts/verify-production-runtime-guard.test.mjs`

Expected: all tests pass.

### Task 3: Publish and activate Gaoge OSS

**Files:**

- Server-only: `/var/www/gaoge/api/shared/oss.env`
- Cloud-only: `gaoge-assets` versioning and lifecycle rule `gaoge-media-safe-cleanup-30d`

**Interfaces:**

- Consumes: the existing personal-account OSS credential from the server without displaying it.
- Produces: new application uploads at `gaoge/admin-avatar/<userId>/...` and lifecycle protection for exactly `gaoge/admin-avatar/`.

- [ ] **Step 1: Run repository verification**

Run: `node --test scripts/verify-production-runtime-guard.test.mjs && pnpm --filter @gaoge/app-api test -- --runInBand && pnpm --filter @gaoge/app-api typecheck && pnpm --filter @gaoge/app-api build && git diff --check`

Expected: all commands pass.

- [ ] **Step 2: Commit and publish only the OSS files**

Commit the plan, ecosystem, workflow, test, and environment documentation on `codex/oss-production`; push only that feature branch/commit, without including local-main-only work.

- [ ] **Step 3: Create and smoke-test the server OSS file**

Atomically create `shared/oss.env` with mode `0600`, copy only the existing credential lines server-side, set the Beijing bucket values and prefix `gaoge`, upload/read/delete one unique pre-versioning test object, and verify it no longer exists.

- [ ] **Step 4: Activate and verify production**

Deploy the feature revision, confirm `gaoge-api` is online, and verify `https://api.gaoge.cc/health` plus `/health/db` return success without logging environment values.

- [ ] **Step 5: Configure the shared Bucket after both apps pass**

Enable Bucket versioning once, then create enabled rule `gaoge-media-safe-cleanup-30d` for `gaoge/admin-avatar/` with no current expiration or transitions, noncurrent expiration 30 days, expired delete-marker removal, multipart abort 7 days, and access tracking off.

- [ ] **Step 6: Verify and record delayed checks**

Reopen the rule details, verify an existing current image still returns HTTP 200, and record 2026-09-05/06 loading checks plus the first eligible 30-day cleanup review on or after 2026-10-04.
