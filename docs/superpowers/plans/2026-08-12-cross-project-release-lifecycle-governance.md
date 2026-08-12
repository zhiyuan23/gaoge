# Cross-Project Release Lifecycle Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为高歌当前 10 个线上 release 根目录和 Finance 的未来发布入口落地统一版本生命周期管理，使历史版本数量有界、回滚可用、磁盘不足时停止发布，并避免批量清理再次造成服务器 I/O 故障。

**Architecture:** 主 `gaoge` 仓库提供零第三方运行时依赖的 Node.js CLI、JSON 配置、安装脚本和 systemd 单元；所有仓库只保留薄 workflow/部署脚本接入。发布前预检是强门禁，`current`/`previous` 切换和失败回滚属于发布阶段，外部健康检查后的标记与限量清理属于非回滚维护阶段；夜间 timer 使用同一文件锁补偿。

**Tech Stack:** Node.js 22+ ESM、Node test runner、GitHub Actions YAML、PM2、Nginx、systemd、`flock`、`nice`、`ionice`、Linux logrotate、SSH。

## Global Constraints

- 主 `gaoge` 仓库是版本管理器的唯一权威源码，其他仓库不得复制核心删除逻辑。
- 每个 release 根目录最多保留 3 个成功版本：`current`、`previous`、一个额外成功版本。
- 失败或未完成版本保留 24 小时。
- 永远保护 `current`、`previous`、PM2 实际 `cwd`、部署中的目录和创建不足 24 小时的目录。
- 磁盘 70% 告警；磁盘达到 80%、可用空间不足 5 GiB 或 inode 达到 80% 时，在上传前阻止发布。
- 部署后单 target 最多删除 1 个目录；夜间全机最多删除 3 个目录。
- 实际删除必须逐目录重新校验，并通过 `ionice -c3 nice -n 19` 执行。
- 删除前若 1 分钟负载超过 CPU 数量的 1.5 倍，或 `/proc/pressure/io` 的 `some avg10` 达到 20%，停止本轮后续删除。
- 发布成功后的标记或清理失败只告警，不能触发应用回滚。
- `pnpm store prune`、全量 Docker prune 和数据卷删除不得进入自动流程。
- 配置、日志和知识库不得保存密码、Token、SSH 私钥、Cookie、完整 `.env` 或数据库连接串。
- Finance 使用 `deploy` 用户、统一 release 根目录和两个 PM2 进程；在正式上线前保持 target 状态为 `planned`。
- GitHub Actions 发布统一使用 `RELEASE_ID=${GITHUB_SHA}-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}`，使重跑也是不可变的独立目录；`.release-success` 中的 `gitSha` 仍保存原始 `GITHUB_SHA`。
- 默认不做大范围重构；各仓库保留现有构建、migration、PM2 和健康检查语义。

---

## File and Interface Map

### 主 `gaoge` 仓库新增文件

```text
ops/release-manager/
├── bin/gaoge-release-manager.mjs       # CLI 参数、退出码、锁包装和命令分发
├── lib/config.mjs                      # 读取并校验 root-owned JSON 配置
├── lib/safety.mjs                      # 路径、磁盘、inode、PM2 cwd 和资源门禁
├── lib/lifecycle.mjs                   # 状态标记、保留计划、原子链接、回滚和删除
├── config/release-roots.conf.example   # 11 个 target 与全局门限
├── systemd/gaoge-release-audit.service
├── systemd/gaoge-release-audit.timer
├── systemd/gaoge-release-report.service
├── systemd/gaoge-release-report.timer
├── systemd/gaoge-journald-storage.conf
├── cron/gaoge-production-guard
├── logrotate/gaoge-pm2
├── install.sh
└── README.md

scripts/
├── release-manager-config.test.mjs
├── release-manager-lifecycle.test.mjs
└── release-manager-install.test.mjs
```

### 稳定 CLI

```text
gaoge-release-manager --version
gaoge-release-manager preflight --target <id>
gaoge-release-manager register-start --target <id> --release <id> --git-sha <sha> --workflow-run <run>
gaoge-release-manager activate --target <id> --release <id>
gaoge-release-manager mark-success --target <id> --release <id> --git-sha <sha> --workflow-run <run>
gaoge-release-manager mark-failed --target <id> --release <id> --stage <stage>
gaoge-release-manager plan --target <id|all> [--json]
gaoge-release-manager prune --target <id|all> --max-delete <n> [--json]
gaoge-release-manager audit --target <id|all> [--json]
gaoge-release-manager report --target <id|all> [--json]
gaoge-release-manager rollback --target <id>
gaoge-release-manager bootstrap --target <id|all> [--apply]
```

退出码固定为：`0` 成功、`2` 参数或配置错误、`3` 路径安全错误、`4` 磁盘门禁失败、`5` 锁超时、`6` 审计或运行态不一致。`activate` 和 `rollback` 只负责原子软链接，不启动 PM2；调用仓库必须负责进程重启与健康验证。

### 配置格式

`/etc/gaoge/release-roots.conf` 是 root 拥有、`0640` 的 JSON 文件：

```json
{
  "schemaVersion": 1,
  "settings": {
    "diskWarnPercent": 70,
    "diskHardPercent": 80,
    "minimumFreeKiB": 5242880,
    "inodeHardPercent": 80,
    "defaultKeepSuccessful": 3,
    "failedTtlHours": 24,
    "postDeployMaxDelete": 1,
    "nightlyMaxDelete": 3,
    "lockTimeoutSeconds": 30,
    "loadPerCpuHard": 1.5,
    "ioPressureAvg10Hard": 20,
    "allowedRootPrefix": "/var/www"
  },
  "targets": []
}
```

每个 target 固定字段：

```ts
type ReleaseTarget = {
  id: string
  state: 'enabled' | 'planned'
  releaseRoot: string
  currentLink: string
  previousLink: string
  owner: string
  runtime: { kind: 'static' | 'pm2'; processNames: string[] }
  healthUrls: string[]
  requiredPaths: string[]
  auditPaths?: string[]
  keepSuccessful?: number
  failedTtlHours?: number
}

type ReleaseManagerConfig = {
  schemaVersion: 1
  settings: ReleaseManagerSettings
  targets: ReleaseTarget[]
}

type ReleasePlan = {
  keep: Array<{ id: string; path: string; reason: string }>
  delete: Array<{ id: string; path: string; reason: string }>
  unsafe: Array<{ id: string; path: string; reason: string }>
}

type HealthProbeResult = {
  url: string
  ok: boolean
  statusCode?: number
  error?: string
}
```

实现统一使用 `ReleaseManagerError` 基类及 `ConfigError`、`PathSafetyError`、`DiskGateError`、`LockTimeoutError`、`AuditError` 子类；每个错误类固定携带前述退出码。测试中的 `target(...)`、`fixture.*` 和 `inventory(...)` 都是在对应测试文件顶部定义的本地 fixture helper，不是待实现的生产接口。

### 工作流 target 映射

| 仓库/入口               | Target ID                       |
| ----------------------- | ------------------------------- |
| `gaoge` Admin           | `gaoge-admin`                   |
| `gaoge` API             | `gaoge-api`                     |
| `gaoge` Brand           | `gaoge-brand`                   |
| `gaoge` Sports/Web      | `gaoge-sports`                  |
| Compass Admin/API       | `compass-admin` / `compass-api` |
| Club Admin/API          | `club-admin` / `club-api`       |
| CRM Admin/API           | `crm-admin` / `crm-api`         |
| Finance unified release | `finance`                       |

---

### Task 1: 配置、路径和磁盘安全核心

**Files:**

- Create: `ops/release-manager/lib/config.mjs`
- Create: `ops/release-manager/lib/safety.mjs`
- Create: `scripts/release-manager-config.test.mjs`
- Modify: `package.json`（增加 `test:release-manager`）

**Interfaces:**

