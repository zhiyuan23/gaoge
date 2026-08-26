# Admin 服务端驱动导航设计

- 日期：2026-08-26
- 状态：已实施并通过验证
- 目标仓库：`gaoge`
- 影响范围：`apps/api`、`apps/admin`、`packages/shared/types`、Prisma migration 与相关测试

## 背景

当前 Admin 同时维护两套业务菜单元数据：

- `apps/admin/src/router/routes.ts` 与 `router/modules/*` 决定真实导航分组、层级、标题、图标、顺序和页面组件。
- `apps/api/src/modules/system/rbac/builtins.ts` 与数据库 `Menu` 决定“菜单与权限”树、用户可见路径、Resource/Permission 关联和另一套标题、图标、层级及排序。

Admin 当前运行在 `routeBaseOn: 'frontend'`：先从前端路由生成导航，再将 `/admin/navigation` 的返回结果降级为路径白名单。因而左侧导航以本地路由顺序为准，而“菜单与权限”树以数据库 `sort` 为准。两套元数据没有契约校验，已经出现“左侧高歌体育在前，配置树用户权限在前”的漂移。

此外，顶部“系统管理”只是前端 `recordMainRaw` 分组，数据库中只有“用户权限”和“微信管理”两个并列根节点。简单切换到后端路由模式会改变现有顶部导航结构，不能作为可接受的迁移方案。

## 目标

- 数据库 `Menu` 成为业务导航标题、图标、层级、顺序、状态和显隐的运行时唯一事实源。
- `/admin/navigation` 返回当前用户已经授权且按配置排序的完整导航树。
- 前端只保留页面组件注册、固定基础路由及纯前端行为，不再重复维护业务菜单展示元数据。
- “菜单与权限”树和实际导航来自同一棵服务端树，天然保持相同结构和顺序。
- 保持 API Guard 为最终权限执行点；导航显隐不替代服务端授权。
- 保持 API 与 Admin 独立发布时的前后兼容，并对无效路由配置失败关闭。

## 方案比较

### 方案 A：继续前端菜单，后端只做可见路径过滤

改动最小，但标题、图标、层级和排序仍需维护两份，只能依赖测试发现漂移，无法真正支持服务端菜单管理。本方案不采用。

### 方案 B：后端返回任意组件路径并完全生成 Vue 路由

配置自由，但服务端可以引用前端包内任意组件路径，接口和构建产物强耦合，也扩大了错误配置和非预期组件加载风险。本方案不采用。

### 方案 C：服务端导航树 + 前端受控组件注册表

服务端拥有导航和授权配置，前端通过稳定 `routeName` 在受控注册表中解析组件。该方案兼顾动态配置、安全边界、类型检查和独立部署，符合当前 Resource RBAC 架构，作为本次采用方案。

## 权威数据边界

### 服务端与数据库负责

- 导航节点类型、父子关系和同级 `sort`。
- 标题、图标、状态、导航显隐。
- 页面路径与稳定 `routeName`。
- 页面与 Resource 的关联，以及基于有效 `view` Permission 的可见性。
- 按用户权限裁剪目录和页面，移除空目录或空分组。

### 前端负责

- `routeName -> component loader` 的受控页面组件注册表。
- Layout、重定向、KeepAlive、面包屑等纯前端运行行为。
- 登录、首页、刷新页、404 和不进入菜单的兼容路由。
- 按钮级 `v-auth` 体验；权限事实仍来自服务端。

前端不得再为服务端业务菜单重复声明标题、图标、父子层级或排序。服务端也不得下发任意源码组件路径。

## 菜单模型

### 节点类型

`SystemMenuType` 扩展为：

- `group`：只用于主导航分组，不对应可访问页面，路径为空。
- `catalog`：可形成路由层级的业务目录，本身没有业务页面组件。
- `menu`：最终页面，必须能通过 `routeName` 解析到前端注册组件。

`Menu.path` 调整为可空，仅 `group` 允许为空；`catalog` 和 `menu` 必须提供规范化绝对路径。`routeName` 保持全局唯一，继续作为内置同步身份和前端注册键；分组也使用稳定名称，但不参与组件解析。

### 目标内置树

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

这棵树同时驱动顶部主导航、侧边栏和“菜单与权限”配置树。预期主导航顺序为“高歌体育 → 系统管理”，系统管理内部顺序为“用户权限 → 微信管理”。

## 内置配置与后台编辑边界

