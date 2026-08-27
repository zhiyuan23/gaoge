# Admin RBAC 工程底座总设计

- 日期：2026-08-26
- 状态：主体及 2026-08-27 回归修复均已实施并通过验证
- 回归修复实施起点：`gaoge/main@9439b0d`
- 适用范围：`apps/api`、`apps/admin`、`packages/shared/types`、Prisma migration 与相关测试
- 配套记录：[Admin RBAC 工程底座实施与验证记录](../plans/2026-08-26-admin-rbac-foundation-implementation.md)

本文是当前 Gaoge Admin RBAC、Resource 权限模型、服务端导航和权限工作区的唯一总设计入口。2026-08-26 形成的 Resource 迁入、内置数据精确同步、工作区对齐、导航视觉回归和服务端驱动导航文档已经合并到本文；后续排查与跨项目同步应先读本文，不再从阶段性方案拼接最终结构。

## 1. 背景与最终决策

早期 Admin 同时维护前端静态业务菜单和服务端 `Menu` 数据，两者分别决定真实导航与“菜单与权限”树，标题、图标、层级和排序容易漂移。权限模型也只有 `Permission.module/resource/action` 和 `MenuPermission`，不能稳定表达 Resource 生命周期、页面到资源的绑定、有效权限依赖和管理操作审计。

最终采用以下长期结构：

1. 数据库 `Menu` 是业务导航标题、图标、层级、排序、状态和显隐的运行时唯一事实源。
2. 前端通过稳定 `routeName` 和受控组件注册表解析页面，不接受服务端下发任意组件路径。
3. `Resource` 是 Permission 归属事实源；API Guard 继续依据稳定 Permission code 执行授权。
4. 内置 RBAC 注册表是当前项目内置数据的代码事实源，普通同步精确回收不再属于当前项目的内置记录，同时保护自定义数据和管理员维护的展示字段。
5. 菜单配置树、实际导航和权限资源目录读取同一服务端事实，不再维护第二棵业务菜单树。

## 2. 目标与非目标

### 2.1 目标

- 建立 Resource、Permission、Menu、Role、User 和 AuditEvent 的完整管理与运行时闭环。
- 让“菜单与权限”树和真实导航保持相同结构与顺序。
- 让内置同步可恢复当前项目默认结构，又不会覆盖管理员调整的标题、图标、排序、状态和显隐。
- 让自定义角色、受限账号和历史账号在兼容期内得到可解释、可测试的有效权限。
- 为其他 Gaoge Admin 项目提供可复用的同步机制与一次性适配清单。

### 2.2 本次不做

- 不实现租户菜单、组织树、拒绝权限、字段权限、数据范围、权限模板或统一 IAM。
- 不实现远程 Vue 组件、微前端、在线页面搭建或任意组件路径加载。
- 不把菜单显隐当作 API 授权，也不允许前端身份字段绕过 Permission Guard。
- 不删除兼容期仍有真实调用方的旧列、旧关系或兼容路由。
- 不复制其他项目的业务菜单树、路由键、Resource 绑定、品牌、租户和部署配置。

## 3. 权威数据与职责边界

| 事实                                        | 权威位置                                       | 说明                                       |
| ------------------------------------------- | ---------------------------------------------- | ------------------------------------------ |
| 内置 Role/Resource/Permission/Menu 默认结构 | `apps/api/src/modules/system/rbac/builtins.ts` | 当前项目版本化注册表                       |
| 运行时菜单展示与顺序                        | 数据库 `Menu`                                  | 后台可编辑展示字段                         |
| 页面身份                                    | `ADMIN_PAGE_ROUTE_NAMES`                       | API 与 Admin 的稳定共享契约                |
| 页面组件                                    | `admin-page-registry.ts`                       | `routeName -> component loader` 受控注册表 |
| 页面可见性                                  | MenuResource + 有效 view Permission            | 导航投影，不替代 Guard                     |
| API 授权                                    | Permission code + `PermissionsGuard`           | 最终安全边界                               |
| 兼容权限投影                                | `Permission.module/resource`、`MenuPermission` | 迁移期继续读取和双写                       |

前端不得再为服务端业务菜单声明标题、图标、父子层级或排序。固定登录、首页、刷新、404 和 `systemPermission` 兼容跳转仍由前端维护，因为它们不是可配置业务菜单。

## 4. 数据模型与权限语义

### 4.1 Resource 基础

