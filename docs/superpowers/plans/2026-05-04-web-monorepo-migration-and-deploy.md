# Web Monorepo Migration And Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将平级 `gaoge-web` 迁入 `apps/web`，并在 monorepo 内补齐 `web`、`admin`、`api` 三条独立发布流水线。

**Architecture:** `apps/web` 直接承接原 Vite/Vue 前台应用，保持应用代码先稳定迁入，再通过工作区依赖和 `turbo` 脚本接入 monorepo。发布侧保持三条独立 workflow：`web` 与 `admin` 使用静态产物发布到服务器版本目录并切换软链接，`api` 保持 SSH + rsync + PM2 + Prisma migrate 的服务端发布模式，但补上应用级触发路径和应用级 secrets 命名。

**Tech Stack:** pnpm workspace, Turbo, Vue 3, Vite, Vitest, GitHub Actions, rsync, SSH, PM2, Nginx

---

### Task 1: Replace `apps/web` scaffold with the real Vite app

**Files:**

- Delete/replace: `apps/web/src/main.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/vite.config.js`
- Create: `apps/web/src/main.js`
- Create: `apps/web/src/App.vue`
- Create: `apps/web/src/router/index.js`
- Create: `apps/web/src/views/HomePage.vue`
- Create: `apps/web/src/views/TeamsPage.vue`
- Create: `apps/web/src/components/FullPageSection.vue`
- Create: `apps/web/src/content/homepage.js`
- Create: `apps/web/src/content/homepage.test.js`
- Create: `apps/web/src/data/teams.js`
- Create: `apps/web/src/App.test.js`
- Create: `apps/web/src/style.css`
- Create: `apps/web/src/tailwind.css`
- Copy: `apps/web/public/*`
- Copy: `apps/web/src/assets/**`

- [ ] **Step 1: Add a failing regression test that proves `apps/web` must build as a Vite app**

```bash
pnpm --filter @gaoge/app-web build
```

Expected: fail because current `apps/web` only runs `tsc` against `src/main.ts` and does not contain the migrated Vite app files.

- [ ] **Step 2: Replace the placeholder with the real front-end source from `/Users/snow/Documents/Gaoge/gaoge-web`**

```text
Copy these source groups into apps/web:
- index.html
- public/CNAME
- public/d277ea141d649d00ca3a4c3236e75158.txt
- public/flag.svg
- public/trophy-solid.svg
- src/App.vue
- src/main.js
- src/router/index.js
- src/views/*
- src/components/*
- src/content/*
- src/data/*
- src/assets/*
- src/style.css
- src/tailwind.css
```

Also exclude `.DS_Store`, `.git`, `.github`, `.pnpm-store`, `.superpowers`, `.claude`, `dist`, and `node_modules`.

- [ ] **Step 3: Re-run the build and confirm it still fails for the expected workspace/config reasons**

```bash
pnpm --filter @gaoge/app-web build
```

Expected: fail due to missing Vite/Vue dependencies or missing Vite build script integration, not due to missing app source.

### Task 2: Align `apps/web` package scripts and dependencies with the workspace

**Files:**

- Modify: `apps/web/package.json`
- Modify: `apps/web/tsconfig.json`
- Create: `apps/web/vitest.config.js` if needed
- Modify: `package.json` if root scripts need filtering adjustments

- [ ] **Step 1: Add a failing test for the desired package behavior**

```bash
pnpm --filter @gaoge/app-web test
```

Expected: fail because current package does not provide the Vite/Vitest dependency set or a matching test command.

- [ ] **Step 2: Update `apps/web/package.json` to use Vite/Vitest scripts**

```json
{
  "name": "@gaoge/app-web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "typecheck": "vite build",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@iconify-icons/ph": "^1.2.5",
    "@iconify/vue": "^5.0.0",
    "swiper": "^11.2.0",
    "vue": "^3.5.13",
    "vue-router": "^4.5.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.2.2",
    "@vitejs/plugin-vue": "^5.2.3",
    "@vue/test-utils": "^2.4.6",
    "jsdom": "^26.0.0",
    "sharp": "^0.34.5",
    "tailwindcss": "^4.2.2",
    "vite": "^6.2.0",
    "vitest": "^3.1.1"
  }
}
```

Use package-local dependencies so workspace install remains explicit.

- [ ] **Step 3: Relax `apps/web/tsconfig.json` so it no longer assumes a TypeScript-only entrypoint**

```json
{
  "extends": "../../packages/configs/typescript-config/web.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "noEmit": true
  },
  "include": ["src/**/*.js", "src/**/*.vue", "vite.config.js"]
}
```

This keeps `turbo run typecheck` from breaking on the JS-based migrated app while avoiding a fake TypeScript shell.

- [ ] **Step 4: Run the migrated app tests**

```bash
pnpm --filter @gaoge/app-web test
```

Expected: pass the migrated Vitest suite.

- [ ] **Step 5: Run the migrated app build**

```bash
pnpm --filter @gaoge/app-web build
```

Expected: produce `apps/web/dist`.

### Task 3: Add the server deployment workflow for `apps/web`

**Files:**

- Create: `.github/workflows/deploy-web.yml`

- [ ] **Step 1: Add a failing validation check for the missing workflow**

```bash
test -f .github/workflows/deploy-web.yml
```

Expected: fail because the workflow file does not exist yet.

- [ ] **Step 2: Create `deploy-web.yml` with application-scoped paths and release/symlink deployment**

