# Admin RBAC 工程底座实施与验证记录

- 日期：2026-08-26
- 状态：主体、回归修复及 2026-08-27 图标语义一致性已完成
- 当前基线：`gaoge/main` 当前分支（最终提交以 `git log` 为准）
- 对应设计：[Admin RBAC 工程底座总设计](../specs/2026-08-26-admin-rbac-foundation-design.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement section 10 task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保留服务端菜单唯一事实源和隔离数据库的前提下，恢复本地业务数据与默认图标，收敛 Admin 路由初始化失败，并让菜单结构与资源目录使用一致的业务图标语义。

**Architecture:** API 注册表继续定义内置菜单创建默认值，用一次性 Prisma migration 修复既有空图标；Admin 用统一失败收口函数把 route/menu store 写入 fail-closed 终态。资源目录使用受控前端语义映射，并通过测试锁定与服务端内置菜单默认值的一致性；历史业务数据通过临时、显式双数据库恢复脚本事务迁入 `gaoge_dev`，不向运行时代码加入旧库兼容路径。

**Tech Stack:** PostgreSQL、Prisma 5、NestJS/Jest、Vue 3、Pinia、Vue Router、Node test runner、pnpm。

## Global Constraints

- 数据库 `Menu` 仍是运行时业务菜单的唯一事实源，不恢复前端静态业务菜单 fallback。
- 普通内置同步不得覆盖数据库拥有的标题、图标、排序、状态和显隐。
- 旧 `gaoge_db` 全程只读；`gaoge_dev` 写入必须先预检并在一个事务内完成。
- 不迁移旧 RBAC、`_prisma_migrations` 或 `RefreshToken`，不把数据库地址和凭据写入仓库。
- 只修改本任务文件；现有无关工作区改动不得暂存、格式化或提交。
- 完成所有验证后创建一个语义化功能提交，并把最终结果回写本总记录。

本文合并记录 2026-08-26 RBAC Resource 迁入、目标项目菜单修复、内置数据精确同步、权限工作区对齐、服务端驱动导航及两轮复验。它是故障排查、复验和后续底座同步的一次性实施入口，不再保留多个阶段性 implementation plan。

## 1. 实施结果摘要

- Prisma 新增 `Resource`、`MenuResource`、`AuditEvent` 及兼容关系，保留旧列和 `MenuPermission` 双写。
- API 建立 Resource-aware 有效权限解析、系统写入事务/并发保护、审计、access catalog 和授权导航。
- 内置同步从只 upsert 调整为当前项目注册表精确同步，并保护自定义依赖。
- Admin 使用服务端导航树和受控组件注册表，不再维护第二份业务菜单展示元数据。
- 菜单与资源合并为同页工作区；角色权限采用 Resource 树；补齐审计、图标、代码颜色和清空图标交互。
- 菜单图标继续由服务端 `Menu.icon` 提供，资源目录通过 Admin 受控语义映射展示；相同业务语义一致，不同信息层级不机械复用。
- 最终内置数据为 2 个 Role、13 个 Resource、57 个 Permission、17 个 Menu。

## 2. 关键提交

| 提交                            | 作用                                               |
| ------------------------------- | -------------------------------------------------- |
| `c55299f`                       | 引入 Resource RBAC 基础                            |
| `15fca9c`、`5319740`、`352d1b5` | 服务端导航、受控注册与初始化安全                   |
| `118c373`、`915824c`            | 移除前端重复业务菜单元数据并完成清理               |
| `c7eede9`、`398ce55`            | 修复 route registry 运行时契约与自定义角色权限加载 |
| `e39e1c9`                       | Admin 业务接口使用精确 Resource Permission         |
| `9d57d77`、`507827e`            | 既有树迁移和内置结构字段保护                       |
| `84c98eb`、`1afb576`            | route-name parity 与权限 metadata 回归             |
| `cce7884`、`c97d8e7`            | 支持清空图标并保护显式用户角色                     |
| `d80851f`、`307c31a`            | 完成菜单 payload 空图标语义和复验记录              |

阶段性工作中还完成了目标项目足球菜单、Compass/历史内置数据回收、同页工作区、Resource 空说明、图标规范化和身份编码颜色修复；最终行为均以总设计和当前源码为准。

## 3. 迁移与数据演练

### 3.1 Resource migration

- 空库路径、既有合法数据路径和非法预检路径均已演练。
- 预检覆盖非法 code、view 依赖、legacy 列一致性、module 冲突、目录关联等风险。
- `Permission.module/resource` 与 `MenuPermission` 继续兼容双写，未执行收缩迁移。

### 3.2 导航 migration

- 在不运行 seed 的既有合法树上补建 `sports`、`systemManagement` 两个 group。
- 四个业务 catalog 精确重挂到新 group。
- migration 仅修改结构字段，保留既有 title、icon、sort、status、visible 和 `updatedAt`。

### 3.3 本地数据隔离

排查发现旧本地库混有 Gaoge Compass/ERP migration 和大量其他项目内置 RBAC 数据。未修改旧库，改用当前项目专用本地库，从 27 个本仓 migration 建库并 seed。该经验已固化为规则：不同 Gaoge 项目不得复用同一开发数据库作为 RBAC 事实源。

## 4. 问题、根因与修复

| 现象                   | 根因                                               | 最终处理                                             |
| ---------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| 9000 端口占用          | 已有 Admin Vite 进程仍在运行                       | 精确识别并关闭当前仓库进程，不修改端口               |
| Admin 菜单仍像同步前   | 前端静态菜单与服务端 Menu 双份事实                 | 改为服务端树 + 受控组件注册表                        |
| 高歌体育排序落后       | 配置树按 DB sort，真实导航按前端静态顺序           | 两处统一读取服务端有序树                             |
| 球队等菜单缺失         | 参考底座没有目标项目独有业务页面                   | 在当前项目注册表补齐高歌 FC 四个页面及 Resource 绑定 |
| 混入 Compass 菜单      | 旧库残留其他项目 `isBuiltIn` 数据，旧同步只 upsert | 以当前注册表精确回收过期内置记录                     |
| 图标不显示             | `i-集合:名称` 没有稳定生成 UnoCSS selector         | 在 `FaIcon` 入口规范化并使用 Iconify SVG             |
| 用户/角色代码过浅      | 误用背景语义的 `text-secondary`                    | 改用 `text-muted-foreground`                         |
| 切换菜单/资源改变 URL  | 工作区模式绑定 `route.query.view`                  | 模式改为组件本地状态，兼容路由只重定向               |
| Resource 显示机械说明  | 内置定义自动拼接通用 description                   | 内置默认空说明，保留显式和自定义说明                 |
| 自定义角色读不到权限   | legacy `RolesGuard` 与新 Permission 模型并行       | 移除 Admin 业务角色旁路，统一 Permission Guard       |
| 重复同步追加超级管理员 | legacy `User.role` 覆盖显式 `UserRole`             | 仅对无显式关系的历史用户回填                         |
| 清空菜单图标无效       | Admin 将空输入映射为 `undefined`                   | update 显式发送 `icon: ''`，create 可省略            |
| 登录后业务页面空白     | Vite ESM 源文件命名导入 `.cjs` 页面键常量          | 为共享页面键提供独立 ESM/CJS exports 并锁定同序契约  |

## 5. 主要实现位置

### API 与数据库

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260826090000_add_resource_rbac_foundation/`
- `apps/api/prisma/migrations/20260826120000_add_server_driven_navigation/`
- `apps/api/src/modules/system/rbac/`
- `apps/api/src/modules/system/{resource,menu,permission,role,user,audit,access-catalog}/`
- `apps/api/src/modules/navigation/`
- `apps/api/src/common/audit/`

### Admin 与共享契约

- `packages/shared/types/src/admin-navigation.ts`
- `packages/shared/types/src/admin-page-route-names.ts`
- `packages/shared/types/admin-page-route-names.cjs`
- `apps/admin/src/router/admin-page-registry.ts`
- `apps/admin/src/router/server-navigation.ts`
- `apps/admin/src/store/{route,menu}/`
- `apps/admin/src/views/system/{menu,role,user,audit}/`
- `apps/admin/src/ui/components/FaIcon/`

### 可执行回归

- `apps/api/src/modules/system/rbac/rbac-sync.service.spec.ts`
- `apps/api/src/modules/navigation/navigation.service.spec.ts`
- `apps/api/src/modules/system/menu/system-menu-configuration.service.spec.ts`
- `apps/api/src/common/auth/permissions.guard.spec.ts`
- `apps/admin/tests/server-navigation.test.ts`
- `apps/admin/tests/system-access-workspace.test.ts`
- `apps/admin/tests/system-menu-payload.test.ts`
- `apps/admin/tests/system-rbac-table.test.ts`
- `apps/admin/tests/fa-icon-resolver.test.ts`
- `packages/shared/types/tests/admin-page-route-names.test.cjs`

## 6. 最终自动化验证

### 6.1 数据库与契约

- Prisma validate、generate、migrate status 通过。
- 当前本地库应用 29 个 migration，seed 输出 `roles=2, permissions=57, menus=17`，17 个内置菜单图标均非空。
- Resource migration 三场景和导航既有库 migration drill 通过。
- 共享 route-name CJS、ESM 与 `.d.cts` 同序一致测试 3/3 通过。

### 6.2 API

- API 全量：43 suites / 248 tests，通过。
- 覆盖 Resource/Permission/Menu/Role/User、权限解析、导航、Guard、事务、并发、防锁死、审计和 HTTP 权限矩阵。
- API typecheck 与生产 build 通过。

### 6.3 Admin

- 最终导航回归测试 17/17，通过；共享页面键契约测试 3/3，通过。
- Admin typecheck 与生产 build 通过。
- 任务路径 ESLint、Prettier、Stylelint 和 diff check 通过。
- 全量 `apps/admin/tests/*.test.ts` 为 49/50 通过；唯一失败是任务前既有的 `football-match-round-latest.test.ts` Node 24 extensionless loader 问题，本次聚焦测试全部通过，未扩大范围修复该既有问题。

### 6.4 浏览器与接口

- 管理员导航与配置树均为“高歌体育 → 系统管理”，子树结构与总设计一致。
- 内置菜单展示字段修改刷新后生效，重复同步仍保留。
- 受限角色只显示授权足球页面，直接打开无权路由为 404。
- 无权 `GET /system/users` 及跨 Resource 写请求按全局包络返回应用码 403，允许的球员 GET 返回应用码 0。
- 管理员与受限角色浏览器均无 routeName、重复路由或图标错误；仅保留既有 Vue Router `next()` callback deprecation warning。
- 2026-08-27 隔离端口复验先复现共享 `.cjs` 命名导入错误，修复后管理员可直接打开球员、球队和菜单权限页面，浏览器无新增运行错误。
- 2026-08-27 图标语义复验使用 API `3125`、Admin `9015`：菜单结构 17 个内置节点均渲染真实 SVG，“高歌 FC”与“足球资源”语义一致，资源叶子和微信分享图标正确，菜单/资源切换正常。

## 7. 复验环境

最终高风险复验使用隔离本地数据库和隔离端口，避免干扰日常开发库与已启动进程：

- Round 1：API `3122`、Admin `9012`
- Round 2：API `3123`、Admin `9013`
- Regression smoke：API `3124`、Admin `9014`
- Icon semantics smoke：API `3125`、Admin `9015`

复验结束后均关闭隔离进程。日常本地运行仍使用项目约定的 3000/9000；端口冲突时应关闭旧进程，不以永久改端口掩盖重复启动。

## 8. 后续项目一次同步清单

1. Discover：确认目标仓库、分支、工作区、数据库和 Admin/API 版本。
2. Snapshot：读取目标仓内置注册表、migration 历史、共享 route-name 和前端页面注册现状。
3. Classify：将机制分为可直接同步、需目标项目适配、禁止复制三类。
4. Adapt：先定义目标项目 Resource/Permission 与业务菜单，再补注册表和组件映射。
5. Migrate：在隔离数据库演练空库、既有库和非法数据；不得连接其他项目开发库代替演练。
6. Reconcile：运行精确内置同步，确认自定义依赖阻断与展示字段保留。
7. Verify：执行权限矩阵、导航/配置树顺序、fail-closed、管理员/受限浏览器和直接 API 验收。
8. Record：更新目标仓总设计/实施记录和知识库 CURRENT，不复制本仓业务树作为模板数据。

## 9. 当前维护结论

- 当前实现基线以包含本文的 `fix(rbac): recover server navigation regressions` 提交和总设计为准。
- 后续功能调整应直接更新总设计与本实施记录，避免按每次回归再创建同主题独立 spec。
- 旧阶段性文档只保留历史背景或替代提示；跨仓同步优先读取总设计第 11 节和本记录第 8 节。

## 10. 2026-08-27 回归修复实施计划

### Task 1: 恢复服务端内置菜单默认图标

**Files:**

- Modify: `apps/api/src/modules/system/rbac/builtins.ts`
- Modify: `apps/api/src/modules/system/rbac/rbac-sync.service.spec.ts`
- Create: `apps/api/prisma/migrations/20260827090000_restore_builtin_menu_icons/migration.sql`

**Interfaces:**

- Consumes: `BuiltInMenuDefinition.icon?: string` 和 `RbacSyncService.syncBuiltIns()` 现有字段所有权规则。
- Produces: `sports -> solar:cup-star-outline`、`systemManagement -> ri:settings-3-line`、`sportsContent -> ri:article-line` 三个创建默认值；既有数据库只回填对应内置节点的空图标。

- [x] **Step 1: 写入会失败的注册表回归断言**

  在 `rbac-sync.service.spec.ts` 的首次成功同步用例中，从 `prisma.menu.upsert.mock.calls` 按 `where.routeName` 查找三个调用，断言 `create.icon` 分别为上述三个值，同时断言 `update` 不含 `icon`：

  ```ts
  const menuUpsertFor = (routeName: string) =>
    prisma.menu.upsert.mock.calls.find(([input]) => input.where.routeName === routeName)?.[0]

  expect(menuUpsertFor('sports')?.create.icon).toBe('solar:cup-star-outline')
  expect(menuUpsertFor('systemManagement')?.create.icon).toBe('ri:settings-3-line')
  expect(menuUpsertFor('sportsContent')?.create.icon).toBe('ri:article-line')
  expect(menuUpsertFor('sports')?.update).not.toHaveProperty('icon')
  ```

- [x] **Step 2: 运行测试并确认默认值缺失**

  Run: `pnpm --filter @gaoge/app-api test -- rbac-sync.service.spec.ts --runInBand`

  Expected: FAIL，三个 `create.icon` 断言中至少 `sports`、`systemManagement`、`sportsContent` 为 `undefined`。

- [x] **Step 3: 补齐注册表并新增精确回填 migration**

  在三个定义上添加 `icon`。migration 使用单条受限更新，不修改非空值或自定义菜单：

  ```sql
  UPDATE "Menu"
  SET
    "icon" = CASE "routeName"
      WHEN 'sports' THEN 'solar:cup-star-outline'
      WHEN 'systemManagement' THEN 'ri:settings-3-line'
      WHEN 'sportsContent' THEN 'ri:article-line'
    END,
    "updatedAt" = CURRENT_TIMESTAMP
  WHERE "isBuiltIn" = true
    AND "icon" IS NULL
    AND "routeName" IN ('sports', 'systemManagement', 'sportsContent');
  ```

- [x] **Step 4: 验证注册表与 migration**

  Run: `pnpm --filter @gaoge/app-api test -- rbac-sync.service.spec.ts --runInBand`

  Expected: PASS，并确认 upsert `update` 仍不含 `icon`。

  Run: `pnpm --filter @gaoge/app-api exec prisma validate`

  Expected: `The schema ... is valid`。

### Task 2: 收敛 Admin 路由初始化失败状态

**Files:**

- Modify: `apps/admin/src/router/server-navigation-guard.ts`
- Modify: `apps/admin/src/router/guards.ts`
- Modify: `apps/admin/tests/server-navigation.test.ts`

**Interfaces:**

- Produces: `finalizeServerNavigationFailure({ isGenerated, setRoutes, setMenus }): boolean`；未进入终态时按 routes 后 menus 的顺序写入空数组并返回 `true`，已有终态时不重复写入并返回 `false`。
- Consumes: `routeStore.generateRoutesFromServer([])` 会令 `isGenerate = true`；`menuStore.setServerMenus([])` 会清空服务端菜单。

- [x] **Step 1: 写入失败终态测试**

  在 `server-navigation.test.ts` 导入 `finalizeServerNavigationFailure`，新增两个纯函数行为测试：一个验证前置失败写入空终态，另一个验证已有终态不会重复写入。

  ```ts
  test('finalizes a pre-navigation backend failure with empty generated state', () => {
    const calls: Array<{ kind: 'routes' | 'menus'; value: unknown[] }> = []

    finalizeServerNavigationFailure({
      isGenerated: false,
      setRoutes: (routes) => calls.push({ kind: 'routes', value: routes }),
      setMenus: (menus) => calls.push({ kind: 'menus', value: menus }),
    })

    assert.deepEqual(calls, [
      { kind: 'routes', value: [] },
      { kind: 'menus', value: [] },
    ])
  })
  ```

- [x] **Step 2: 运行测试并确认导出不存在**

  Run: `node --test apps/admin/tests/server-navigation.test.ts`

  Expected: FAIL，提示 `finalizeServerNavigationFailure` 未导出或源码断言不匹配。

- [x] **Step 3: 实现统一失败收口并接入守卫**

  在 `server-navigation-guard.ts` 增加：

  ```ts
  interface ServerNavigationFailureDependencies {
    isGenerated: boolean
    setMenus: (menus: Menu.recordMainRaw[]) => void
    setRoutes: (routes: Route.recordMainRaw[]) => void
  }

  export function finalizeServerNavigationFailure({
    isGenerated,
    setMenus,
    setRoutes,
  }: ServerNavigationFailureDependencies) {
    if (isGenerated) {
      return false
    }
    setRoutes([])
    setMenus([])
    return true
  }
  ```

  `initializeServerNavigation()` 的 catch 改为调用该函数后重新抛错。`guards.ts` 的外层 catch 在 backend 模式且尚未生成路由时调用同一函数，随后通过 `ElMessage.error('菜单初始化失败，请刷新页面或重新登录。')` 提示；导航请求自身已经完成失败收口时不重复写入状态。

- [x] **Step 4: 验证成功、导航失败和权限前置失败三条路径**

  Run: `node --test apps/admin/tests/server-navigation.test.ts`

  Expected: PASS；既有成功共享结果测试和 fetch/resolve fail-closed 测试继续通过，新测试证明权限前置失败可写入终态。

  Run: `pnpm --filter @gaoge/app-admin typecheck`

  Expected: PASS。

### Task 3: 事务恢复本地业务数据

**Files:**

- Temporarily create, execute, then remove: `apps/api/prisma/.recover-local-business-data.ts`
- Modify after verification: `docs/superpowers/plans/2026-08-26-admin-rbac-foundation-implementation.md`

**Interfaces:**

- Consumes: 仅在命令环境中提供的 `SOURCE_DATABASE_URL`、`TARGET_DATABASE_URL` 和显式 `APPLY_RECOVERY=1`。
- Produces: `gaoge_dev` 中恢复的普通用户与 10 张业务表数据；不产生仓库运行时接口。

- [x] **Step 1: 停止并确认当前仓库本地进程**

  使用 `ps -Ao pid=,command=` 和 `lsof -nP -iTCP:3000 -sTCP:LISTEN`、`lsof -nP -iTCP:9000 -sTCP:LISTEN` 精确确认 PID 及工作目录，只停止当前仓库 API/Admin 进程。再次运行两条 `lsof`，Expected: 3000、9000 均无监听。

- [x] **Step 2: 创建默认 dry-run 的临时恢复脚本**

  脚本创建两个 `PrismaClient`，先读取源库快照；目标库预检以下业务模型计数全部为 0：`team`、`player`、`playerTeam`、`matchRound`、`matchRoundResult`、`footballAssetRecord`、`teamFund`、`banner`、`rumorPost`、`wechatShareConfig`。目标已有用户允许保留，但源库除相同 ID 外的用户不得与目标 `account/openid/unionid/phone` 冲突。

  dry-run 输出逐表源数量、目标数量、待迁用户 ID 和冲突结果；仅当 `APPLY_RECOVERY === '1'` 时进入写事务，否则以 0 退出且不写数据。

- [x] **Step 3: 在一个目标事务中按依赖顺序写入**

  使用 `target.$transaction(async (tx) => { ... }, { timeout: 120_000 })`，顺序必须为：

  ```text
  User（排除目标已有 ID）
  Team
  Player
  PlayerTeam
  MatchRound
  MatchRoundResult
  FootballAssetRecord
  TeamFund
  Banner
  RumorPost / MessageBoardPost
  WechatShareConfig
  ```

  每个模型使用 `createMany({ data })` 保留原 ID 和时间。事务内重新 count，并对 `Player.userId`、`Player.primaryTeamId`、`PlayerTeam`、`MatchRoundResult` 做孤儿关联计数；任一数量或关联断言失败时 throw 回滚。

- [x] **Step 4: 重置自增 sequence 并执行 dry-run**

  在同一事务内对 `User`、`Team`、`Player`、`MatchRound`、`MatchRoundResult`、`FootballAssetRecord`、`TeamFund`、`Banner`、`MessageBoardPost` 执行等价操作：

  ```sql
  SELECT setval(
    pg_get_serial_sequence('"Player"', 'id'),
    COALESCE((SELECT MAX("id") FROM "Player"), 1),
    EXISTS (SELECT 1 FROM "Player")
  );
  ```

  先只提供 URL 运行 dry-run。Expected: 目标业务表仍为空，输出与设计记录的源计数一致，无非预期用户冲突。

- [x] **Step 5: 显式执行恢复并做数据库后验检查**

  仅在 dry-run 通过后设置 `APPLY_RECOVERY=1` 再运行一次。Expected: 单事务提交，业务表数量与源库一致；目标 admin 与当前 RBAC 数量不变；`RefreshToken` 未从源库复制。

  Run: `pnpm --filter @gaoge/app-api exec prisma migrate status`

  Expected: 只有 Task 1 新增的图标 migration 尚待 Task 4 应用，不存在其他意外 pending migration。

- [x] **Step 6: 删除临时脚本并记录非敏感结果**

  用补丁删除 `.recover-local-business-data.ts`，确认 `git status --short` 不包含该文件。在本节后新增实际逐表数量、后验检查和执行日期，但不得记录 URL、用户名、密码或 token。

#### 数据恢复执行结果

2026-08-27 在停止当前仓库 3000/9000 开发进程及一个已卡住的 Prisma migration 进程后完成恢复。dry-run 证明目标业务表为空、待迁普通用户仅为 ID 8 和 9，且不存在唯一字段冲突；随后单事务写入并在事务内通过数量、孤儿关系、sequence 和 RBAC 不变断言。

| 数据                           | 恢复后数量 |
| ------------------------------ | ---------- |
| User                           | 3          |
| Team / Player                  | 3 / 39     |
| PlayerTeam                     | 40         |
| MatchRound/Result              | 14 / 42    |
| FootballAssetRecord / TeamFund | 37 / 0     |
| Banner / MessageBoardPost      | 5 / 0      |
| WechatShareConfig              | 1          |

目标库 Role/Resource/Permission/Menu 保持 `2 / 13 / 57 / 17`；目标原有 1 条 RefreshToken 保留，源库 RefreshToken 未迁入。临时脚本执行后已删除，仓库中不保留数据库地址、凭据或旧库运行时兼容逻辑。

### Task 4: 全量验证、知识同步与最终提交

**Files:**

- Modify: `docs/superpowers/specs/2026-08-26-admin-rbac-foundation-design.md`
- Modify: `docs/superpowers/plans/2026-08-26-admin-rbac-foundation-implementation.md`
- Modify if stable convention changed: `docs/conventions/admin-navigation.md`
- Modify: `packages/shared/types/package.json`
- Modify: `packages/shared/types/src/admin-navigation.ts`
- Create: `packages/shared/types/src/admin-page-route-names.ts`
- Modify: `packages/shared/types/tests/admin-page-route-names-contract.test.mjs`
- Knowledge candidate only if required by repository rule: current Markdown knowledge base through `kb-maintainer`

**Interfaces:**

- Consumes: Task 1–3 的代码、migration 与本地数据结果。
- Produces: 可复验的最终记录、必要的长期知识候选和一个不含无关改动的 Git 提交。

- [x] **Step 1: 应用 migration、生成客户端并同步内置数据**

  在 `gaoge_dev` 上运行 Prisma deploy/generate 和现有 seed/sync 入口。Expected: 新 migration 应用成功，三个目标菜单图标非空，Role/Resource/Permission/Menu 数量仍为当前注册表数量，重复同步不改变管理员拥有的非空展示字段。

- [x] **Step 2: 运行聚焦与全量自动化验证**

  Run:

  ```bash
  pnpm --filter @gaoge/app-api test -- rbac-sync.service.spec.ts --runInBand
  node --test apps/admin/tests/server-navigation.test.ts
  pnpm --filter @gaoge/app-api typecheck
  pnpm --filter @gaoge/app-admin typecheck
  pnpm --filter @gaoge/app-api test --runInBand
  pnpm --filter @gaoge/app-api build
  pnpm --filter @gaoge/app-admin build
  pnpm exec prettier --check apps/api/src/modules/system/rbac/builtins.ts apps/api/src/modules/system/rbac/rbac-sync.service.spec.ts apps/admin/src/router/server-navigation-guard.ts apps/admin/src/router/guards.ts apps/admin/tests/server-navigation.test.ts docs/superpowers/specs/2026-08-26-admin-rbac-foundation-design.md docs/superpowers/plans/2026-08-26-admin-rbac-foundation-implementation.md
  git diff --check
  ```

  Expected: 全部通过；如全量 Admin 测试仍命中已记录的 Node 24 extensionless loader 既有问题，必须单独复跑本次聚焦测试并在记录中如实说明，不能把既有失败写成通过。

- [x] **Step 3: 使用隔离端口完成接口与浏览器 smoke test**

  隔离 API/Admin 使用 3124/9014，不占用 3000/9000。管理员登录后确认服务端菜单和三个目标图标可见，菜单树保持“高歌体育 → 系统管理”，球员页面显示恢复数据，球队页面显示 3 支球队。首次点击业务页复现并定位共享 `.cjs` 命名导入错误；修复 ESM/CJS 条件入口后直接路由和菜单点击均正常，无新增浏览器错误。权限前置失败、导航请求失败和导航解析失败由 17/17 聚焦测试覆盖，均收敛空终态，不恢复静态越权菜单。

- [x] **Step 4: 回写总文档与知识候选**

  总设计、实施记录与 `docs/conventions/admin-navigation.md` 已回写真实测试数量、migration 状态、共享 ESM/CJS 页面键修复和 smoke 结果。经知识候选检查，使用已获用户确认的 `kb-maintainer` sync 模式，仅更新正式知识页 `高歌数字-RBAC 工程底座同步.md`；导览及其他项目页职责未变化，不做连带修改。

- [x] **Step 5: 仅提交任务文件**

  先用 `git status --short` 和 `git diff --cached --name-only` 核对范围，排除用户原有的 auto-import 与跨项目发布文档改动。提交信息：

  ```bash
  git commit -m "fix(rbac): recover server navigation regressions"
  ```

  提交后重新运行 `git status --short`，Expected: 仅保留用户原有无关改动；最终 hash 以 Git history 中上述提交为准。最终 smoke 使用的 3124/9014 以及日常 3000/9000 均无监听。

## 11. 2026-08-27 菜单与资源图标语义一致性实施计划

### Task 5: 补齐服务端内置菜单语义图标

**Files:**

- Modify: `apps/api/src/modules/system/rbac/builtins.ts`
- Modify: `apps/api/src/modules/system/rbac/rbac-sync.service.spec.ts`
- Create: `apps/api/prisma/migrations/20260827150000_align_builtin_menu_icons/migration.sql`

**Interfaces:**

- Consumes: `BuiltInMenuDefinition.icon?: string` 和 `RbacSyncService.syncBuiltIns()` 既有字段所有权规则。
- Produces: 11 个内置叶子菜单的创建默认图标，以及仅回填这些内置菜单空值的一次性 migration；普通同步的 `update` payload 仍不包含 `icon`。

- [x] **Step 1: 补齐服务端叶子菜单默认图标**

  按总设计语义映射一次性补齐 11 个内置叶子 `BuiltInMenuDefinition.icon`；遵循用户确认的非 TDD 执行方式，先完成整体实现，再统一验证。

- [x] **Step 2: 扩展同步回归断言**

  将现有默认图标断言扩展为完整语义映射：

  ```ts
  const expectedMenuIcons = [
    ['sports', 'solar:cup-star-outline'],
    ['sportsFootball', 'proicons:soccer'],
    ['sportsContent', 'ri:article-line'],
    ['systemManagement', 'ri:settings-3-line'],
    ['system', 'ri:settings-3-line'],
    ['wechat', 'ri:wechat-2-line'],
    ['player', 'ri:user-star-line'],
    ['team', 'ri:team-line'],
    ['matchRound', 'ri:calendar-event-line'],
    ['assetRecord', 'ri:wallet-3-line'],
    ['contentBanner', 'ri:slideshow-3-line'],
    ['contentRumorPost', 'ri:message-3-line'],
    ['systemUser', 'ri:user-line'],
    ['systemRole', 'ri:shield-user-line'],
    ['systemMenu', 'ri:menu-line'],
    ['systemAudit', 'ri:file-search-line'],
    ['wechatShare', 'ri:share-line'],
  ] as const

  for (const [routeName, icon] of expectedMenuIcons) {
    const menuUpsert = prisma.menu.upsert.mock.calls.find(
      ([input]: any[]) => input.where.routeName === routeName,
    )?.[0]
    expect(menuUpsert?.create.icon).toBe(icon)
    expect(menuUpsert?.update).not.toHaveProperty('icon')
  }
  ```

- [x] **Step 3: 添加精确 migration**

  新增 migration：

  ```sql
  UPDATE "Menu"
  SET
    "icon" = CASE "routeName"
      WHEN 'player' THEN 'ri:user-star-line'
      WHEN 'team' THEN 'ri:team-line'
      WHEN 'matchRound' THEN 'ri:calendar-event-line'
      WHEN 'assetRecord' THEN 'ri:wallet-3-line'
      WHEN 'contentBanner' THEN 'ri:slideshow-3-line'
      WHEN 'contentRumorPost' THEN 'ri:message-3-line'
      WHEN 'systemUser' THEN 'ri:user-line'
      WHEN 'systemRole' THEN 'ri:shield-user-line'
      WHEN 'systemMenu' THEN 'ri:menu-line'
      WHEN 'systemAudit' THEN 'ri:file-search-line'
      WHEN 'wechatShare' THEN 'ri:share-line'
    END,
    "updatedAt" = CURRENT_TIMESTAMP
  WHERE "isBuiltIn" = true
    AND "icon" IS NULL
    AND "routeName" IN (
      'player',
      'team',
      'matchRound',
      'assetRecord',
      'contentBanner',
      'contentRumorPost',
      'systemUser',
      'systemRole',
      'systemMenu',
      'systemAudit',
      'wechatShare'
    );
  ```

- [x] **Step 4: 统一验证默认值、字段所有权和 migration 范围**

  Run:

  ```bash
  pnpm --filter @gaoge/app-api test -- rbac-sync.service.spec.ts --runInBand
  pnpm --filter @gaoge/app-api exec prisma validate
  pnpm exec prettier --check apps/api/src/modules/system/rbac/builtins.ts apps/api/src/modules/system/rbac/rbac-sync.service.spec.ts
  git diff --check
  ```

  实际结果：聚焦测试 8/8、Prisma validate、ESLint 和 diff check 通过；所有 `update` payload 不含 `icon`。SQL 不交给未配置 parser 的 Prettier，改由 Task 7 的真实 `migrate deploy` 和数据库查询验证。

### Task 6: 对齐资源目录语义图标

**Files:**

- Modify: `apps/admin/src/views/system/components/system-resource-groups.ts`
- Modify: `apps/admin/tests/system-access-workspace.test.ts`

**Interfaces:**

- Consumes: `getSystemResourceModuleIcon(code: string): string` 与 `getSystemResourceIcon(key: string): string`。
- Produces: `football -> i-proicons:soccer`、`system.wechat-share -> i-ri:share-line`，并保持未知模块和未知 Resource 的现有 fallback。

- [x] **Step 1: 修改受控图标映射**

  将 `moduleIcons.football` 改为 `i-proicons:soccer`，并在 `resourceIcons` 增加：

  ```ts
  'system.wechat-share': 'i-ri:share-line',
  ```

  其余映射、分组顺序和树构建逻辑保持不变。

- [x] **Step 2: 写入语义映射与 fallback 回归测试**

  在 `system-access-workspace.test.ts` 导入两个图标解析函数并新增：

  ```ts
  test('resource tree icons match menu semantics and retain safe fallbacks', () => {
    assert.equal(getSystemResourceModuleIcon('football'), 'i-proicons:soccer')
    assert.equal(getSystemResourceModuleIcon('content'), 'i-ri:article-line')
    assert.equal(getSystemResourceModuleIcon('system'), 'i-ri:settings-3-line')
    assert.equal(getSystemResourceModuleIcon('custom'), 'i-ri:folder-3-line')

    assert.equal(getSystemResourceIcon('football.player'), 'i-ri:user-star-line')
    assert.equal(getSystemResourceIcon('system.menu'), 'i-ri:menu-line')
    assert.equal(getSystemResourceIcon('system.permission'), 'i-ri:key-2-line')
    assert.equal(getSystemResourceIcon('system.wechat-share'), 'i-ri:share-line')
    assert.equal(getSystemResourceIcon('custom.unknown'), 'i-ri:stack-line')
  })
  ```

- [x] **Step 3: 统一验证资源目录映射**

  Run:

  ```bash
  pnpm --filter @gaoge/app-admin exec node --test --experimental-strip-types tests/system-access-workspace.test.ts
  pnpm exec prettier --check apps/admin/src/views/system/components/system-resource-groups.ts apps/admin/tests/system-access-workspace.test.ts
  git diff --check
  ```

  实际结果：工作区单文件 5/5，通过；与导航和 `FaIcon` 合并聚焦运行 24/24，通过；已知语义映射和未知项 fallback 均被锁定。

### Task 7: 应用迁移并完成整体验收

**Files:**

- Modify: `docs/superpowers/plans/2026-08-26-admin-rbac-foundation-implementation.md`
- Modify if promoted by knowledge-candidate review: canonical RBAC knowledge page selected by `kb-maintainer`

**Interfaces:**

- Consumes: Task 5 的服务端默认图标和 migration、Task 6 的资源目录受控映射。
- Produces: 已迁移本地数据库、自动化和浏览器证据、更新后的实施记录与单个语义化功能提交。

- [x] **Step 1: 应用 migration、生成 Prisma Client 并同步内置数据**

  Run:

  ```bash
  pnpm --filter @gaoge/app-api exec prisma migrate deploy
  pnpm --filter @gaoge/app-api db:generate
  pnpm --filter @gaoge/app-api db:seed
  pnpm --filter @gaoge/app-api exec prisma migrate status
  ```

  实际结果：本地 `gaoge_dev` 已应用 29/29 migrations，seed 输出 `roles=2, permissions=57, menus=17`；只读查询确认 17 个内置菜单图标全部非空。同步测试确认普通 `update` payload 不包含 `icon`。

- [x] **Step 2: 运行聚焦与全量自动化验证**

  Run:

  ```bash
  pnpm --filter @gaoge/app-api test -- rbac-sync.service.spec.ts --runInBand
  pnpm --filter @gaoge/app-admin exec node --test --experimental-strip-types tests/system-access-workspace.test.ts tests/fa-icon-resolver.test.ts tests/server-navigation.test.ts
  pnpm --filter @gaoge/app-api typecheck
  pnpm --filter @gaoge/app-admin typecheck
  pnpm --filter @gaoge/app-api build
  pnpm --filter @gaoge/app-admin build
  pnpm --filter @gaoge/app-api test --runInBand
  node --test --experimental-strip-types 'apps/admin/tests/*.test.ts'
  pnpm exec prettier --check apps/api/src/modules/system/rbac/builtins.ts apps/api/src/modules/system/rbac/rbac-sync.service.spec.ts apps/admin/src/views/system/components/system-resource-groups.ts apps/admin/tests/system-access-workspace.test.ts docs/superpowers/specs/2026-08-26-admin-rbac-foundation-design.md docs/superpowers/plans/2026-08-26-admin-rbac-foundation-implementation.md
  git diff --check
  ```

  实际结果：API 全量 43 suites / 248 tests、API 聚焦 8/8、Admin 聚焦 24/24、API/Admin typecheck 与 production build 均通过。Admin 全量新增本次断言后为 49/50，通过项较原基线增加 1；唯一失败仍是已记录的 `football-match-round-latest.test.ts` Node 24 extensionless import，与本次修改无关。

- [x] **Step 3: 使用隔离端口完成浏览器 smoke test**

  使用 API `3125`、Admin `9015` 启动当前工作区并以管理员登录。菜单结构 17 个内置节点均渲染真实 Iconify SVG；“高歌 FC”和“足球资源”均使用 `proicons` 足球图标，微信分享与各叶子业务节点均显示对应 `ri` 语义图标；菜单/资源切换正常。控制台无新增图标或导航错误，仅保留既有 Vue Router `next()` deprecation warning。验收后已关闭 3125/9015，未影响用户已有的 9000 进程。

- [x] **Step 4: 回写实施结果并执行知识候选检查**

  将实际 migration、测试数量、已知非任务失败和浏览器结果回写本节。按知识库维护规则检查“菜单图标服务端事实源 + Resource 受控语义映射 + 同语义一致而非层级机械一致”是否应合并到现有 RBAC 底座知识；只有确认是稳定跨项目规则时才通过 `kb-maintainer` 更新 canonical 页面。

  实际结果：已更新知识库 canonical 页面“高歌 RBAC 工程底座同步”和“高歌数字主工程源码与知识映射”，记录服务端菜单图标所有权、Resource 展示映射、跨层级语义边界、29 条 migration、API 248/248、Admin 49/50 和浏览器证据；高歌数字导览已有入口且阅读路径未变化，判定为 `guide-no-op`。知识库 validate、audit、retrieval readiness（18/18）和 diff check 均通过；审计中的 4 个过期复核与 1 个孤立工作日志为既有非任务警告。

- [x] **Step 5: 整理为单个功能提交**

  使用 `git status --short`、`git diff --check` 和 `git diff --cached --name-only` 核对只包含本节任务文件。若实施过程中产生临时 checkpoint，在尚未推送的当前分支上整理为一个语义化提交：

  ```bash
  git commit -m "fix(rbac): align menu and resource icons"
  ```

  Expected: 工作区干净；不推送远程，不改写已推送历史，不删除现有 stash。

  实际结果：本轮连续的设计、实施计划和代码实现作为一个 `fix(rbac): align menu and resource icons` 功能提交整理在当前 `main`；不推送远程，不删除现有 stash。