- `Resource` 使用整数 ID、唯一 `key`、`module`、名称、说明、状态、内置标识和排序。
- `Permission.resourceId` 指向 Resource，并以 `(resourceId, action)` 保证动作唯一。
- 兼容期保留 `Permission.module`、`Permission.resource`，由写路径同步维护。
- 既有 permission code 允许资源段保留 camelCase，例如 `football.assetRecord.view`，不得为了样式统一改写稳定权限码。

### 4.2 MenuResource 与页面可见性

- `catalog` 和 `group` 禁止关联 Resource。
- `menu` 未关联 Resource 时，对已认证管理员保持开放可见语义。
- 页面关联多个 Resource 时采用 ANY：任一 Resource 存在有效 `view` 即可见。
- `catalog` 和 `group` 仅在存在可见后代时返回，空目录自动裁剪。
- `MenuPermission` 在兼容期继续双写，但新模型的可见事实来自 `MenuResource` 和有效 Resource view。

### 4.3 有效权限

- 非 `view` 动作必须依赖同 Resource 的有效 `view`。
- Role 保存时补齐所选动作依赖的有效 `view`；view 缺失、Permission 停用或 Resource 停用时拒绝新增授权。
- 登录身份、JWT 校验和导航投影复用同一有效权限解析逻辑。
- 自定义角色通过 Permission 聚合获得授权；legacy `User.role` 只用于尚无显式 `UserRole` 的历史账号回填，不能覆盖显式角色分配。
- 所有 Admin 业务写接口使用精确 Resource action Permission，不再保留 `RolesGuard/@Roles` 作为管理权限旁路。

### 4.4 安全写入与审计

- Menu、Resource、Permission、Role 和 User 的复合保存使用 Serializable 事务及有限重试。
- 更新携带 `expectedUpdatedAt` 做乐观并发，冲突返回稳定错误。
- 系统危险写入与业务修改在同一事务写入 `AuditEvent`。
- 审计读取仅展示允许字段，并移除密码、Token 等敏感元数据。
- 始终保留至少一个有效超级管理员；禁止当前账号移除自己的最后一份超级管理员资格；密码重置撤销目标账号 refresh token。

## 5. 菜单模型与当前项目树

### 5.1 节点类型

- `group`：主导航分组，不对应可访问页面，路径为空。
- `catalog`：业务目录，使用 Layout 承载子页面。
- `menu`：最终页面，必须通过 `routeName` 命中前端受控注册表。

`routeName` 全局唯一，也是内置同步身份。`catalog/menu` 必须使用规范化绝对路径；`group` 不参与组件解析。

### 5.2 当前 Gaoge 内置树

```text
高歌体育（group，sort 0）
├── 高歌 FC（catalog，sort 0）
│   ├── 球员信息（menu，sort 0）
│   ├── 球队信息（menu，sort 10）
│   ├── 比赛信息（menu，sort 20）
│   └── 资产信息（menu，sort 30）
└── 内容管理（catalog，sort 10）
    ├── Banner 管理（menu，sort 0）
    └── 流言板（menu，sort 10）

系统管理（group，sort 10）
├── 用户权限（catalog，sort 0）
│   ├── 用户管理（menu，sort 0）
│   ├── 角色管理（menu，sort 10）
│   ├── 菜单与权限（menu，sort 20）
│   └── 审计日志（menu，sort 30）
└── 微信管理（catalog，sort 10）
    └── 微信分享配置（menu，sort 0）
```

共 17 个内置菜单节点。真实导航、“菜单与权限”树和 access catalog 的同级顺序都必须按 `sort ASC, id ASC` 生成，因此主导航固定为“高歌体育 → 系统管理”，系统管理内为“用户权限 → 微信管理”。

## 6. 内置配置与精确同步

### 6.1 注册表边界

以下定义是当前项目内置数据的唯一代码事实源：

- `BUILT_IN_ROLE_DEFINITIONS`
- `BUILT_IN_RESOURCE_DEFINITIONS`
- `BUILT_IN_PERMISSION_DEFINITIONS`
- `BUILT_IN_MENU_DEFINITIONS`

普通同步只回收同时满足 `isBuiltIn = true` 且稳定标识不在当前注册表的记录：Role 用 `code`，Resource 用 `key`，Permission 用 `code`，Menu 用 `routeName`。任何 `isBuiltIn = false` 的自定义记录均不属于清理范围。

### 6.2 字段所有权

内置菜单字段分为：