```yaml
name: 部署 Web 到生产环境

on:
  push:
    branches: [main]
    paths:
      - 'apps/web/**'
      - 'packages/shared/**'
      - 'packages/sdk/**'
      - 'packages/ui/**'
      - 'packages/configs/**'
      - 'pnpm-lock.yaml'
      - 'pnpm-workspace.yaml'
      - 'package.json'
      - 'turbo.json'
  workflow_dispatch:

concurrency:
  group: deploy-web-production
  cancel-in-progress: true
```

Deploy job requirements:

- install workspace deps
- run `pnpm --filter @gaoge/app-web test`
- run `pnpm --filter @gaoge/app-web build`
- upload `apps/web/dist` to `${{ secrets.WEB_DEPLOY_PATH }}/releases/web/${{ github.sha }}`
- switch `${{ secrets.WEB_DEPLOY_PATH }}/current/web`
- verify `${{ secrets.WEB_HEALTH_URL }}`

- [ ] **Step 3: Verify the workflow file exists and contains the expected trigger scope**

```bash
rg -n "deploy-web-production|WEB_DEPLOY_PATH|apps/web/\\*\\*" .github/workflows/deploy-web.yml
```

Expected: matches for concurrency group, scoped secrets, and app paths.

### Task 4: Add the server deployment workflow for `apps/admin`

**Files:**

- Create: `.github/workflows/deploy-admin.yml`

- [ ] **Step 1: Add a failing validation check for the missing admin workflow**

```bash
test -f .github/workflows/deploy-admin.yml
```

Expected: fail because the workflow file does not exist yet.

- [ ] **Step 2: Create `deploy-admin.yml` following the same static-release model**

```yaml
name: 部署 Admin 到生产环境

on:
  push:
    branches: [main]
    paths:
      - 'apps/admin/**'
      - 'packages/shared/**'
      - 'packages/sdk/**'
      - 'packages/ui/**'
      - 'packages/configs/**'
      - 'pnpm-lock.yaml'
      - 'pnpm-workspace.yaml'
      - 'package.json'
      - 'turbo.json'
  workflow_dispatch:

concurrency:
  group: deploy-admin-production
  cancel-in-progress: true
```

Deploy job requirements:

- install workspace deps
- run `pnpm --filter @gaoge/app-admin typecheck`
- run `pnpm --filter @gaoge/app-admin build`
- upload `apps/admin/dist` to `${{ secrets.ADMIN_DEPLOY_PATH }}/releases/admin/${{ github.sha }}`
- switch `${{ secrets.ADMIN_DEPLOY_PATH }}/current/admin`
- verify `${{ secrets.ADMIN_HEALTH_URL }}`

- [ ] **Step 3: Verify the workflow file exists and contains the expected trigger scope**

```bash
rg -n "deploy-admin-production|ADMIN_DEPLOY_PATH|apps/admin/\\*\\*" .github/workflows/deploy-admin.yml
```

Expected: matches for concurrency group, scoped secrets, and admin paths.

### Task 5: Tighten the existing API workflow to the monorepo application boundary

**Files:**

- Modify: `.github/workflows/deploy-api.yml`

- [ ] **Step 1: Add a failing check for missing app-scoped triggers and secrets**

```bash
rg -n "paths:|API_DEPLOY_PATH|API_HEALTH_URL|API_DEPLOY_HOST|API_DEPLOY_USER" .github/workflows/deploy-api.yml
```

Expected: fail because the current workflow still uses unscoped `DEPLOY_*` and `HEALTH_URL` naming and has no `paths` filter.

- [ ] **Step 2: Update `deploy-api.yml`**

Required changes:

- add `push.paths` for:
  - `apps/api/**`
  - `packages/shared/**`
  - `packages/server/**`
  - `packages/configs/**`
  - `pnpm-lock.yaml`
  - `pnpm-workspace.yaml`
  - `package.json`
  - `turbo.json`
- rename deploy secrets usage:
  - `DEPLOY_HOST` -> `API_DEPLOY_HOST`
  - `DEPLOY_USER` -> `API_DEPLOY_USER`
  - `DEPLOY_PATH` -> `API_DEPLOY_PATH`
  - `HEALTH_URL` -> `API_HEALTH_URL`
  - `DEPLOY_ENV_FILE` -> `DEPLOY_ENV_FILE_API`
- remove unrelated `apps/admin` build steps from the API deploy flow so API deployment does not depend on admin release artifacts

- [ ] **Step 3: Verify the API workflow now reflects application isolation**

```bash
rg -n "apps/api/\\*\\*|API_DEPLOY_PATH|API_HEALTH_URL|DEPLOY_ENV_FILE_API" .github/workflows/deploy-api.yml
```

Expected: matches for scoped triggers and scoped secret names.

### Task 6: Run end-to-end verification for the local migration

**Files:**

- Verify only

- [ ] **Step 1: Install workspace dependencies if the lockfile changed**

```bash
pnpm install
```

Expected: workspace dependencies resolve with the new `apps/web` package definition.

- [ ] **Step 2: Run focused verification commands**

```bash
pnpm --filter @gaoge/app-web test
pnpm --filter @gaoge/app-web build
pnpm --filter @gaoge/app-admin typecheck
pnpm --filter @gaoge/app-admin build
pnpm --filter @gaoge/app-api build
```

Expected:

- web tests pass
- web build passes
- admin typecheck/build pass
- api build passes

- [ ] **Step 3: Run repo-level verification that is realistic for this change set**

```bash
pnpm typecheck
```

Expected: all workspace packages complete their configured typecheck/build validation without new failures introduced by the migration.

- [ ] **Step 4: Review changed files against scope**

```bash
git status --short
git diff --stat
```

Expected: changes limited to `apps/web`, workflow files, and supporting workspace/planning docs required by this migration.