数据库是运行时事实源，但内置页面仍需要代码注册来保证部署可恢复。为避免“同步内置配置”覆盖管理员调整，内置字段分为两类：

- 代码所有：`name`、`routeName`、`menuType`、路由路径、内置父级结构、页面默认 Resource 绑定。后台对内置菜单只读，变化随版本化代码与 migration 发布。
- 数据库所有：标题、图标、同级排序、状态和导航显隐。后台可编辑，普通内置同步必须保留这些值。

`RbacSyncService.syncBuiltIns()` 对菜单改为“补齐与修复代码所有字段”，不再覆盖已有内置菜单的数据库所有字段。新增内置节点使用代码默认值创建；废弃节点继续按受保护流程停用。若未来需要恢复所有展示默认值，应设计单独的高风险“恢复默认菜单”操作，而不是复用普通同步按钮。

自定义菜单继续由数据库完整管理，但内部页面必须引用已注册的 `routeName`；本次不实现远程页面、在线上传组件或微前端模块。

## 服务端导航契约

`GET /admin/navigation` 返回经过授权裁剪的有序树，每个节点至少包含：

- `routeName`
- `type`
- `path`（分组为空）
- `title`
- `icon`
- `children`

服务端处理规则：

1. 只读取 `active + visible` 节点，并按同级 `sort ASC, id ASC` 排序。
2. `menu` 依据关联 Resource 的有效 `view` 权限判断可见；未关联 Resource 的页面沿用“认证用户可见”语义。
3. `catalog` 和 `group` 只在存在可见后代时返回。
4. 返回结构保持现有 `path/name/meta/children` 字段兼容，并增补明确的节点类型和稳定键，保证旧 Admin 在 API 先发布时仍能工作。

“菜单与权限”继续读取同一 `SystemMenuService.findTree()` 数据，不创建第二套排序或树转换。

## Admin 路由与菜单生成

新增集中式页面注册表，只记录稳定路由名、组件加载器和必要的纯前端 meta。业务路由模块中的标题、图标、层级、排序和菜单权限声明移除。

登录后的生成流程调整为：

1. 获取用户信息和 Permission code。
2. 请求 `/admin/navigation`。
3. 校验服务端节点类型、路径和 `routeName`。
4. 从导航树生成主导航和侧边栏数据。
5. 对 `catalog/menu` 生成 Vue Router 记录；`menu` 从注册表解析组件，`group` 只参与导航展示。
6. 注册成功后再进入目标页面。

对于服务端返回但前端未注册的页面，前端必须失败关闭：不注册该页面、裁剪因此产生的空父节点、记录明确诊断并向管理员显示一次可理解的配置错误。不能回退到猜测组件路径或绕过授权显示页面。

`systemPermission` 等不进入菜单的兼容跳转继续保留在固定前端路由中，不写入服务端业务菜单。

## 契约与防漂移

- 在共享类型中维护运行时可读取的 `ADMIN_PAGE_ROUTE_NAMES` 及其字面量联合类型；它只定义可执行页面身份，不包含菜单标题、图标、层级或排序。
- API 对所有内部 `menu` 的 `routeName` 做白名单校验；发布新页面时必须先将稳定键加入共享契约。`group` 和 `catalog` 不参与页面组件白名单。
- Admin 组件注册表必须以完整 `Record<AdminPageRouteName, ComponentLoader>` 覆盖全部页面键，且不允许重复。
- API 测试固定内置树结构、同级排序、授权裁剪和空目录移除。
- Admin 测试固定“服务端树 -> 主导航/侧边栏/路由”的转换，以及未知路由键的失败关闭行为。
- 浏览器回归同时检查实际导航和“菜单与权限”树，确认两处结构与顺序一致。

## 数据迁移与发布顺序

本次需要 Prisma migration：允许 `group` 节点使用空路径，并迁移现有内置树。

兼容发布顺序为：

1. 先发布增量兼容的 API 与 migration，新增分组节点并保留旧响应字段。
2. 再发布使用服务端导航树和组件注册表的新 Admin。
3. 新 Admin 验证完成后移除旧的业务菜单元数据与前端路径白名单投影逻辑。

API 先发布期间，旧 Admin 仍能递归收集分组后代路径；Admin 先于最终清理发布时也仍能消费兼容字段。不得在同一次不兼容发布中同时删除旧接口字段和旧前端处理。

本地开发完成后按 Prisma 变更规范同步 migration、Prisma Client 与 API 进程，并对 `/admin/navigation` 和 `/system/access-catalog` 做 smoke test。