- 代码所有：稳定名称、`routeName`、节点类型、路径、内置父级结构、内置标记和默认 Resource 绑定。后台拒绝修改。
- 数据库所有：标题、图标、同级排序、状态和显隐。后台可编辑，普通同步不得覆盖。

新增内置节点使用代码默认展示值创建。图标更新支持显式空字符串清除；创建时空图标可省略。内置 Resource 不自动生成“某模块的某资源”机械说明，默认说明为空；自定义和显式维护的说明继续保留。

### 6.3 事务内同步顺序

1. Upsert 当前 Role、Resource、Permission 和菜单树。
2. 计算四类注册表外的残留内置记录。
3. 若非残留菜单依赖待删菜单父级，则中止并回滚。
4. 按深度从叶子到根删除残留内置菜单。
5. 删除残留内置 Permission 及关联。
6. 若非残留 Permission 依赖待删 Resource，则中止并回滚。
7. 删除残留内置 Resource。
8. 删除残留内置 Role；显式用户角色关系按数据库约束处理，不能通过 legacy 字段重新追加角色。
9. 重建当前内置 Role、Menu 与 Permission/Resource 的关系。

任一步失败则整个同步回滚。该逻辑用于清理误混入本地数据库的 Compass/历史内置记录，而不是用前端过滤隐藏错误数据。

## 7. 服务端导航契约

`GET /admin/navigation` 返回当前用户授权裁剪后的有序树，每个节点至少包含 `routeName`、`type`、`path`、`title`、`icon` 和 `children`，并保留旧客户端需要的兼容字段。

生成规则：

1. 只读取 `active + visible` 节点，并按同级 `sort ASC, id ASC` 排序。
2. `menu` 依据关联 Resource 的有效 view 判断可见。
3. `catalog/group` 只保留可见后代。
4. API 校验内部页面 `routeName` 必须在共享白名单中。
5. Admin 校验节点类型、规范化路径和注册表覆盖；未知页面失败关闭、裁剪空父节点并记录可理解的诊断。

Admin 登录后先获取用户和权限，再获取导航树，最后生成导航与 Vue Router 记录。不能猜测组件路径，也不能在未知 routeName 时回退到静态业务菜单。

## 8. Admin 管理体验

- `/system/menu` 是“菜单结构 / 资源目录”统一工作区，两种模式只切换组件本地状态，不修改 URL query，不产生额外页面或页签。
- `/system/permission` 作为隐藏兼容路由，仅重定向到命名路由 `systemMenu`。
- 菜单树显示结构、顺序、图标、Resource 绑定和影响摘要；内置结构字段只读，展示字段可编辑。
- 资源目录提供 Resource/Permission 维护和引用摘要；角色弹窗使用“模块 → Resource → Permission”树，保存只提交 Permission 叶子 ID。
- 用户、角色代码使用 `text-muted-foreground`，避免误用浅色背景 token。
- `FaIcon` 将 `i-集合:名称` 规范化为 Iconify 的 `集合:名称`，同时保留 URL、本地图片和 SVG sprite 行为。

## 9. 数据迁移与发布

Resource migration 按“扩展 → 只读预检 → Resource 回填 → Permission 绑定 → MenuResource 回填 → 约束切换”执行，遇到非法 code、重复/缺失 view、module 冲突、目录权限关系等情况必须失败。导航 migration 在不运行 seed 的既有合法树上补建两个 group、重挂四个 catalog，且只修改结构字段，保留展示字段与 `updatedAt`。

兼容发布顺序：

1. 先发布 migration 和兼容 API，保留旧响应字段和旧关系双写。
2. 再发布使用服务端导航树与受控组件注册表的新 Admin。
3. 验证新 Admin 后清除前端重复的业务菜单展示元数据。

本地开发数据库必须与其他 Gaoge 项目隔离。若现有库包含 Compass/ERP migration 或内置数据，不直接覆盖，应新建当前项目专用库、应用本仓 migration 和 seed；生产数据库迁移、清理或部署必须单独审批。

## 10. 验证与验收

必须覆盖：

- Prisma validate/generate、空库和既有库 migration、非法预检、migration status。
- 内置同步的补建、字段保留、精确回收、依赖阻断、事务回滚和幂等。
- 有效权限、导航排序、Resource ANY、空目录裁剪、API Guard 与自定义角色。
- Admin 注册表覆盖、服务端树转换、未知键失败关闭、工作区同页切换、图标解析、编码颜色和清空图标 payload。
- API/Admin/shared typecheck、聚焦与全量测试、生产 build、格式与 diff check。
- 管理员和受限角色浏览器回归；直接 URL 与 API 越权必须分别得到 404/403 语义。

