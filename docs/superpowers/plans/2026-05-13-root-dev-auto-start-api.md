# Root Dev Auto Start API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让根目录 `pnpm dev:admin`、`pnpm dev:web`、`pnpm dev:miniapp` 在本地 `api` 未启动时自动带起 `api`，已启动时只启动目标前端应用。

**Architecture:** 在根目录新增一个轻量 Node 编排脚本，统一做 `api` 健康检查、目标应用映射与 `turbo` 参数拼装。根目录脚本层负责开发体验优化，`apps/*` 内部 `dev` 脚本保持不变。测试使用 Node 内建 `node:test`，优先验证健康探测分支、参数校验和命令拼装。

**Tech Stack:** Node.js ESM, child_process.spawn, node:test, Turborepo, pnpm workspace

---

### Task 1: 先用测试锁定脚本契约

**Files:**

- Create: `scripts/dev-with-api.test.mjs`
- Create: `scripts/dev-with-api.mjs`

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'

import { buildTurboArgs, createExecutionPlan, isSupportedTarget } from './dev-with-api.mjs'

test('isSupportedTarget returns true for admin, web and miniapp', () => {
  assert.equal(isSupportedTarget('admin'), true)
  assert.equal(isSupportedTarget('web'), true)
  assert.equal(isSupportedTarget('miniapp'), true)
  assert.equal(isSupportedTarget('api'), false)
})

test('buildTurboArgs omits api filter when api is already running', () => {
  assert.deepEqual(buildTurboArgs('web', true), ['turbo', 'run', 'dev', '--filter=@gaoge/app-web'])
})

test('buildTurboArgs includes api filter and parallel flag when api is not running', () => {
  assert.deepEqual(buildTurboArgs('miniapp', false), [
    'turbo',
    'run',
    'dev',
    '--parallel',
    '--filter=@gaoge/app-miniapp',
    '--filter=@gaoge/app-api',
  ])
})

test('createExecutionPlan throws on unsupported target', async () => {
  await assert.rejects(() => createExecutionPlan('foo', async () => true), {
    message: /Unsupported target/,
  })
})

test('createExecutionPlan returns target-only mode when api probe succeeds', async () => {
  const plan = await createExecutionPlan('admin', async () => true)

  assert.equal(plan.includeApi, false)
  assert.equal(plan.targetFilter, '@gaoge/app-admin')
})

