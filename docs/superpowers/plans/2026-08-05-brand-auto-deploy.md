# Brand Auto Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an independent GitHub Actions workflow that verifies and deploys `apps/brand` to the production Brand site.

**Architecture:** Follow the existing Sports static-site release pattern with a Brand-specific workflow, trigger paths, package filter, deployment secrets, release directory, symlink switch, and health check. Keep Brand and Sports deployment boundaries independent.

**Tech Stack:** GitHub Actions, pnpm, Turbo, Vite, SSH, rsync

## Global Constraints

- The workflow listens to `main` pushes affecting Brand or its actual shared dependencies and supports manual dispatch.
- Use `@gaoge/app-brand` for test, typecheck, and build commands.
- Prefer `BRAND_DEPLOY_HOST` and `BRAND_DEPLOY_USER`; fall back to the existing verified `WEB_DEPLOY_HOST` and `WEB_DEPLOY_USER` only while Brand-specific connection secrets are absent.
- Use `BRAND_DEPLOY_PATH=/var/www/gaoge/brand` and `BRAND_HEALTH_URL=https://gaoge.cc` for the independent Brand release and health-check target.
- Reuse the repository-wide `SSH_PRIVATE_KEY` secret.
- Missing Brand deployment secrets skip deployment after verification instead of failing unrelated CI.
- Do not modify Sports, Admin, or API deployment behavior.

---

### Task 1: Add the Brand production deployment workflow

**Files:**

- Create: `.github/workflows/deploy-brand.yml`

**Interfaces:**

- Consumes: `@gaoge/app-brand` scripts and GitHub repository secrets.
- Produces: a Brand-only verification and production deployment workflow.

- [x] **Step 1: Create the workflow**

  Add a workflow patterned after `.github/workflows/deploy-sports.yml`, replacing Sports paths, package filters, names, concurrency group, output directory, and secrets with their Brand equivalents.

- [x] **Step 2: Validate formatting and workflow content**

  Run:

  ```bash
  pnpm exec prettier --check .github/workflows/deploy-brand.yml
  rg -n "app-sports|SPORTS_|apps/sports" .github/workflows/deploy-brand.yml
  ```

  Expected: Prettier passes and the search returns no Sports references.

- [x] **Step 3: Verify the Brand application commands used by CI**

  Run:

  ```bash
  pnpm --filter @gaoge/app-brand test
  pnpm --filter @gaoge/app-brand typecheck
  pnpm --filter @gaoge/app-brand build
  ```

  Expected: all commands exit successfully and `apps/brand/dist` is produced.

- [x] **Step 4: Review the final diff**

  Run:

  ```bash
  git diff --check
  git diff --no-index -- /dev/null .github/workflows/deploy-brand.yml
  git diff --no-index -- /dev/null docs/superpowers/plans/2026-08-05-brand-auto-deploy.md
  ```

  Expected: no whitespace errors; each `--no-index` command prints the full new file and exits with status 1 because it compares a new file with `/dev/null`; the workflow matches the approved Brand deployment design.

### Task 2: Configure the Brand root-domain cutover

**Files:**

- Modify: `.github/workflows/deploy-brand.yml`
- Create: `.github/workflows/ops-brand-domain.yml`

**Interfaces:**

- Consumes: existing `WEB_DEPLOY_HOST`, `WEB_DEPLOY_USER`, and `SSH_PRIVATE_KEY`; Brand deployment path and health secrets.
- Produces: a one-time, manually invoked Nginx cutover that serves `gaoge.cc` and redirects `www.gaoge.cc` to the Brand release.

- [x] **Step 1: Make the Brand deploy connection backward compatible**

  Resolve `DEPLOY_HOST` and `DEPLOY_USER` from the Brand-specific secret when present, otherwise from the established `WEB_*` connection secrets. Keep the release path and health URL Brand-specific.

- [x] **Step 2: Add the guarded Brand domain workflow**

  Create `ops-brand-domain.yml` with `inspect` and `apply` modes. The `apply` mode must require `$BRAND_DEPLOY_PATH/current`, write a timestamped backup of the current `gaoge.cc` Nginx site file, replace only that site with the Brand configuration, validate Nginx before reload, and restore the backup if validation or reload fails.

- [x] **Step 3: Set the non-secret Brand runtime values in GitHub Actions**

  Set `BRAND_DEPLOY_PATH` to `/var/www/gaoge/brand` and `BRAND_HEALTH_URL` to `https://gaoge.cc`. Do not reveal or recreate the existing Web connection secret values.

- [x] **Step 4: Publish, deploy, cut over, and verify**

  Commit and push the workflow changes, wait for the Brand deployment workflow to succeed, run the Brand domain workflow in `apply` mode, then confirm `https://gaoge.cc/` returns Brand HTML and `https://www.gaoge.cc/` returns a permanent redirect to it.