当前基线已完成上述验证；详细命令、数量、已知非任务告警和复验轮次见配套实施记录。

## 11. 跨项目同步契约

后续同步 Gaoge Admin 底座时，只同步以下机制：

- Resource 有效权限模型、Guard 与事务/审计安全边界。
- 服务端 Menu 事实源、三类节点、受控页面注册表和 fail-closed 行为。
- 内置字段所有权、精确同步与自定义依赖阻断。
- 导航/配置树一致性、共享 route-name parity 和关键回归测试。
- 同页菜单/资源工作区、图标规范化和语义化颜色修复。

每个目标项目必须重新盘点并适配：

- 自己的 `routeName`、组件映射和真实业务页面。
- 自己的菜单树、标题、图标、排序和 Resource/Permission 绑定。
- 全局角色或租户角色模型、bootstrap 账号和历史兼容字段。
- 数据库 migration 历史、已有自定义数据、品牌、端口和部署方式。

禁止直接复制 Gaoge 的 17 节点菜单树、57 个权限码或业务 Resource。同步完成后，目标项目必须以自己的注册表和数据库重新跑精确同步、权限矩阵、导航一致性与浏览器验收。

## 12. 2026-08-27 数据、图标与初始化回归修复设计

### 12.1 问题结论

服务端菜单切换完成后出现的现象不是同一个故障，但都发生在新底座启用后的交界处：

1. 业务数据没有被删除。当前 API 已切换到隔离数据库 `gaoge_dev`，该库具备当前项目完整的 27 条 migration 和 RBAC 初始数据，但业务表为空；历史业务数据仍在旧库 `gaoge_db`。旧库包含 49 条混合 migration，不再适合作为当前项目运行库。
2. 菜单图标渲染链路可工作，但服务端内置注册表遗漏了旧静态菜单中的三个默认图标。新库 seed 后对应 `Menu.icon` 为 `null`，因此服务端导航只能返回空图标。
3. 权限或用户信息初始化在服务端导航初始化之前失败时，路由守卫不会进入终态。它在 `routeStore.isGenerate = false` 的情况下反复重定向同一路径，`router.isReady()` 无法完成，最终表现为页面长期停留在 loading。
4. 浏览器加载业务页面时，共享页面键模块从 ESM 源文件命名导入 `.cjs`，Vite 无法提供对应命名导出。登录和菜单投影可以成功，但点击页面后动态组件加载失败并显示空白，视觉上容易被误判为数据丢失或 loading 未结束。

本次继续坚持“服务端 Menu 是运行时唯一事实源”，不通过切回混合旧库或恢复前端静态业务菜单来绕过问题。

### 12.2 业务数据恢复

恢复目标是保留干净、可迁移的 `gaoge_dev` 作为当前项目数据库，把仍在旧库中的真实业务数据一次性迁入，而不是让应用重新连接 `gaoge_db`。

迁移范围：

- 保留目标库现有 admin、Role、Resource、Permission、Menu、AuditEvent 和所有 RBAC 关系。
- 从旧库迁入不存在 ID 冲突的普通 `User`，以及 `Team`、`Player`、`PlayerTeam`、`MatchRound`、`MatchRoundResult`、`FootballAssetRecord`、`TeamFund`、`Banner`、`MessageBoardPost`、`WechatShareConfig`。
- 保留业务主键、关联键、创建时间和更新时间；完成后重置涉及自增主键的 sequence。
- 不迁入 `_prisma_migrations`、旧 Role/Resource/Permission/Menu 及其关系、旧 `RefreshToken`，历史登录态统一失效并重新登录。

执行约束：

1. 迁移前只读检查源表数量、目标业务表为空、用户主键和唯一字段无冲突；任何条件不满足立即停止。
2. 旧库只读，所有目标库写入放在单个事务中，并按外键依赖顺序执行。
3. 写入后在事务内核对逐表数量和关键关联，再提交；失败则完整回滚。
4. 提交后重新核对记录数、孤儿关联、Prisma migration status 和受影响业务接口。

该操作只恢复当前本地环境的数据，不把环境地址、账号或历史库兼容逻辑写进应用运行时代码。

### 12.3 默认图标恢复与字段所有权

补齐服务端 `BUILT_IN_MENU_DEFINITIONS` 中遗漏的默认值：