test('createExecutionPlan returns target-plus-api mode when api probe fails', async () => {
  const plan = await createExecutionPlan('admin', async () => false)

  assert.equal(plan.includeApi, true)
  assert.equal(plan.args.includes('--parallel'), true)
  assert.equal(plan.args.includes('--filter=@gaoge/app-api'), true)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH=/opt/homebrew/bin:/usr/local/bin:$PATH node --test scripts/dev-with-api.test.mjs`
Expected: FAIL because `scripts/dev-with-api.mjs` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
const TARGET_FILTERS = {
  admin: '@gaoge/app-admin',
  web: '@gaoge/app-web',
  miniapp: '@gaoge/app-miniapp',
}

export function isSupportedTarget(target) {
  return Object.hasOwn(TARGET_FILTERS, target)
}

export function buildTurboArgs(target, apiRunning) {
  const targetFilter = TARGET_FILTERS[target]

  if (!targetFilter) {
    throw new Error(`Unsupported target: ${target}`)
  }

  return apiRunning
    ? ['turbo', 'run', 'dev', `--filter=${targetFilter}`]
    : ['turbo', 'run', 'dev', '--parallel', `--filter=${targetFilter}`, '--filter=@gaoge/app-api']
}

export async function createExecutionPlan(target, checkApiRunning) {
  if (!isSupportedTarget(target)) {
    throw new Error(`Unsupported target: ${target}`)
  }

  const apiRunning = await checkApiRunning()

  return {
    includeApi: !apiRunning,
    targetFilter: TARGET_FILTERS[target],
    args: buildTurboArgs(target, apiRunning),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH=/opt/homebrew/bin:/usr/local/bin:$PATH node --test scripts/dev-with-api.test.mjs`
Expected: PASS for all 6 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/dev-with-api.mjs scripts/dev-with-api.test.mjs
git commit -m "test: cover root dev auto start api script"
```

### Task 2: 接上真实健康检查与进程启动

**Files:**

- Modify: `scripts/dev-with-api.mjs`
- Test: `scripts/dev-with-api.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
test('probeApiHealth returns true on 2xx response', async () => {
  const ok = await probeApiHealth(async () => ({ ok: true }))
  assert.equal(ok, true)
})

test('probeApiHealth returns false when fetch throws', async () => {
  const ok = await probeApiHealth(async () => {
    throw new Error('connect ECONNREFUSED')
  })
  assert.equal(ok, false)
})

test('resolvePnpmCommand prefers npm_execpath when available', () => {
  const resolved = resolvePnpmCommand('/opt/homebrew/bin/node', '/tmp/pnpm.cjs')

  assert.deepEqual(resolved, {
    command: '/opt/homebrew/bin/node',
    args: ['/tmp/pnpm.cjs'],
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH=/opt/homebrew/bin:/usr/local/bin:$PATH node --test scripts/dev-with-api.test.mjs`
Expected: FAIL because `probeApiHealth` and `resolvePnpmCommand` are not exported yet.

- [ ] **Step 3: Write minimal implementation**

```js
const DEFAULT_HEALTH_URL = process.env.GAOGE_API_HEALTH_URL ?? 'http://127.0.0.1:3000/health'

export async function probeApiHealth(fetchImpl = fetch, healthUrl = DEFAULT_HEALTH_URL) {
  try {
    const response = await fetchImpl(healthUrl)
    return response.ok
  } catch {
    return false
  }
}

export function resolvePnpmCommand(
  nodePath = process.execPath,
  npmExecPath = process.env.npm_execpath,
) {
  if (npmExecPath) {
    return {
      command: nodePath,
      args: [npmExecPath],
    }
  }

  return {
    command: 'pnpm',
    args: [],
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH=/opt/homebrew/bin:/usr/local/bin:$PATH node --test scripts/dev-with-api.test.mjs`
Expected: PASS for all tests, including health probe and pnpm command resolution.

- [ ] **Step 5: Commit**

```bash
git add scripts/dev-with-api.mjs scripts/dev-with-api.test.mjs
git commit -m "feat: add root dev api probe helpers"
```

### Task 3: 接通 CLI 入口与根脚本

**Files:**

- Modify: `scripts/dev-with-api.mjs`
- Modify: `package.json`
- Modify: `docs/superpowers/specs/2026-05-12-root-dev-auto-start-api-design.md`

- [ ] **Step 1: Write the failing test**

```js
test('formatModeMessage describes target-only mode', () => {
  assert.equal(formatModeMessage('web', false), 'API is running, starting web only')
})

test('formatModeMessage describes api-plus-target mode', () => {
  assert.equal(formatModeMessage('admin', true), 'API is not running, starting api + admin')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH=/opt/homebrew/bin:/usr/local/bin:$PATH node --test scripts/dev-with-api.test.mjs`
Expected: FAIL because message formatting helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
export function formatModeMessage(target, includeApi) {
  return includeApi
    ? `API is not running, starting api + ${target}`
    : `API is running, starting ${target} only`
}

async function main() {
  const target = process.argv[2]
  const plan = await createExecutionPlan(target, probeApiHealth)
  const pnpmCommand = resolvePnpmCommand()

  console.log(formatModeMessage(target, plan.includeApi))

  const child = spawn(pnpmCommand.command, [...pnpmCommand.args, ...plan.args], {
    stdio: 'inherit',
    env: process.env,
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    process.exit(code ?? 1)
  })
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
```

并将根目录脚本改为：

```json
{
  "scripts": {
    "dev:admin": "node scripts/dev-with-api.mjs admin",
    "dev:web": "node scripts/dev-with-api.mjs web",
    "dev:miniapp": "node scripts/dev-with-api.mjs miniapp"
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH=/opt/homebrew/bin:/usr/local/bin:$PATH node --test scripts/dev-with-api.test.mjs`
Expected: PASS for all tests.

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/dev-with-api.mjs scripts/dev-with-api.test.mjs docs/superpowers/specs/2026-05-12-root-dev-auto-start-api-design.md
git commit -m "feat: auto start api for root dev commands"
```

### Task 4: 验证

**Files:**

- Verify only: `package.json`
- Verify only: `scripts/dev-with-api.mjs`
- Verify only: `scripts/dev-with-api.test.mjs`
- Verify only: `docs/superpowers/specs/2026-05-12-root-dev-auto-start-api-design.md`

- [ ] 运行 `PATH=/opt/homebrew/bin:/usr/local/bin:$PATH node --test scripts/dev-with-api.test.mjs`
- [ ] 运行 `PATH=/opt/homebrew/bin:/usr/local/bin:$PATH /opt/homebrew/bin/pnpm lint package.json scripts/dev-with-api.mjs scripts/dev-with-api.test.mjs docs/superpowers/specs/2026-05-12-root-dev-auto-start-api-design.md`
- [ ] 运行 `PATH=/opt/homebrew/bin:/usr/local/bin:$PATH /opt/homebrew/bin/pnpm exec prettier --check package.json scripts/dev-with-api.mjs scripts/dev-with-api.test.mjs docs/superpowers/specs/2026-05-12-root-dev-auto-start-api-design.md`
- [ ] 手工复查 `dev:admin`、`dev:web`、`dev:miniapp` 都已切到同一脚本入口，`dev:admin-api` 保持不变。
