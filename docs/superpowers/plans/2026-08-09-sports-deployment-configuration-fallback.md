# Sports Deployment Configuration Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore automatic Sports production deployment by reusing the configured Web deployment Secrets while preserving optional Sports-specific overrides.

**Architecture:** Keep the current release-directory and symlink deployment flow unchanged. Resolve each deployment value from `SPORTS_*` first and `WEB_*` second, then fail at the configuration gate if the resolved value is empty so a skipped deployment cannot report success. Store Vite's hashed build resources under `static/` so the physical build directory does not shadow the Vue route `/assets` in Nginx.

**Tech Stack:** GitHub Actions YAML, Bash, pnpm, Vite/Vue, GitHub CLI

## Global Constraints

- Do not change Sports application or Vue Router behavior.
- Do not migrate server directories, modify Nginx, or issue certificates.
- Preserve `SPORTS_*` as the preferred future configuration and use `WEB_*` only as fallback.
- Vite build resources must not use the physical directory name `assets` because `/assets` is a Sports page route.
- Do not touch the unrelated untracked `.workbuddy/` directory.

---

### Task 1: Repair the Sports deployment configuration gate

**Files:**

- Modify: `.github/workflows/deploy-sports.yml:68`

**Interfaces:**

- Consumes: repository Actions Secrets named `SPORTS_DEPLOY_*`, `SPORTS_HEALTH_URL`, `WEB_DEPLOY_*`, and `WEB_HEALTH_URL`.
- Produces: resolved `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, and `HEALTH_URL` environment variables for the existing SSH, rsync, symlink, and health-check steps.

- [ ] **Step 1: Update deployment environment resolution**

```yaml
env:
  DEPLOY_HOST: ${{ secrets.SPORTS_DEPLOY_HOST || secrets.WEB_DEPLOY_HOST }}
  DEPLOY_USER: ${{ secrets.SPORTS_DEPLOY_USER || secrets.WEB_DEPLOY_USER }}
  DEPLOY_PATH: ${{ secrets.SPORTS_DEPLOY_PATH || secrets.WEB_DEPLOY_PATH }}
  HEALTH_URL: ${{ secrets.SPORTS_HEALTH_URL || secrets.WEB_HEALTH_URL }}
```

- [ ] **Step 2: Replace successful skip behavior with a failing configuration assertion**

```yaml
- name: 检查 Sports 部署配置
  run: |
    : "${DEPLOY_HOST:?SPORTS_DEPLOY_HOST or WEB_DEPLOY_HOST is required}"
    : "${DEPLOY_USER:?SPORTS_DEPLOY_USER or WEB_DEPLOY_USER is required}"
    : "${DEPLOY_PATH:?SPORTS_DEPLOY_PATH or WEB_DEPLOY_PATH is required}"
    : "${HEALTH_URL:?SPORTS_HEALTH_URL or WEB_HEALTH_URL is required}"
```

- [ ] **Step 3: Remove all `steps.deploy-config.outputs.ready` conditions**

After the assertion succeeds, every existing deploy step runs normally. No upload, switch, or health-check step can silently skip because of missing configuration.

- [ ] **Step 4: Validate the workflow diff**

Run:

```bash
git diff --check
rg -n "SPORTS_DEPLOY_HOST.*WEB_DEPLOY_HOST|SPORTS_DEPLOY_USER.*WEB_DEPLOY_USER|SPORTS_DEPLOY_PATH.*WEB_DEPLOY_PATH|SPORTS_HEALTH_URL.*WEB_HEALTH_URL" .github/workflows/deploy-sports.yml
rg -n "deploy-config.outputs.ready|ready=false|skipping Sports deployment" .github/workflows/deploy-sports.yml
```

Expected: the first two commands succeed with all four fallback mappings; the final `rg` returns exit code 1 because no silent-skip logic remains.

### Task 2: Verify and publish the repair

**Files:**

- Verify: `.github/workflows/deploy-sports.yml`
- Verify: `apps/sports/**`

**Interfaces:**

- Consumes: the repaired workflow and current `main` Sports source.
- Produces: a successful production release whose GitHub Actions deploy job executes every deployment step.

- [ ] **Step 1: Run Sports verification**

```bash
pnpm --filter @gaoge/app-sports test
pnpm --filter @gaoge/app-sports typecheck
pnpm --filter @gaoge/app-sports build
```

Expected: 25 Sports tests pass, TypeScript exits zero, and Vite creates `apps/sports/dist`.

- [ ] **Step 2: Commit the workflow and plan**

```bash
git add .github/workflows/deploy-sports.yml docs/superpowers/plans/2026-08-09-sports-deployment-configuration-fallback.md
git commit -m "fix: restore sports production deployment"
```

- [ ] **Step 3: Push `main` and monitor the triggered workflow**

```bash
git push origin main
gh run list --workflow deploy-sports.yml --limit 1
gh run watch <run-id> --exit-status
gh run view <run-id> --json jobs
```

Expected: the upload, current-version switch, and health-check steps all conclude `success`; none concludes `skipped`.

- [ ] **Step 4: Verify the production routes and deployed bundle**

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' https://sports.gaoge.cc/
curl -fsS -o /dev/null -w '%{http_code}\n' https://sports.gaoge.cc/hero
curl -fsS -o /dev/null -w '%{http_code}\n' https://sports.gaoge.cc/assets
```

Expected: all three requests return `200`. Inspect the served hashed JavaScript bundle and confirm it contains the `/hero`, `/assets`, and `/teams` compatibility route definitions from the current source.

### Task 3: Remove the build-directory collision with `/assets`

**Files:**

- Modify: `apps/sports/vite.config.js`
- Verify: `apps/sports/dist/**`

**Interfaces:**

- Consumes: Vite's `build.assetsDir` configuration and the existing Nginx SPA fallback.
- Produces: hashed JavaScript and CSS under `/static/`, leaving `/assets` available for Vue Router.

- [ ] **Step 1: Configure a non-conflicting build resource directory**

```js
build: {
  assetsDir: 'static',
},
```

- [ ] **Step 2: Re-run Sports verification and inspect the build layout**

```bash
pnpm --filter @gaoge/app-sports test
pnpm --filter @gaoge/app-sports typecheck
pnpm --filter @gaoge/app-sports build
test -d apps/sports/dist/static
test ! -e apps/sports/dist/assets
```

Expected: all checks pass, and `dist/index.html` references `/static/` resources.

- [ ] **Step 3: Commit, push, and monitor the automatic Sports deployment**

```bash
git add apps/sports/vite.config.js docs/superpowers/specs/2026-08-09-sports-deployment-configuration-fallback-design.md docs/superpowers/plans/2026-08-09-sports-deployment-configuration-fallback.md
git commit -m "fix(sports): avoid assets route build collision"
git push origin main
gh run watch <run-id> --exit-status
```

Expected: the workflow succeeds and `rsync --delete` publishes a release containing `static/` instead of `assets/`.

- [ ] **Step 4: Re-run the three production route checks**

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' https://sports.gaoge.cc/
curl -fsS -o /dev/null -w '%{http_code}\n' https://sports.gaoge.cc/hero
curl -fsS -o /dev/null -w '%{http_code}\n' https://sports.gaoge.cc/assets
```

Expected: `/`, `/hero`, and `/assets` all return `200`, with no redirect from `/assets` to `/assets/`.