- Produces: `loadConfig(path): ReleaseManagerConfig`
- Produces: `getTarget(config, id): ReleaseTarget`
- Produces: `resolveDirectChild(releaseRoot, candidate): string`
- Produces: `readDiskState(path): { diskPercent, freeKiB, inodePercent }`
- Produces: `readResourceState(): { load1, cpuCount, ioPressureAvg10 }`
- Produces: `resourceDeletionBlocked(settings, state): boolean`
- Produces: `assertPreflight(config, target, diskState): { warnings: string[] }`
- Produces: `readPm2Cwds(processNames, pm2Json?): Set<string>`
- Produces: `probeHealthUrls(urls, timeoutMs): Promise<HealthProbeResult[]>`

- [ ] **Step 1: 写配置解析失败测试**

```js
test('rejects duplicate targets and unsafe roots', async () => {
  assert.throws(
    () =>
      validateConfig({
        schemaVersion: 1,
        settings: validSettings,
        targets: [target('gaoge-api', '/var/www/a'), target('gaoge-api', '/var/www/b')],
      }),
    /duplicate target id/,
  )
  assert.throws(
    () =>
      validateConfig({
        schemaVersion: 1,
        settings: validSettings,
        targets: [target('bad', '/var/www')],
      }),
    /release root is too broad/,
  )
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test scripts/release-manager-config.test.mjs`

Expected: FAIL，提示 `config.mjs` 或导出函数不存在。

- [ ] **Step 3: 实现严格 JSON 配置解析**

```js
export function validateConfig(value) {
  if (value?.schemaVersion !== 1 || !value.settings || !Array.isArray(value.targets)) {
    throw new ConfigError('invalid release manager config')
  }
  const ids = new Set()
  for (const target of value.targets) {
    if (!/^[a-z][a-z0-9-]{1,63}$/.test(target.id)) throw new ConfigError('invalid target id')
    if (ids.has(target.id)) throw new ConfigError(`duplicate target id: ${target.id}`)
    ids.add(target.id)
    validateAbsoluteTargetPaths(value.settings.allowedRootPrefix, target)
    validateRuntime(target.runtime)
    validateHealthUrls(target.healthUrls)
    validateRelativeArtifactPaths(target.requiredPaths)
    validateAuditPaths(value.settings.allowedRootPrefix, target.auditPaths ?? [])
  }
  return Object.freeze(value)
}
```

配置文件本身、release root 和链接父目录都要使用 `lstat`/`realpath` 校验；配置文件不是 root 拥有或对 group/other 可写时，生产模式返回退出码 `3`。测试可通过 `GAOGE_RELEASE_MANAGER_TEST_MODE=1` 跳过 root 属主要求，但不能跳过路径规则。

- [ ] **Step 4: 写路径逃逸和直接子目录测试**

