# Admin RBAC 工程底座实施与验证记录

- 日期：2026-08-26
- 状态：已完成
- 最终基线：`gaoge/main@307c31af7bc5`
- 对应设计：[Admin RBAC 工程底座总设计](../specs/2026-08-26-admin-rbac-foundation-design.md)

本文合并记录 2026-08-26 RBAC Resource 迁入、目标项目菜单修复、内置数据精确同步、权限工作区对齐、服务端驱动导航及两轮复验。它是故障排查、复验和后续底座同步的一次性实施入口，不再保留多个阶段性 implementation plan。

## 1. 实施结果摘要

- Prisma 新增 `Resource`、`MenuResource`、`AuditEvent` 及兼容关系，保留旧列和 `MenuPermission` 双写。
- API 建立 Resource-aware 有效权限解析、系统写入事务/并发保护、审计、access catalog 和授权导航。
- 内置同步从只 upsert 调整为当前项目注册表精确同步，并保护自定义依赖。
- Admin 使用服务端导航树和受控组件注册表，不再维护第二份业务菜单展示元数据。
- 菜单与资源合并为同页工作区；角色权限采用 Resource 树；补齐审计、图标、代码颜色和清空图标交互。
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
- 空库应用 27 个 migration，seed 输出 `roles=2, permissions=57, menus=17`。
- Resource migration 三场景和导航既有库 migration drill 通过。
- 共享 route-name CJS 与 `.d.cts` 同序一致测试 2/2 通过。

### 6.2 API

- API 全量：43 suites / 248 tests，通过。
- 覆盖 Resource/Permission/Menu/Role/User、权限解析、导航、Guard、事务、并发、防锁死、审计和 HTTP 权限矩阵。
- API typecheck 与生产 build 通过。

### 6.3 Admin

- 最终导航/RBAC/工作区/payload 聚焦测试 27/27，通过。
- Admin typecheck 与生产 build 通过。
- 任务路径 ESLint、Prettier、Stylelint 和 diff check 通过。
- 全量 `apps/admin/tests/*.test.ts` 中有一个任务前既有的 `football-match-round-latest.test.ts` Node 24 extensionless loader 问题；本次相关 46 个测试通过，未扩大范围修复该既有问题。

### 6.4 浏览器与接口

- 管理员导航与配置树均为“高歌体育 → 系统管理”，子树结构与总设计一致。
- 内置菜单展示字段修改刷新后生效，重复同步仍保留。
- 受限角色只显示授权足球页面，直接打开无权路由为 404。
- 无权 `GET /system/users` 及跨 Resource 写请求按全局包络返回应用码 403，允许的球员 GET 返回应用码 0。
- 管理员与受限角色浏览器均无 routeName、重复路由或图标错误；仅保留既有 Vue Router `next()` callback deprecation warning。

## 7. 复验环境

最终高风险复验使用隔离本地数据库和隔离端口，避免干扰日常开发库与已启动进程：

- Round 1：API `3122`、Admin `9012`
- Round 2：API `3123`、Admin `9013`

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

- 当前实现基线以 `gaoge/main@307c31af7bc5` 和总设计为准。
- 后续功能调整应直接更新总设计与本实施记录，避免按每次回归再创建同主题独立 spec。
- 旧阶段性文档只保留历史背景或替代提示；跨仓同步优先读取总设计第 11 节和本记录第 8 节。