| routeName          | 默认图标                 |
| ------------------ | ------------------------ |
| `sports`           | `solar:cup-star-outline` |
| `systemManagement` | `ri:settings-3-line`     |
| `sportsContent`    | `ri:article-line`        |

同时对已经创建且仍为 `null` 的这三个内置节点执行一次性、精确回填。回填只匹配 `isBuiltIn = true`、确定的 `routeName` 和 `icon IS NULL`，不得触碰其他菜单或非空图标。

字段所有权规则保持不变：注册表图标只负责新环境的创建默认值；普通内置同步仍不覆盖数据库中的标题、图标、排序、状态和显隐。一次性迁移完成后，管理员继续拥有图标修改和显式清空的控制权，不增加每次启动自动补图标的兼容分支。

### 12.4 路由初始化失败终态

服务端导航模式必须把每次首次路由初始化收敛到成功或失败终态：

```text
未初始化
  ├─ 用户/权限与导航均成功 → 写入服务端菜单和动态路由 → 已生成
  └─ 任一初始化步骤失败
       ├─ 登录态已失效 → 交给既有认证流程跳转登录页
       └─ 登录态仍有效 → 清空服务端菜单和动态路由 → 标记已生成 → 失败关闭
```

失败关闭时不展示未经授权的静态菜单，也不反复执行同一路由初始化。守卫应先把 route/menu store 写入确定的空终态，再最多重进目标路由一次，使 Router 可以完成 ready；页面随后进入既有 404/错误展示，并向用户显示可理解的初始化失败提示。刷新或重新登录可发起新的初始化周期。

实现应保持局部：复用或增加一个可独立验证的失败收口函数，不重构整套路由守卫，不修改 API 超时时间，也不引入前端业务菜单 fallback。

### 12.5 共享页面键的双模块契约

`ADMIN_PAGE_ROUTE_NAMES` 同时服务于 NestJS CommonJS 运行时、Admin/Vite ESM 运行时和 TypeScript 类型系统。三个入口必须拥有同序字面量并由契约测试锁定：

- CommonJS 消费者继续使用 `.cjs` 运行时入口。
- ESM 消费者使用 `src/admin-page-route-names.ts`，不得从 ESM 源文件对 `.cjs` 做命名导入。
- `.d.cts` 继续描述 CommonJS 子路径类型；package exports 必须分别声明 `import` 和 `require` 条件。

该规则只解决模块格式边界，不改变稳定页面键集合、服务端菜单事实源或前端受控组件注册机制。

### 12.6 验证与验收

实施后至少验证：

- 数据迁移前置检查、事务回滚、迁移后逐表计数、主外键关系、sequence 和相关业务接口。
- 三个默认图标在新建数据库中可由注册表创建，在既有数据库中只回填目标空值；普通同步不覆盖管理员自定义或清空后的图标。
- 权限初始化、用户信息初始化、导航请求和导航解析分别失败时，路由只进入一次失败终态，不发生无限重定向，loading 能结束。
- 登录过期继续跳转登录页；未知页面和无权限页面继续 fail-closed，不恢复静态业务菜单。
- 浏览器直接打开和菜单点击业务路由时，不再出现 `.cjs` 命名导入错误；共享 CJS、ESM 与声明文件的页面键保持同序一致。
- API/Admin 聚焦测试、typecheck、build、格式与 diff check，以及 admin 登录后的数据、图标和关键页面浏览器回归。

### 12.7 本次不做

- 不把旧库重新设为应用运行库，不合并或伪造其 49 条 migration 历史。
- 不迁移历史 RefreshToken，不保留可能已过期的本地登录态。
- 不让普通内置同步持续覆盖管理员拥有的菜单展示字段。
- 不恢复前端静态业务菜单，不降低 Permission Guard 或导航失败关闭语义。
- 不借本次修复调整无关业务数据、菜单视觉样式或路由架构。

## 13. 追溯入口

- 实施与验证：[2026-08-26-admin-rbac-foundation-implementation.md](../plans/2026-08-26-admin-rbac-foundation-implementation.md)
- 长期开发规范：[admin-navigation.md](../../conventions/admin-navigation.md)
- 导航布局底座：[2026-08-07-admin-navigation-foundation-design.md](./2026-08-07-admin-navigation-foundation-design.md)
- 多仓同步记录：[2026-08-07-admin-navigation-foundation-multi-repo-sync-record.md](./2026-08-07-admin-navigation-foundation-multi-repo-sync-record.md)