```js
test('only accepts a real direct child of releaseRoot', async () => {
  const root = await fixture.releaseRoot()
  const good = await fixture.release('abc123')
  assert.equal(await resolveDirectChild(root, good), good)
  await assert.rejects(() => resolveDirectChild(root, `${root}/../outside`), /escapes release root/)
  await assert.rejects(() => resolveDirectChild(root, `${root}/nested/child`), /direct child/)
  await assert.rejects(() => resolveDirectChild(root, `${root}/*`), /unsafe release id/)
})
```

- [ ] **Step 5: 实现路径与 PM2 cwd 保护**

`resolveDirectChild` 必须同时比较 `dirname(realCandidate) === realRoot`、release ID 正则 `^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$`、候选是实体目录且不是软链接。`requiredPaths` 只允许无 `..` 的相对路径，`activate` 与 bootstrap 候选选择前逐个 `lstat` 必需文件。`readPm2Cwds` 执行 `pm2 jlist` 并只提取配置 process name 对应的 `pm2_env.pm_cwd` 与 `pm_exec_path` 父目录；测试通过显式 JSON 参数注入，不依赖本机 PM2。

- [ ] **Step 6: 写磁盘门禁边界测试**

```js
for (const [diskPercent, freeKiB, inodePercent, blocked] of [
  [69, 6 * 1024 * 1024, 79, false],
  [70, 6 * 1024 * 1024, 79, false],
  [80, 6 * 1024 * 1024, 79, true],
  [60, 5 * 1024 * 1024 - 1, 79, true],
  [60, 6 * 1024 * 1024, 80, true],
]) {
  assert.equal(preflightBlocked(settings, { diskPercent, freeKiB, inodePercent }), blocked)
}
```

- [ ] **Step 7: 实现 `df -Pk` 与 `df -Pi` 解析并通过测试**

解析函数必须拒绝缺列、非整数和挂载点不一致；70% 返回 warning 并附带同 target 的 dry-run `plan` 摘要，不在上传前自动删除；80%/5 GiB/inode 80% 抛出 `DiskGateError`。`readResourceState` 使用 `os.loadavg()[0]`、`os.cpus().length` 和 `/proc/pressure/io` 的 `some avg10`；负载超过 `cpuCount * 1.5` 或 I/O pressure 达到 20 时只阻止 prune，不阻止 audit。`probeHealthUrls` 使用 `curl --fail --silent --show-error --max-time 10 --retry 2`，planned target 不探测。

Run: `node --test scripts/release-manager-config.test.mjs`

Expected: PASS。

- [ ] **Step 8: 增加根脚本并提交检查点**

```json
"test:release-manager": "node --test scripts/release-manager-*.test.mjs"
```

Run: `pnpm test:release-manager && pnpm exec prettier --check ops/release-manager scripts/release-manager-config.test.mjs package.json`

Expected: 全部 PASS。

Commit: `feat(ops): add release manager safety core`

---

### Task 2: 生命周期计划、原子链接、锁和限量删除

**Files:**

- Create: `ops/release-manager/lib/lifecycle.mjs`
- Create: `ops/release-manager/bin/gaoge-release-manager.mjs`
- Create: `scripts/release-manager-lifecycle.test.mjs`
- Test: `scripts/release-manager-config.test.mjs`

**Interfaces:**

- Consumes: Task 1 的 `loadConfig`、`getTarget`、`resolveDirectChild`、`assertPreflight`、`readPm2Cwds`
- Produces: `buildPlan(target, inventory, now): ReleasePlan`
- Produces: `activateRelease(target, releaseId): ActivationResult`
- Produces: `rollbackLink(target): RollbackResult`
- Produces: `writeReleaseStatus(target, releaseId, status, metadata): Promise<void>`
- Produces: `runPrune(target, maxDelete): PruneResult`
- Produces: `writeAuditState(result, stateDir): Promise<void>`
- Produces: “File and Interface Map”定义的稳定 CLI 与退出码

- [ ] **Step 1: 写保留集合测试**

```js
test('keeps current previous and newest extra success', () => {
  const plan = buildPlan(
    target,
    inventory({
      current: 'r5',
      previous: 'r4',
      successful: ['r1', 'r2', 'r3', 'r4', 'r5'],
      pm2Cwds: [],
      now: '2026-08-12T12:00:00Z',
    }),
  )
  assert.deepEqual(plan.keep.map((x) => x.id).sort(), ['r3', 'r4', 'r5'])
  assert.deepEqual(
    plan.delete.map((x) => x.id),
    ['r1', 'r2'],
  )
})
```

另写 24 小时新目录、失败 TTL、PM2 cwd、legacy、`planned` target、重复 current/previous 和无法解析链接测试。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test scripts/release-manager-lifecycle.test.mjs`

Expected: FAIL，提示 `lifecycle.mjs` 不存在。

- [ ] **Step 3: 实现纯函数保留计划**

```js
export function buildPlan(target, inventory, now = Date.now()) {
  const alwaysProtectedIds = new Set(
    [
      inventory.currentId,
      inventory.previousId,
      ...inventory.runtimeIds,
      ...inventory.inProgressIds,
    ].filter(Boolean),
  )
  const successfulProtectedIds = new Set(
    [inventory.currentId, inventory.previousId].filter(Boolean),
  )
  const successful = inventory.releases
    .filter((release) => release.status === 'successful' || release.status === 'legacy')
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
  for (const release of successful) {
    if (successfulProtectedIds.size >= (target.keepSuccessful ?? 3)) break
    successfulProtectedIds.add(release.id)
  }
  return classifyReleases(
    inventory.releases,
    new Set([...alwaysProtectedIds, ...successfulProtectedIds]),
    now,
    target.failedTtlHours ?? 24,
  )
}
```

`classifyReleases` 为每个目录提供稳定 reason，例如 `current`、`previous`、`runtime-cwd`、`young`、`successful-reserve`、`expired-failed`、`excess-successful` 或 `unsafe`。

- [ ] **Step 4: 写状态标记和原子链接测试**

```js
test('activate moves old current to previous before current', async () => {
  const { target, releases } = await fixture.withCurrent('r1')
  const result = await activateRelease(target, 'r2')
  assert.equal(await realpath(target.previousLink), releases.r1)
  assert.equal(await realpath(target.currentLink), releases.r2)
  assert.equal(result.previousId, 'r1')
})
```

状态文件使用 release 内 `.release-success`/`.release-failed` JSON，先写同目录临时文件再 `rename`；in-progress 状态放在 `/var/lib/gaoge-release-manager/in-progress/<target>/<release>.json`。活跃 in-progress 永久保护；超过 24 小时且不再对应 `current`/`previous`/PM2 cwd 的状态归类为 `expired-incomplete`，其 release 才能成为删除候选。`mark-success`/`mark-failed` 必须删除对应 in-progress 文件；audit 仅删除超过 24 小时且 release 已不存在的孤立状态文件。

- [ ] **Step 5: 实现 `activate`、`rollback`、`register-start` 和状态标记**

`activate` 只接受已存在、已验证的直接子目录。原子链接固定使用临时链接加 `rename`；`rollback` 在 `previous` 缺失、越界或等于 current 时返回退出码 `6`，且绝不启动 PM2。

- [ ] **Step 6: 写删除重新验证与数量上限测试**

```js
test('revalidates each candidate and stops at maxDelete', async () => {
  const executed = []
  const result = await runPrune(target, 1, {
    deleteOne: async (path) => executed.push(path),
    beforeEachDelete: async () => fixture.assertStillSafe(),
  })
  assert.equal(result.deleted.length, 1)
  assert.equal(executed.length, 1)
})
```

- [ ] **Step 7: 实现锁与低优先级删除**

先增加并发测试：持有 target lock 的 fixture 中第二个同 target 命令在超时后返回 `5`；不同 target 可同时运行只读 plan；持有 global prune lock 时任何删除 worker 都不得进入 `deleteOne`。

CLI 在未持锁时通过以下参数重新执行自身：

```js
spawnSync('/usr/bin/flock', [
  '-w',
  String(lockTimeoutSeconds),
  lockPath,
  '/usr/bin/ionice',
  '-c3',
  '/usr/bin/nice',
  '-n',
  '19',
  process.execPath,
  cliPath,
  '--lock-held',
  ...args,
])
```

只对实际 `prune` worker 使用 `ionice`/`nice`；`preflight`、`plan` 和 `audit` 不降优先级。全机 `all` 命令先拿 global lock，再按 target 排序逐个拿 target lock。

- [ ] **Step 8: 实现 JSON 与人读输出**

`--json` 输出单个 JSON 对象，至少包含 `command`、`target`、`ok`、`warnings`、`kept`、`candidates`、`deleted`、`disk`。默认输出每个版本一行及原因，不输出环境变量或命令环境。

`audit` 和 `report` 还要包含 health、target 版本数、总字节、磁盘、inode、负载、I/O pressure，以及 `auditPaths` 中超过 24 小时的遗留临时项。每次 audit 把完整结果原子写入 `/var/lib/gaoge-release-manager/last-audit.json`；70% warning 或老化临时项写 `status: degraded`，路径、health 或运行态错误写 `status: failed` 并返回退出码 `6`。`report` 输出相同稳定摘要，供每周 systemd journal 查询。

- [ ] **Step 9: 运行全量测试并提交检查点**

Run: `pnpm test:release-manager`

Run: `pnpm exec prettier --check ops/release-manager scripts/release-manager-*.test.mjs`

Expected: 全部 PASS，错误路径分别返回约定退出码。

Commit: `feat(ops): implement release lifecycle manager`

---

### Task 3: 11 个 target 配置、安装、systemd 与日志容量上限

**Files:**

- Create: `ops/release-manager/config/release-roots.conf.example`
- Create: `ops/release-manager/install.sh`
- Create: `ops/release-manager/systemd/gaoge-release-audit.service`
- Create: `ops/release-manager/systemd/gaoge-release-audit.timer`
- Create: `ops/release-manager/systemd/gaoge-release-report.service`
- Create: `ops/release-manager/systemd/gaoge-release-report.timer`
- Create: `ops/release-manager/systemd/gaoge-journald-storage.conf`
- Create: `ops/release-manager/cron/gaoge-production-guard`
- Create: `ops/release-manager/logrotate/gaoge-pm2`
- Create: `ops/release-manager/README.md`
- Create: `scripts/release-manager-install.test.mjs`

**Interfaces:**

- Consumes: Task 2 CLI 与配置格式
- Produces: `/usr/local/sbin/gaoge-release-manager`
- Produces: `/usr/local/lib/gaoge-release-manager/**`
- Produces: `/etc/gaoge/release-roots.conf`
- Produces: `/etc/cron.d/gaoge-production-guard`
- Produces: `gaoge-release-audit.service` / `.timer` 与 `gaoge-release-report.service` / `.timer`

- [ ] **Step 1: 写配置 target 完整性测试**

```js
const expected = [
  'gaoge-admin',
  'gaoge-api',
  'gaoge-brand',
  'gaoge-sports',
  'compass-admin',
  'compass-api',
  'club-admin',
  'club-api',
  'crm-admin',
  'crm-api',
  'finance',
]
assert.deepEqual(config.targets.map((item) => item.id).sort(), expected.sort())
assert.equal(config.targets.find((item) => item.id === 'finance').state, 'planned')
```

测试同时断言所有现有 target 的 release root、current/previous、owner、PM2 名称和 health URL 与 spec 一致。

- [ ] **Step 2: 写 11 个 target 的示例配置**

使用以下完整 target 列表；对象外层由前述 `schemaVersion` 和 `settings` 包裹：

```json
[
  {
    "id": "gaoge-admin",
    "state": "enabled",
    "releaseRoot": "/var/www/gaoge/admin/releases",
    "currentLink": "/var/www/gaoge/admin/current",
    "previousLink": "/var/www/gaoge/admin/previous",
    "owner": "deploy",
    "runtime": { "kind": "static", "processNames": [] },
    "healthUrls": ["https://admin.gaoge.cc/"],
    "keepSuccessful": 3,
    "failedTtlHours": 24
  },
  {
    "id": "gaoge-api",
    "state": "enabled",
    "releaseRoot": "/var/www/gaoge/api/releases/api",
    "currentLink": "/var/www/gaoge/api/current",
    "previousLink": "/var/www/gaoge/api/previous",
    "owner": "deploy",
    "runtime": { "kind": "pm2", "processNames": ["gaoge-api"] },
    "healthUrls": ["https://api.gaoge.cc/health", "https://api.gaoge.cc/health/db"],
    "keepSuccessful": 3,
    "failedTtlHours": 24
  },
  {
    "id": "gaoge-brand",
    "state": "enabled",
    "releaseRoot": "/var/www/gaoge/brand/releases",
    "currentLink": "/var/www/gaoge/brand/current",
    "previousLink": "/var/www/gaoge/brand/previous",
    "owner": "deploy",
    "runtime": { "kind": "static", "processNames": [] },
    "healthUrls": ["https://gaoge.cc/"],
    "keepSuccessful": 3,
    "failedTtlHours": 24
  },
  {
    "id": "gaoge-sports",
    "state": "enabled",
    "releaseRoot": "/var/www/gaoge/web/releases",
    "currentLink": "/var/www/gaoge/web/current",
    "previousLink": "/var/www/gaoge/web/previous",
    "owner": "deploy",
    "runtime": { "kind": "static", "processNames": [] },
    "healthUrls": ["https://sports.gaoge.cc/"],
    "keepSuccessful": 3,
    "failedTtlHours": 24
  },
  {
    "id": "compass-admin",
    "state": "enabled",
    "releaseRoot": "/var/www/gaoge-compass/admin/releases",
    "currentLink": "/var/www/gaoge-compass/admin/current",
    "previousLink": "/var/www/gaoge-compass/admin/previous",
    "owner": "root",
    "runtime": { "kind": "static", "processNames": [] },
    "healthUrls": ["https://compass.gaoge.cc/"],
    "keepSuccessful": 3,
    "failedTtlHours": 24
  },
  {
    "id": "compass-api",
    "state": "enabled",
    "releaseRoot": "/var/www/gaoge-compass/api/releases",
    "currentLink": "/var/www/gaoge-compass/api/current",
    "previousLink": "/var/www/gaoge-compass/api/previous",
    "owner": "root",
    "runtime": { "kind": "pm2", "processNames": ["gaoge-compass-api"] },
    "healthUrls": ["https://compass-api.gaoge.cc/health", "https://compass-api.gaoge.cc/health/db"],
    "keepSuccessful": 3,
    "failedTtlHours": 24
  },
  {
    "id": "club-admin",
    "state": "enabled",
    "releaseRoot": "/var/www/gaoge-club/admin/releases",
    "currentLink": "/var/www/gaoge-club/admin/current",
    "previousLink": "/var/www/gaoge-club/admin/previous",
    "owner": "root",
    "runtime": { "kind": "static", "processNames": [] },
    "healthUrls": ["https://club.gaoge.cc/"],
    "keepSuccessful": 3,
    "failedTtlHours": 24
  },
  {
    "id": "club-api",
    "state": "enabled",
    "releaseRoot": "/var/www/gaoge-club/api/releases/api",
    "currentLink": "/var/www/gaoge-club/api/current",
    "previousLink": "/var/www/gaoge-club/api/previous",
    "owner": "root",
    "runtime": { "kind": "pm2", "processNames": ["gaoge-club-api"] },
    "healthUrls": ["https://club-api.gaoge.cc/health", "https://club-api.gaoge.cc/health/db"],
    "keepSuccessful": 3,
    "failedTtlHours": 24
  },
  {
    "id": "crm-admin",
    "state": "enabled",
    "releaseRoot": "/var/www/gaoge-crm/admin/releases",
    "currentLink": "/var/www/gaoge-crm/admin/current",
    "previousLink": "/var/www/gaoge-crm/admin/previous",
    "owner": "deploy",
    "runtime": { "kind": "static", "processNames": [] },
    "healthUrls": ["https://crm.gaoge.cc/"],
    "keepSuccessful": 3,
    "failedTtlHours": 24
  },
  {
    "id": "crm-api",
    "state": "enabled",
    "releaseRoot": "/var/www/gaoge-crm/api/releases",
    "currentLink": "/var/www/gaoge-crm/api/current",
    "previousLink": "/var/www/gaoge-crm/api/previous",
    "owner": "deploy",
    "runtime": { "kind": "pm2", "processNames": ["gaoge-crm-api"] },
    "healthUrls": ["https://crm-api.gaoge.cc/health", "https://crm-api.gaoge.cc/health/db"],
    "keepSuccessful": 3,
    "failedTtlHours": 24
  },
  {
    "id": "finance",
    "state": "planned",
    "releaseRoot": "/var/www/gaoge-finance-news/releases",
    "currentLink": "/var/www/gaoge-finance-news/current",
    "previousLink": "/var/www/gaoge-finance-news/previous",
    "owner": "deploy",
    "runtime": { "kind": "pm2", "processNames": ["finance-news-api", "finance-news-web"] },
    "healthUrls": ["https://finance.gaoge.cc/health", "https://admin-finance.gaoge.cc/"],
    "keepSuccessful": 3,
    "failedTtlHours": 24
  }
]
```

写入实际 JSON 时，上述每个对象还必须合并下表的精确安全字段；测试断言它们不得缺失：

| Target                                         | `requiredPaths`                                                                                                                                                          | `auditPaths`                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `gaoge-admin` / `gaoge-brand` / `gaoge-sports` | `["index.html"]`                                                                                                                                                         | `[]`                                      |
| `gaoge-api`                                    | `["dist/main.js","ecosystem.config.cjs","node_modules/prisma/build/index.js","prisma/schema.prisma"]`                                                                    | `["/var/www/gaoge/api/tmp/deploy-state"]` |
| `compass-admin`                                | `["index.html"]`                                                                                                                                                         | `[]`                                      |
| `compass-api`                                  | `["dist/main.js","ecosystem.config.cjs","node_modules/prisma/build/index.js","prisma/schema.prisma"]`                                                                    | `["/var/www/gaoge-compass/api/tmp"]`      |
| `club-admin`                                   | `["index.html"]`                                                                                                                                                         | `[]`                                      |
| `club-api`                                     | `["dist/main.js","ecosystem.config.cjs","node_modules/prisma/build/index.js","prisma/schema.prisma"]`                                                                    | `[]`                                      |
| `crm-admin`                                    | `["index.html"]`                                                                                                                                                         | `["/var/www/gaoge-crm/admin/staging"]`    |
| `crm-api`                                      | `["dist/main.js","ecosystem.config.cjs","node_modules/prisma/build/index.js","prisma/schema.prisma"]`                                                                    | `["/var/www/gaoge-crm/api/staging"]`      |
| `finance`                                      | `["package.json","pnpm-lock.yaml","infra/pm2/ecosystem.config.cjs","apps/api/dist/main.js","apps/web/.next/standalone/apps/web/server.js","apps/admin/dist/index.html"]` | `[]`                                      |

`auditPaths` 只扫描直接子项的存在时间和大小，报告超过 24 小时的遗留项；统一管理器不自动删除 `auditPaths`，因为其中可能包含长期运行守卫脚本。workflow 只删除自己当次创建的精确 staging/archive/state 路径。

- [ ] **Step 3: 写安装静态测试**

断言安装脚本只写入明确路径、配置已存在时不覆盖、systemd 启用需显式 `--activate`，并拒绝非 root：

```js
assert.match(installScript, /test -e "\$CONFIG_PATH" \|\| install -m 0640/)
assert.match(installScript, /--activate/)
assert.doesNotMatch(installScript, /rm -rf/)
```

- [ ] **Step 4: 实现幂等安装脚本**

核心安装动作：

```bash
install -d -m 0755 /usr/local/lib/gaoge-release-manager/{bin,lib}
install -m 0644 "$SOURCE_ROOT"/lib/*.mjs /usr/local/lib/gaoge-release-manager/lib/
install -m 0755 "$SOURCE_ROOT/bin/gaoge-release-manager.mjs" /usr/local/lib/gaoge-release-manager/bin/
install -d -m 0750 /etc/gaoge /var/lib/gaoge-release-manager
test -e /etc/gaoge/release-roots.conf || install -m 0640 "$SOURCE_ROOT/config/release-roots.conf.example" /etc/gaoge/release-roots.conf
install -m 0644 "$SOURCE_ROOT/systemd/"*.service "$SOURCE_ROOT/systemd/"*.timer /etc/systemd/system/
install -m 0644 "$SOURCE_ROOT/systemd/gaoge-journald-storage.conf" /etc/systemd/journald.conf.d/gaoge-storage.conf
install -m 0644 "$SOURCE_ROOT/cron/gaoge-production-guard" /etc/cron.d/gaoge-production-guard
install -m 0644 "$SOURCE_ROOT/logrotate/gaoge-pm2" /etc/logrotate.d/gaoge-pm2
```

`/usr/local/sbin/gaoge-release-manager` 使用固定 wrapper 调用 `/usr/local/lib/gaoge-release-manager/bin/gaoge-release-manager.mjs`。安装脚本只在 `--activate` 时执行 `systemctl daemon-reload` 和 enable timer，不自动 prune。

- [ ] **Step 5: 写 systemd 与日志配置**

Service 必须是 oneshot，先 audit 后最多删除 3 个：

```ini
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/gaoge-release-manager audit --target all --json
ExecStart=/usr/local/sbin/gaoge-release-manager prune --target all --max-delete 3 --json
Nice=19
IOSchedulingClass=idle
```

Audit timer 使用 `OnCalendar=*-*-* 03:40:00`、`RandomizedDelaySec=20m`、`Persistent=true`。Report service 只执行 `/usr/local/sbin/gaoge-release-manager report --target all --json`，report timer 使用 `OnCalendar=Sun *-*-* 04:20:00`、`Persistent=true`。journald drop-in 设置 `SystemMaxUse=200M`。logrotate 同时覆盖 `/root/.pm2/logs/*.log`、`/home/deploy/.pm2/logs/*.log` 和 `/var/log/gaoge-production-guard.log`，使用 `daily`、`size 10M`、`rotate 7`、`compress`、`copytruncate`、`missingok`。

`gaoge-production-guard` 保留现有 `@reboot root sleep 60 && ...` 语义，但必须删除已硬编码的 `EXPECTED_RELEASE_PATH='/var/www/gaoge/api/releases/api/a0ea319322bc16e671e8d385d9bb648da2de3494'`。守护脚本本身已会解析 `/var/www/gaoge/api/current`并比对 PM2 cwd，因此 cron 不再传入 `EXPECTED_RELEASE_PATH` 或 `EXPECTED_RELEASE_SHA`，从而在每次发布后自动跟随 current。

- [ ] **Step 6: 写运行手册并验证**

README 必须包含安装、配置校验、dry-run、bootstrap、单 target 回滚、timer 禁用、故障退出码和“禁止自动 `pnpm store prune`”。Docker 只记录人工、先审计后可选执行的 `docker image prune --filter dangling=true`，明确禁止自动 `docker system prune`、`docker volume prune` 和删除 named volume。

Run: `pnpm test:release-manager`

Run: `shellcheck ops/release-manager/install.sh`

Run: `pnpm exec prettier --check ops/release-manager scripts/release-manager-install.test.mjs`

Expected: 全部 PASS。

Commit: `feat(ops): package release manager service`

---

### Task 4: 接入 `gaoge` 四条生产 workflow

**Files:**

- Modify: `.github/workflows/deploy-api.yml:118-383`
- Modify: `.github/workflows/deploy-admin.yml:108-150`
- Modify: `.github/workflows/deploy-brand.yml:136-175`
- Modify: `.github/workflows/deploy-sports.yml:122-160`
- Modify: `scripts/verify-production-runtime-guard.test.mjs`
- Create: `scripts/verify-release-lifecycle-workflows.test.mjs`

**Interfaces:**

- Consumes: server CLI `preflight`、`register-start`、`activate`、`mark-success`、`mark-failed`、`prune`、`rollback`
- Produces: 四条 workflow 的同一发布阶段顺序

- [ ] **Step 1: 写 workflow 合约失败测试**

对四个文件逐一断言，并要求四条 workflow 统一使用 `gaoge-production-deployment`、`cancel-in-progress: false`：

```js
assertOrdered(workflow, [
  'gaoge-release-manager preflight',
  'gaoge-release-manager register-start',
  'gaoge-release-manager activate',
  'Verify',
  'gaoge-release-manager mark-success',
  'gaoge-release-manager prune',
])
assert.match(workflow, /--max-delete 1/)
assert.match(workflow, /group:\s+gaoge-production-deployment/)
assert.match(workflow, /cancel-in-progress:\s+false/)
assert.match(workflow, /RELEASE_ID:.*github\.sha.*github\.run_id.*github\.run_attempt/)
assert.doesNotMatch(workflow, /rm -rf .*current/)
```

测试还要断言 maintenance shell 用 `if ! ...; then echo "::warning::` 吞掉非零状态，且 API 原有 `if: failure()` rollback 位于 maintenance 之前。
同时断言远端 workflow 不得对 `RELEASE_DIR` 执行 `rm -rf`，已存在的 release ID 必须视为错误，不允许覆盖 current、previous 或失败现场。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test scripts/verify-release-lifecycle-workflows.test.mjs`

Expected: FAIL，缺少 lifecycle 调用。

- [ ] **Step 3: 在所有上传前增加 fatal preflight 与 register-start**

远端命令统一为：

```bash
RELEASE_ID="${GITHUB_SHA}-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
gaoge-release-manager preflight --target "$TARGET_ID"
gaoge-release-manager register-start \
  --target "$TARGET_ID" \
  --release "$RELEASE_ID" \
  --git-sha "$GITHUB_SHA" \
  --workflow-run "$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
```

四条 workflow 在 job-level `env` 固定上述 `RELEASE_ID`，并分别固定 `TARGET_ID=gaoge-api|gaoge-admin|gaoge-brand|gaoge-sports`，不得从用户输入接受任意 target。Brand 和 Sports 现有独立 concurrency group 同步收敛为 `gaoge-production-deployment`，确保四个生产发布串行且不取消执行中的部署。远端发布目录改为 `releases/.../$RELEASE_ID`，创建前要求 `[ ! -e "$RELEASE_DIR" ]`，不再先删除同名目录。

API 现有 `/var/www/gaoge/api/tmp/deploy-state/<run>-<attempt>` 是 workflow 自身的数据库/回滚状态，不交给中央管理器泛化删除。保留成功分支精确删除当次 `STATE_DIR`，失败现场的定时回收从 `-mtime +7` 改为 `-mmin +1440`，只匹配一层实体目录，且在发布 concurrency 锁内执行，因此不会删除当次活跃状态。

- [ ] **Step 4: 用 `activate` 替换静态站点直接删除 current**

Admin、Brand、Sports 上传完成后调用：

```bash
gaoge-release-manager activate --target "$TARGET_ID" --release "$RELEASE_ID"
```

health 失败的 cleanup step 先调用 `gaoge-release-manager rollback --target "$TARGET_ID"`，再请求原健康 URL；rollback 失败时让工作流失败并保留所有 release。API 保留现有 `prepare-api-rollback-state.sh` 和 `rollback-api-release.sh`，但切换前同步建立持久 `previous`。

- [ ] **Step 5: 增加失败标记**

每条 workflow 的 failure path 在完成自身 rollback 后调用：

```bash
gaoge-release-manager mark-failed \
  --target "$TARGET_ID" \
  --release "$RELEASE_ID" \
  --stage "${FAILED_STAGE:-workflow}"
```

失败标记自身失败只输出 warning，不覆盖原始发布失败状态。

- [ ] **Step 6: 增加非回滚 maintenance 阶段**

外部 health 成功后执行：

```bash
if ! gaoge-release-manager mark-success \
  --target "$TARGET_ID" --release "$RELEASE_ID" \
  --git-sha "$GITHUB_SHA" --workflow-run "$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"; then
  echo "::warning::Release lifecycle success marker failed; the healthy release remains active"
elif ! gaoge-release-manager prune --target "$TARGET_ID" --max-delete 1; then
  echo "::warning::Release lifecycle prune failed; the healthy release remains active"
fi
```

该 shell 必须以 `0` 退出，避免触发 API 原有 rollback。

- [ ] **Step 7: 运行仓库验证并提交**

Run: `node --test scripts/verify-release-lifecycle-workflows.test.mjs scripts/verify-production-runtime-guard.test.mjs scripts/verify-api-release-rollback.test.mjs`

Run: `pnpm exec prettier --check .github/workflows scripts/verify-release-lifecycle-workflows.test.mjs`

Run: `pnpm lint && pnpm typecheck`

Expected: 全部 PASS。

Commit: `feat(ops): govern gaoge release retention`

---

### Task 5: 接入 Compass Admin/API workflow

**Files:**

- Modify: `/Users/snow/Documents/Gaoge/gaoge-compass/.github/workflows/deploy-admin.yml:88-118`
- Modify: `/Users/snow/Documents/Gaoge/gaoge-compass/.github/workflows/deploy-api.yml:92-190`
- Modify: `/Users/snow/Documents/Gaoge/gaoge-compass/scripts/verify-production-deployment-config.test.mjs`

**Interfaces:**

- Consumes: Task 2 CLI，target `compass-admin` / `compass-api`
- Produces: Compass 独立组件的 previous、失败回滚和限量回收

- [ ] **Step 1: 扩展现有部署配置测试**

断言 Admin/API 都按 preflight → register → activate → health → mark-success → prune 排序，concurrency 仍为 `compass-production-deployment`，post-health maintenance 不传播非零退出码。两条 workflow 都要使用 job-level `RELEASE_ID=${GITHUB_SHA}-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}`，并断言 API 的 `${DEPLOY_PATH}/tmp/${RELEASE_ID}.tar.gz` 在成功与失败分支都通过 trap 删除。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test scripts/verify-production-deployment-config.test.mjs`

Expected: FAIL，缺少 lifecycle 调用。

- [ ] **Step 3: 接入 Admin**

上传前调用 `preflight/register-start --release "$RELEASE_ID"`；把 `ln -sfn ... current` 替换为 `activate --target compass-admin --release "$RELEASE_ID"`；health 失败时 `rollback --target compass-admin` 并重新请求 `https://compass.gaoge.cc/`；成功后执行非致命 mark/prune。

- [ ] **Step 4: 接入 API 并补失败回滚**

API 发布目录和临时压缩包都使用 `RELEASE_ID`，activation 使用 `activate --target compass-api --release "$RELEASE_ID"`。临时压缩包用远端 `trap` 删除，但已创建的 release 在失败后仅 `mark-failed`，保留 24 小时。外部 health 失败后：

```bash
gaoge-release-manager rollback --target compass-api
cd /var/www/gaoge-compass/api/current
pm2 delete gaoge-compass-api >/dev/null 2>&1 || true
pm2 start ecosystem.config.cjs --only gaoge-compass-api --update-env
curl -fsS --retry 5 https://compass-api.gaoge.cc/health >/dev/null
```

回滚验证成功后标记新 release failed；回滚验证失败则停止清理并保留日志。

- [ ] **Step 5: 验证并提交**

Run: `node --test scripts/verify-production-deployment-config.test.mjs`

Run: `pnpm exec prettier --check .github/workflows scripts/verify-production-deployment-config.test.mjs`

Run: `pnpm lint && pnpm typecheck`

Expected: 全部 PASS。

Commit: `feat(ops): govern compass release retention`

---

### Task 6: 接入 Club Admin/API workflow

**Files:**

- Modify: `/Users/snow/Documents/Gaoge/gaoge-club/.github/workflows/deploy-admin.yml:98-155`
- Modify: `/Users/snow/Documents/Gaoge/gaoge-club/.github/workflows/deploy-api.yml:109-275`
- Modify: `/Users/snow/Documents/Gaoge/gaoge-club/scripts/verify-production-runtime-guard.test.mjs`

**Interfaces:**

- Consumes: Task 2 CLI，target `club-admin` / `club-api`
- Produces: Club 组件的 previous、失败回滚和限量回收

- [ ] **Step 1: 扩展现有 workflow 合约测试**

断言两个 workflow 保留 `club-production-deployment`、不直接删除 current、API 回滚后从 `/var/www/gaoge-club/api/current` 启动 `gaoge-club-api`，maintenance 不触发 rollback。同时断言 job-level `RELEASE_ID`、不对远端 `RELEASE_DIR` 执行 `rm -rf`，并且失败 release 只标记、不立即删除。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test scripts/verify-production-runtime-guard.test.mjs`

Expected: FAIL，缺少 lifecycle 调用。

- [ ] **Step 3: 接入 Admin**

在远端创建 Admin release 之前执行 `preflight --target club-admin` 和 `register-start --target club-admin --release "$RELEASE_ID"`；上传完成后执行 `activate --target club-admin --release "$RELEASE_ID"`。`https://club.gaoge.cc/` 健康检查失败时执行 `rollback --target club-admin` 并重新请求旧站点；成功时 mark-success 后最多 prune 1 个，失败时 mark-failed。

- [ ] **Step 4: 接入 API**

在 API release 目录创建前执行 `preflight --target club-api` 和 `register-start --target club-api --release "$RELEASE_ID"`；migration 和运行时守卫成功后执行 `activate --target club-api --release "$RELEASE_ID"`。API 回滚命令固定：

```bash
gaoge-release-manager rollback --target club-api
cd /var/www/gaoge-club/api/current
pm2 delete gaoge-club-api >/dev/null 2>&1 || true
pm2 start ecosystem.config.cjs --only gaoge-club-api --update-env
curl -fsS --retry 5 https://club-api.gaoge.cc/health >/dev/null
```

外部 `/health` 和 `/health/db` 都成功后执行 mark-success 与 `prune --max-delete 1`；任一路径失败时先完成上述回滚，再 mark-failed。maintenance 失败必须通过 warning 转换为成功退出。

- [ ] **Step 5: 验证并提交**

Run: `node --test scripts/verify-production-runtime-guard.test.mjs scripts/verify-miniapp-deployment-config.test.mjs`

Run: `pnpm exec prettier --check .github/workflows scripts/verify-production-runtime-guard.test.mjs`

Run: `pnpm lint && pnpm typecheck`

Expected: 全部 PASS。

Commit: `feat(ops): govern club release retention`

---

### Task 7: 接入 CRM Admin/API workflow

**Files:**

- Modify: `/Users/snow/Documents/Gaoge/gaoge-crm/.github/workflows/deploy-admin.yml:112-198`
- Modify: `/Users/snow/Documents/Gaoge/gaoge-crm/.github/workflows/deploy-api.yml:143-375`
- Modify: `/Users/snow/Documents/Gaoge/gaoge-crm/scripts/verify-production-deployment-config.test.mjs`

**Interfaces:**

- Consumes: Task 2 CLI，target `crm-admin` / `crm-api`
- Produces: CRM 组件的 previous、失败回滚和限量回收

- [ ] **Step 1: 扩展 CRM workflow 合约测试并确认失败**

CRM Admin/API 都增加 job-level `RELEASE_ID=${GITHUB_SHA}-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}`，并断言现有 `${DEPLOY_PATH}/staging/${RELEASE_ID}` 在 workflow trap 中精确删除，不使用 staging 通配符。

Run: `node --test scripts/verify-production-deployment-config.test.mjs`

Expected: FAIL，缺少 lifecycle 调用或 previous 回滚。

- [ ] **Step 2: 接入 Admin**

保留现有 staging 与 immutable release 校验，但 staging 和最终 release 都使用 `RELEASE_ID`；上传前执行 preflight/register，发布目录就绪后执行 `activate --target crm-admin --release "$RELEASE_ID"`。Admin health 失败时 rollback link 并重新请求 `https://crm.gaoge.cc/`。

- [ ] **Step 3: 接入 API**

保留现有 staging、env link、migration 和 runtime guard；staging 和最终 release 都使用 `RELEASE_ID`，当前切换改为 `activate --target crm-api --release "$RELEASE_ID"`。API health 失败后执行：

```bash
gaoge-release-manager rollback --target crm-api
cd /var/www/gaoge-crm/api/current
pm2 delete gaoge-crm-api >/dev/null 2>&1 || true
pm2 start ecosystem.config.cjs --only gaoge-crm-api --update-env
curl -fsS --retry 5 https://crm-api.gaoge.cc/health >/dev/null
```

- [ ] **Step 4: 增加 success/failed 状态和限量回收**

Admin/API 的 failure path 在 rollback 和旧版本 health 成功后执行 `mark-failed --stage health`。两个外部 health 检查通过后执行以下独立维护 shell：

```bash
if ! gaoge-release-manager mark-success \
  --target "$TARGET_ID" --release "$RELEASE_ID" \
  --git-sha "$GITHUB_SHA" --workflow-run "$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"; then
  echo "::warning::CRM release lifecycle success marker failed; the healthy release remains active"
elif ! gaoge-release-manager prune --target "$TARGET_ID" --max-delete 1; then
  echo "::warning::CRM release lifecycle prune failed; the healthy release remains active"
fi
```

该 shell 自身必须返回 `0`，且 `prune --max-delete 1` 只能位于健康检查之后。

- [ ] **Step 5: 验证并提交**

Run: `node --test scripts/verify-production-deployment-config.test.mjs`

Run: `pnpm exec prettier --check .github/workflows scripts/verify-production-deployment-config.test.mjs`

Run: `pnpm lint && pnpm typecheck`

Expected: 全部 PASS。

Commit: `feat(ops): govern crm release retention`

---

### Task 8: Finance 发布脚本接入统一管理器

**Files:**

- Modify: `/Users/snow/Documents/Gaoge/gaoge-finance-news/infra/deploy/deploy.sh:1-138`
- Modify: `/Users/snow/Documents/Gaoge/gaoge-finance-news/infra/tests/deploy-failure-smoke.sh`
- Modify: `/Users/snow/Documents/Gaoge/gaoge-finance-news/docs/operations/deployment-runbook.md`

**Interfaces:**

- Consumes: Task 2 CLI，target `finance`
- Produces: Finance 首次上线即有 preflight、状态、previous 和限量回收

- [ ] **Step 1: 扩展部署失败 smoke fixture**

在 fake PATH 增加 `gaoge-release-manager`，把每次调用写入 `$TEST_LOG/release-manager.log`。成功场景断言顺序：

```bash
assert_order 'preflight --target finance' 'register-start --target finance'
assert_order 'activate --target finance' 'mark-success --target finance'
assert_contains 'prune --target finance --max-delete 1'
```

失败场景断言外部 health 失败后出现 `rollback --target finance` 和 `mark-failed`，且没有 `mark-success`。

- [ ] **Step 2: 运行 smoke 并确认失败**

Run: `infra/tests/deploy-failure-smoke.sh`

Expected: FAIL，fake manager 没有收到调用。

- [ ] **Step 3: 在创建 release 前增加强门禁**

```bash
RELEASE_MANAGER="${RELEASE_MANAGER:-gaoge-release-manager}"
"$RELEASE_MANAGER" preflight --target finance
"$RELEASE_MANAGER" register-start \
  --target finance --release "$release_id" \
  --git-sha "${GIT_SHA:-$release_id}" \
  --workflow-run "${GITHUB_RUN_ID:-manual}-${GITHUB_RUN_ATTEMPT:-1}"
```

这些命令必须位于 `mkdir "$release_dir"` 之前。

- [ ] **Step 4: 统一 activate 与 rollback link**

保留 Finance 现有 `start_release` 和两进程 health 顺序；服务启动成功后使用 `activate --target finance --release "$release_id"`。health 失败时先 `rollback --target finance`，再从恢复后的 current 调用 `start_release` 和 `verify-release.sh health`。

- [ ] **Step 5: 增加非致命维护阶段**

```bash
if ! "$RELEASE_MANAGER" mark-success \
  --target finance --release "$release_id" \
  --git-sha "${GIT_SHA:-$release_id}" \
  --workflow-run "${GITHUB_RUN_ID:-manual}-${GITHUB_RUN_ATTEMPT:-1}" \
  || ! "$RELEASE_MANAGER" prune --target finance --max-delete 1; then
  printf 'deploy: warning: release lifecycle maintenance failed; active release remains unchanged\n' >&2
fi
```

确认 shell 条件不会让成功部署返回非零。rollback mode 也通过 `activate` 建立新的 `previous` 语义，但不执行 prune。

- [ ] **Step 6: 更新 runbook 与验证**

Run: `infra/tests/deploy-failure-smoke.sh`

Run: `shellcheck infra/deploy/*.sh infra/tests/*.sh`

Run: `pnpm check`

Expected: 全部 PASS。

Commit: `feat(ops): govern finance release retention`

---

### Task 9: 安装服务器、legacy bootstrap 与纯预览

**Files:**

- Source: `ops/release-manager/**`
- Server create/update: `/usr/local/lib/gaoge-release-manager/**`
- Server create/update: `/usr/local/sbin/gaoge-release-manager`
- Server create: `/etc/gaoge/release-roots.conf`
- Server create: `/etc/systemd/system/gaoge-release-audit.service`
- Server create: `/etc/systemd/system/gaoge-release-audit.timer`
- Server create: `/etc/systemd/system/gaoge-release-report.service`
- Server create: `/etc/systemd/system/gaoge-release-report.timer`
- Server create/update: `/etc/systemd/journald.conf.d/gaoge-storage.conf`
- Server create/update: `/etc/cron.d/gaoge-production-guard`
- Server create/update: `/etc/logrotate.d/gaoge-pm2`

**Interfaces:**

- Consumes: Tasks 1-3 的已验证安装包
- Produces: 安装但尚未自动删除的服务器管理器与 dry-run 报告

- [ ] **Step 1: 建立云快照和只读基线**

创建新的阿里云快照，命名 `release-lifecycle-pre-rollout-20260812`。随后记录：

```bash
df -h /
df -i /
find /var/www -type d -name releases -prune -print
pm2 list
sudo -u deploy PM2_HOME=/home/deploy/.pm2 pm2 list
systemctl is-active nginx postgresql docker
```

Expected: 磁盘约 35%，关键服务 active，现有域名健康。

- [ ] **Step 2: 安装但不启用 timer**

从已验证的 `gaoge` 提交打包并上传管理器：

```bash
release_manager_sha=$(git rev-parse --short=12 HEAD)
tar -czf "/tmp/gaoge-release-manager-${release_manager_sha}.tgz" -C ops release-manager
scp -i /Users/snow/.ssh/gaoge-deploy "/tmp/gaoge-release-manager-${release_manager_sha}.tgz" root@47.94.223.170:/tmp/
ssh -i /Users/snow/.ssh/gaoge-deploy root@47.94.223.170 "mkdir -p /tmp/gaoge-release-manager-${release_manager_sha} && tar -xzf /tmp/gaoge-release-manager-${release_manager_sha}.tgz -C /tmp/gaoge-release-manager-${release_manager_sha} --strip-components=1 && bash /tmp/gaoge-release-manager-${release_manager_sha}/install.sh"
ssh -i /Users/snow/.ssh/gaoge-deploy root@47.94.223.170 "/usr/local/sbin/gaoge-release-manager --version && systemctl is-enabled gaoge-release-audit.timer || true"
```

Expected: 版本正确；timer 仍 disabled；没有 prune 执行记录。

- [ ] **Step 3: 核对配置与权限**

```bash
stat -c '%U:%G %a %n' /etc/gaoge/release-roots.conf /usr/local/sbin/gaoge-release-manager /etc/cron.d/gaoge-production-guard
gaoge-release-manager audit --target all --json
gaoge-release-manager plan --target all --json
```

Expected: `finance` 作为 planned 被跳过；10 个线上 target 的 current、owner、runtime 与 health 可解析；cron 中不再出现 `EXPECTED_RELEASE_PATH` 或旧提交 `a0ea319322bc16e671e8d385d9bb648da2de3494`；报告不写入 release。

- [ ] **Step 4: legacy bootstrap dry-run**

```bash
gaoge-release-manager bootstrap --target all
```

逐项核对：current 保护、PM2 cwd 保护、每根最近两个候选、Brand 9 个、Sports 33 个、全机约 32 个超额候选。任何 unresolved target 必须停止 apply。

- [ ] **Step 5: 应用 bootstrap 但不删除**

```bash
gaoge-release-manager bootstrap --target all --apply
gaoge-release-manager audit --target all --json
gaoge-release-manager plan --target all --json
```

Expected: 当前版本有成功标记，previous 指向安全候选；release 目录数量未变化。

- [ ] **Step 6: 验证日志限制配置**

```bash
logrotate -d /etc/logrotate.d/gaoge-pm2
grep -q '@reboot root sleep 60' /etc/cron.d/gaoge-production-guard
! grep -Eq 'EXPECTED_RELEASE_(PATH|SHA)' /etc/cron.d/gaoge-production-guard
systemd-analyze verify /etc/systemd/system/gaoge-release-audit.service /etc/systemd/system/gaoge-release-audit.timer /etc/systemd/system/gaoge-release-report.service /etc/systemd/system/gaoge-release-report.timer
systemctl restart systemd-journald
journalctl --disk-usage
```

Expected: logrotate/systemd 无错误；journal 使用新上限但不会主动删除尚未超过 200M 的日志。

- [ ] **Step 7: 完整线上健康复核**

请求 `gaoge.cc`、`admin.gaoge.cc`、`api.gaoge.cc/health`、Compass、Club、CRM 和 monitor；核对两个 PM2 home、Nginx、PostgreSQL、Docker、`df -h`、`df -i`。

Expected: 与安装前基线一致。

---

### Task 10: 分项目启用、限量回收与 timer 上线

**Files:**

- Runtime: GitHub Actions 默认分支中的 Tasks 4-7 workflow
- Runtime: Finance target 配置（Finance 上线时从 `planned` 改为 `enabled`）
- Server: `gaoge-release-audit.timer`

**Interfaces:**

- Consumes: Tasks 4-9
- Produces: 已验证的部署后回收与夜间补偿

- [ ] **Step 1: 推送已验证提交并确认 workflow 触发边界**

先把主 `gaoge` 的管理器和 workflow 提交推送到 `main`；workflow-only 变化不在四条 workflow 当前 push path 中，因此使用 `gh workflow run deploy-brand.yml --ref main` 主动触发首个验证。Compass 和 CRM 的 workflow 文件在自身 path filter 中，Club 对所有 main push 触发；推送这三个仓库前必须确认服务器管理器、配置和 bootstrap 已完成，它们的同项目 concurrency 会把 Admin/API 串行执行。

- [ ] **Step 2: 先发布最小静态 target**

先执行 Brand 或 Sports 的受控 workflow，观察 preflight、activate、外部 health、mark-success 和最多删除 1 个目录。发布后核对 current/previous 和域名。

Expected: workflow 成功；版本数最多下降 1；无 I/O 峰值。

- [ ] **Step 3: 依次验证主 `gaoge` Admin/API**

每个 target 单独发布，发布间核对 PM2 cwd、health、数据库 health、Nginx 和磁盘。API 人工触发一次非生产临时树 rollback 演练，不在真实数据库上执行向下 migration。

- [ ] **Step 4: 依次验证 Compass、Club、CRM**

按 Admin 后 API 的顺序逐仓库执行；前一仓库全部健康后才进入下一仓库。每次只允许 target 自己删除最多 1 个目录。

- [ ] **Step 5: 手动执行首次全机限量回收**

```bash
gaoge-release-manager prune --target all --max-delete 3 --json
gaoge-release-manager audit --target all --json
df -h /
df -i /
```

Expected: 最多删除 3 个，所有 current/previous/PM2 cwd 保持，关键域名健康。

- [ ] **Step 6: 启用夜间 timer**

```bash
systemctl enable --now gaoge-release-audit.timer
systemctl enable --now gaoge-release-report.timer
systemctl list-timers gaoge-release-audit.timer
systemctl list-timers gaoge-release-report.timer
systemctl start gaoge-release-audit.service
systemctl status gaoge-release-audit.service --no-pager
```

Expected: service 成功，单次最多删除 3 个，夜间 audit 和每周 report 的下一次时间均可见。

- [ ] **Step 7: 观察一次真实夜间运行**

第二天检查：

```bash
journalctl -u gaoge-release-audit.service --since yesterday --no-pager
gaoge-release-manager audit --target all --json
df -h /
df -i /
```

Expected: 无锁冲突、路径安全或 health 错误；历史目录逐步收敛而非一次清空。

- [ ] **Step 8: 做连续发布容量验收**

在后续正常发布中累计观察至少 10 次 release 创建，确认每根成功版本最终不超过 3，失败版本超过 24 小时后才进入候选，磁盘不会随发布次数线性增长。

---

### Task 11: 实施后知识映射修复与最终验收

**Files:**

- Update proposal: `/Users/snow/Library/Mobile Documents/com~apple~CloudDocs/knowledge-base/20-Projects/高歌数字/shared/高歌数字-生产发布与版本生命周期.md`
- Update proposal: `20-Projects/高歌数字/apps/gaoge/高歌数字主工程-源码与知识映射.md`
- Update proposal: `20-Projects/高歌数字/apps/gaoge-compass/高歌跨境电商 ERP 系统-源码与知识映射.md`
- Update proposal: `20-Projects/高歌数字/apps/gaoge-crm/高歌客户 CRM-源码与知识映射.md`
- Update proposal: `20-Projects/高歌数字/apps/gaoge-finance-news/辽宁财经资讯网-源码与知识映射.md`
- Full-rescan proposal: `20-Projects/高歌数字/apps/gaoge-club/` 语义主节点、源码映射和必要运行配置
- Update proposal: `30-Topics/GitHub Actions 自动部署/patterns/Release 目录生命周期与磁盘门禁模式.md`

**Interfaces:**

- Consumes: 所有仓库最终提交、服务器验证时点和 timer 运行证据
- Produces: 能按 workflow/infra 变更路径定位的知识映射，以及从 medium 到 high 的已验证事实

- [ ] **Step 1: 收集最终源码快照**

对 5 个仓库记录 `main` 分支、最终提交、干净状态和实际变更路径。根据已完成的影响检查固定分类：`gaoge` 为 `full-rescan`（新增 spec、`ops/release-manager/**` 和 workflow 路径未匹配），`gaoge-compass` 为 `incremental`，`gaoge-club` 为 `full-rescan`（缺少 source map），`gaoge-crm` 为 `full-rescan`（workflow 路径未匹配），`gaoge-finance-news` 为 `full-rescan`（`infra/deploy` 路径未匹配）。

- [ ] **Step 2: 使用 `kb-maintainer` 提出精确更新**

提案必须把已实施 workflow、服务器配置、timer 首次成功、保留数量和剩余不确定性分开，并逐个给出 Guides 分类。预期：`高歌数字导览` 为 `guide-no-op`，产品线路线图为 `guide-no-op`；若 Finance 已正式上线，再单独评估导览和路线图状态。

- [ ] **Step 3: 获确认后更新 Projects → Topics → Guides**

把共享生命周期页的目标规则改为已实施事实并提升 `confidence: high`；更新 `last_verified`。各源码映射增加 `.github/workflows/deploy-*.yml`、`ops/release-manager/**` 或 `infra/deploy/**` 的精确行，不只刷新 commit。

- [ ] **Step 4: 运行知识库门禁**

Run: `node scripts/validate-knowledge-base.mjs --kb-root .`

Run: `node scripts/retrieval-readiness.mjs --kb-root .`

Run: `node scripts/audit-knowledge-base.mjs --kb-root .`

Run: `git diff --check`

Expected: validator/retrieval/audit 全部 `ok: true`，无 dangling、orphan、privacy warning。

- [ ] **Step 5: 最终跨仓库验证**

在各仓库运行本计划对应测试、lint、typecheck；线上运行全 target audit、Nginx 配置检查、两个 PM2 home、全部 HTTPS health、`df -h` 和 `df -i`。

Expected: 所有验证通过，timer active，当前服务和回滚版本都受保护。

---

## Final Rollback Procedure

若统一管理器本身出现异常，但线上应用健康：

```bash
systemctl disable --now gaoge-release-audit.timer
systemctl stop gaoge-release-audit.service || true
```

随后让各 workflow 暂时跳过 post-health mark/prune，但保留应用原有 rollback。只有确认管理器误报且人工核对磁盘安全时才临时绕过 preflight。不要删除 `/etc/gaoge/release-roots.conf`、release 目录或 current/previous；修复后先运行 `audit` 和 `plan`，再重新启用 timer。

若主 API 新版本故障，先执行：

```bash
gaoge-release-manager rollback --target gaoge-api
cd /var/www/gaoge/api/current
sudo -u deploy env HOME=/home/deploy PM2_HOME=/home/deploy/.pm2 pm2 delete gaoge-api >/dev/null 2>&1 || true
sudo -u deploy env HOME=/home/deploy PM2_HOME=/home/deploy/.pm2 pm2 start ecosystem.config.cjs --only gaoge-api --update-env
curl -fsS https://api.gaoge.cc/health >/dev/null
```

Compass、Club、CRM 使用各自固定 target ID 和本计划 Tasks 5-7 的明确 PM2 命令；静态站点只执行对应 target rollback 并验证 HTTPS。数据库不执行自动向下 migration。