## 验证门禁

- Prisma validate、generate、migration 状态与空库/现有库迁移演练。
- RBAC 内置同步测试：补建缺失节点、保留标题/图标/排序/状态/显隐、修复代码所有字段、重复同步幂等。
- NavigationService 测试：排序、分组、Resource ANY 可见、空节点裁剪。
- Admin 单元测试：组件注册、树转换、菜单顺序、直接路由注册、未知键失败关闭。
- API/Admin typecheck、聚焦 Jest/Node 测试、生产 build、`git diff --check`。
- 使用管理员账号手动检查：主导航、侧边栏、“菜单与权限”树、球员/球队/比赛/资产、用户/角色/审计、微信分享配置。
- 使用受限角色检查菜单裁剪，并直接请求受保护 API 验证 Guard 仍拒绝越权访问。

## 跨仓库边界

本次只实施 `gaoge`。服务端驱动导航的基础行为可在 `gaoge` 稳定后作为 RBAC 工程底座候选评估，但业务菜单树、路由键、Resource 绑定和品牌均为项目专属内容，不直接复制到 `gaoge-club`、`gaoge-compass` 或 `gaoge-crm`。当前其他仓库不写入、不提交、不推送。

## 本次不做

- 不新增租户菜单、数据权限、字段权限或拒绝权限。
- 不实现远程 Vue 组件、微前端、在线页面搭建或任意组件路径加载。
- 不把菜单显隐当作 API 授权。
- 不同步其他 Gaoge 仓库的业务菜单。
- 不重构与导航/RBAC 无关的页面、主题、端口或部署流程。
- 不删除登录、首页、404、刷新页和必要的隐藏兼容路由。

## 验收标准

- 业务菜单标题、图标、层级和排序只有服务端 `Menu` 一份运行时配置。
- 实际导航与“菜单与权限”树均显示“高歌体育 → 系统管理”，且系统管理内为“用户权限 → 微信管理”。
- 管理员在后台修改内置菜单标题、图标、排序、状态或显隐后，刷新导航即可生效，普通内置同步不会覆盖修改。
- 服务端配置无法解析的页面不会出现在可点击导航中，并产生明确诊断。
- 所有页面仍由服务端 Permission/Resource 与 API Guard 保护，受限账号不可通过直接 URL 或 API 绕过。

## Review Round 1 复验（2026-08-26）

状态保持“已实施并通过验证”。复验补强了以下已落地约束：

- Admin 控制的足球写接口全部使用精确 Resource action Permission；内容与微信 Admin 接口也通过 HTTP 回归矩阵确认，legacy `role=admin` 不再构成写授权。
- 版本化导航 migration 能在不运行 seed 的既有合法旧树上补建两个 group、重挂四个 catalog，并仅修改结构字段；既有标题、图标、排序、状态、显隐和更新时间保持不变。
- 内置菜单的稳定名称、路径、类型、父级、内置标记和 Resource 关联由服务端拒绝直接修改；标题、图标、排序、状态、显隐仍可编辑，包含清空图标。
- 内置同步只为尚无显式 `UserRole` 的历史用户回填 legacy role。经 System User API 分配自定义角色的用户即使兼容列为 `role=admin`，重复同步也不会追加 `super_admin`。
- 共享类型 typecheck 自动校验 CJS 运行时 route-name 列表与 `.d.cts` 字面量声明完全同序一致。

最终复验使用隔离本地数据库 `gaoge_task7_navigation_r2_20260826` 和隔离端口 API `3123` / Admin `9013`；Prisma、空库与既有库 migration drill、248 个 API 测试、21 个 Admin 聚焦测试、共享类型契约、三方 typecheck/build、真实浏览器管理员/受限角色/直接 URL/API Guard 均通过。详细证据见 Task 7 报告。

## Review Round 2 复验（2026-08-26）

Admin 菜单表单的“清空图标”语义现已在所有提交路径闭环：active workspace 和 legacy 编辑页都通过同一纯 payload normalizer 将空白输入映射为更新请求中的显式空字符串，API 因而能执行清除；创建请求仍可省略空图标。可执行 Admin 测试直接断言 active workspace 的完整更新 payload 含 `icon: ''` 且绝非 `undefined`，并覆盖 legacy mapper。最终 Admin 聚焦测试 27/27、typecheck/build、共享类型 typecheck、任务路径 ESLint/Prettier/diff check 均通过。
