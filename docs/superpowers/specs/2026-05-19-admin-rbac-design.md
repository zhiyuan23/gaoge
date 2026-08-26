# 后台 RBAC 与系统管理模块设计

> **历史设计。** 本文记录第一阶段 RBAC 起点，不代表当前运行时结构。当前 Resource 权限、服务端导航、精确内置同步和 Admin 工作区以 [2026-08-26 Admin RBAC 工程底座总设计](./2026-08-26-admin-rbac-foundation-design.md) 为准；实施证据见 [配套记录](../plans/2026-08-26-admin-rbac-foundation-implementation.md)。

## 背景

当前仓库中，`apps/admin` 已具备静态路由、静态菜单和基于权限字符串的前端访问控制能力：

- 路由入口和模块定义位于 `apps/admin/src/router/*`
- 菜单生成与权限过滤位于 `apps/admin/src/store/menu/index.ts`
- 页面/按钮权限判断位于 `apps/admin/src/composables/useAuth.ts`
- `系统管理` 下已存在 `用户管理 / 角色管理 / 菜单管理 / 权限管理` 路由入口

当前 `apps/api` 中后台认证和权限返回仍是首期实现：

- `auth/permission` 在 `apps/api/src/modules/auth/services/auth.service.ts` 中按 `User.role` 硬编码拼装权限
- `SystemUser` 相关接口仍以 `User.role` 单字段为后台身份来源
- Prisma 当前只有 `User.role` 字符串，没有独立的 `Role / Permission / Menu` 实体

这意味着当前后台权限体系本质上还是“账号 + 单角色字符串 + 硬编码权限集合”，尚未形成可管理、可扩展、可审计的 RBAC 模型。

本次目标是为 `apps/admin` 和 `apps/api` 设计一套完整但分阶段落地的后台 RBAC 方案，覆盖：

- 完整 RBAC 后端数据模型
- `用户管理 / 角色管理 / 权限管理 / 菜单管理` 的 admin 页面职责
- 与当前静态路由体系兼容的迁移路径

## 目标

- 建立完整后台 RBAC 数据模型：`User -> Role -> Permission`
- 新增可管理的 `Menu` 数据模型，为后续菜单配置化打基础
- 用户支持绑定多个后台角色，权限按角色并集聚合
- 权限码继续保持稳定命名，不开放任意自由扩展的权限 code
- 菜单管理先管理菜单元数据和权限绑定，不立即接管 admin 运行时路由注册
- `auth/permission` 从硬编码权限切换为数据库动态聚合
- admin 中四个系统管理页面都具备真实职责，而不再只有占位入口

## 非目标

- 本期不直接切到“后端动态菜单 + 动态路由注册”
- 本期不让后台自由新增任意权限码
- 本期不把小程序普通用户纳入后台 RBAC 分配体系
- 本期不重构 `apps/admin` 整套路由架构
- 本期不在 `packages/*` 提前抽象通用 RBAC SDK

## 关键设计结论

### 1. 菜单本期先数据化，不接管运行时路由

采用“完整 RBAC 后端模型 + 前端静态路由继续保留”的方案。

原因：

- 当前 admin 已经稳定使用静态路由和 `meta.auth`
- 如果直接切动态菜单驱动运行时，会把路由注册、组件映射、权限聚合三件事同时改掉，风险过高
- 权限体系建设和菜单运行时驱动不是同一优先级，应该先把授权源做对

因此本期菜单管理的定位是：

- 管理后台菜单树元数据
- 管理菜单与权限的绑定关系
- 为后续菜单配置化准备数据基础
- 不负责自动生成新页面组件或自动注册新路由

### 2. 用户与角色采用多对多

后台用户与角色关系采用“一个用户可绑定多个角色”，权限按所有启用角色的权限并集合并。

原因：

- 比单角色模型更稳定，避免后续出现复合职责后返工
- 对 admin 表单复杂度影响可控
- 更符合 RBAC 标准模型

### 3. 权限码来源采用“系统预置 + 后台维护元信息”

权限码 `code` 继续由系统预置，不允许后台任意录入和修改 `code`。后台权限管理页只负责：

- 查看权限字典
- 维护权限名称、描述、分组、状态等元信息
- 同步内置权限定义到数据库

原因：

- 当前前端路由 `meta.auth` 和按钮 `v-auth` 已经大量依赖固定权限码
- 放开自由权限码会把页面能力和权限映射问题提前放大

### 4. RBAC 只覆盖后台账号用户

`User` 表继续复用，但只有后台账号用户参与 RBAC：

- `account != null` 的后台账号可绑定后台角色
- 纯小程序用户不进入后台角色授权流程
- 小程序现有 `user` 身份继续沿用，不受本次 RBAC 设计影响

## 方案对比

### 方案一：全动态 RBAC + 动态菜单驱动运行时

做法：

- 后端落完整 `Role / Permission / Menu`
- admin 登录后由后端返回菜单树驱动运行时导航

优点：

- 目标形态最完整

缺点：

- 需要同时改动前端路由注册、菜单渲染、组件映射和权限聚合
- 与当前代码现状不匹配
- 实施风险最高

### 方案二：完整 RBAC 后端模型 + 前端静态路由继续保留

做法：

- 后端落完整 `Role / Permission / Menu`
- 权限改为动态聚合
- 菜单管理维护数据库中的菜单配置
- admin 运行时仍继续使用静态路由和 `meta.auth`

优点：

- 先把授权模型做对
- 与当前 admin 实现兼容性最好
- 能在不推倒路由系统的前提下完成系统管理四个模块

缺点：

- 菜单管理页和实际运行时导航之间会有一段过渡期

### 方案三：只做角色与权限，不做菜单实体

做法：

- 只引入 `Role / Permission`
- 菜单继续纯代码静态维护

优点：

- 实现最快

缺点：

- 无法完整支撑“菜单管理”页面
- 后续还要再补第二轮设计

## 结论

采用方案二：

- 建立完整 RBAC 后端模型
- 前端继续使用静态路由和 `meta.auth`
- 菜单先作为可管理数据存在
- 权限从硬编码切到动态聚合

## 数据模型设计

### 总体关系

```text
User --< UserRole >-- Role --< RolePermission >-- Permission
Menu --< MenuPermission >-- Permission
```

用户不直接绑定权限，角色是唯一授权中心；菜单不直接参与授权决策，只通过绑定权限定义“看到该菜单需要哪些权限”。

### User

继续复用现有 `User` 表。

保留字段：

- `id`
- `account`
- `passwordHash`
- `nickname`
- `avatarUrl`
- `status`
- `deletedAt`
- `lastLoginAt`

兼容字段：

- `role`

说明：

- `User.role` 在过渡阶段保留，用于历史数据迁移和兼容逻辑
- 后续后台授权不再以 `User.role` 作为真实权限来源
- 只有 `account != null` 的后台账号用户参与 RBAC 角色绑定

### Role

新增后台角色表。

建议字段：

- `id`
- `code`
- `name`
- `description`
- `status`
- `sort`
- `isBuiltIn`
- `createdAt`
- `updatedAt`

约束建议：

- `code` 唯一，使用稳定英文标识，例如 `super_admin`
- `isBuiltIn = true` 的内置角色不允许删除 code

### Permission

新增权限字典表。

建议字段：

- `id`
- `code`
- `name`
- `module`
- `resource`
- `action`
- `description`
- `status`
- `isBuiltIn`
- `createdAt`
- `updatedAt`

说明：

- `code` 如 `system.user.create`
- `module/resource/action` 由 `code` 解析或在同步时一并写入
- 后台不允许普通新增自定义 `code`

### Menu

新增菜单配置表。

建议字段：

- `id`
- `parentId`
- `name`
- `title`
- `icon`
- `path`
- `routeName`
- `menuType`
- `sort`
- `status`
- `visible`
- `isBuiltIn`
- `createdAt`
- `updatedAt`

建议枚举：

- `menuType`: `catalog` | `menu`

说明：

- 本期不支持“按钮型菜单”或“外链菜单”实体化，先覆盖后台现有导航主路径
- `routeName` 和 `path` 应与 admin 静态路由保持对应关系

### UserRole

新增用户角色关联表。

字段建议：

- `userId`
- `roleId`
- `createdAt`

约束建议：

- `(userId, roleId)` 唯一

### RolePermission

新增角色权限关联表。

字段建议：

- `roleId`
- `permissionId`
- `createdAt`

约束建议：

- `(roleId, permissionId)` 唯一

### MenuPermission

新增菜单权限关联表。

字段建议：

- `menuId`
- `permissionId`
- `createdAt`

说明：

- 用于表达菜单显示所需权限集合
- 本期不新增 `RoleMenu`

## 权限模型设计

### 权限命名

继续沿用当前已存在的权限命名风格：

`<domain>.<resource>.<action>`

例如：

- `system.user.view`
- `system.role.assign-permission`
- `football.player.update`

### 授权来源

权限判断只以用户当前启用角色聚合出的权限集合为准：

- 用户绑定多个角色时取权限并集
- 停用角色不参与权限聚合
- 停用权限不参与权限聚合

### 菜单可见性

菜单可见性来源于“菜单绑定权限 + 用户权限集合”，而不是角色直接绑定菜单：

- 用户拥有菜单所需任一权限或满足菜单的权限策略时，可见菜单
- 页面访问仍继续由前端静态路由上的 `meta.auth` 控制

### 兼容策略

过渡期间：

- `auth/permission` 返回的仍是权限码数组
- `apps/admin` 的 `useAuth()` 和 `meta.auth` 不需要改造调用方式

## 后端模块设计

建议将 RBAC 能力放入 `modules/system/*`，而不是继续塞进 `auth`。

### modules/auth

职责：

- 后台登录
- token 签发和校验
- 查询当前用户 profile
- 查询当前用户聚合权限结果

改造点：

- `adminLogin` 不再根据 `User.role in ['admin', 'viewer']` 决定后台登录资格
- 改为判断：
  - 有后台账号
  - 状态正常
  - 绑定至少一个启用角色

### modules/system/user

职责：

- 后台用户 CRUD
- 分配角色
- 启停用
- 重置密码

改造点：

- 用户表单从单 `role` 改为 `roleIds`
- 用户查询结果包含角色列表

### modules/system/role

职责：

- 角色 CRUD
- 角色启停用
- 角色权限分配
- 删除前引用检查

### modules/system/permission

职责：

- 权限字典查询
- 权限元信息维护
- 内置权限同步

### modules/system/menu

职责：

- 菜单树 CRUD
- 菜单排序
- 菜单权限绑定

## 接口设计

### 用户管理

- `GET /system/users`
- `POST /system/users`
- `PATCH /system/users/:id`
- `PATCH /system/users/:id/status`
- `PATCH /system/users/:id/reset-password`
- `PATCH /system/users/:id/roles`
- `DELETE /system/users/:id`

返回结构建议：

- 用户基础信息
- `roles: { id, code, name, status }[]`

### 角色管理

- `GET /system/roles`
- `POST /system/roles`
- `PATCH /system/roles/:id`
- `PATCH /system/roles/:id/status`
- `GET /system/roles/:id/permissions`
- `PATCH /system/roles/:id/permissions`
- `DELETE /system/roles/:id`

### 权限管理

- `GET /system/permissions`
- `GET /system/permissions/grouped`
- `PATCH /system/permissions/:id`
- `POST /system/permissions/sync-builtins`

说明：

- 本期不开放普通 `POST /system/permissions`
- 不开放修改 `code`

### 菜单管理

- `GET /system/menus/tree`
- `POST /system/menus`
- `PATCH /system/menus/:id`
- `PATCH /system/menus/:id/sort`
- `PATCH /system/menus/:id/permissions`
- `DELETE /system/menus/:id`

### 认证返回

- `GET /auth/profile`
- `GET /auth/permission`

`GET /auth/permission` 返回建议扩展为：

- `roles`
- `permissions`

前端本期至少消费：

- `permissions`

## 守卫与鉴权改造策略

当前 `@Roles('admin')` 只适合首期简化方案，不适合作为完整 RBAC 的长期模型。

建议新增权限守卫，例如：

- `@RequirePermissions('system.role.view')`
- `@RequirePermissions('system.role.update')`

改造顺序：

1. 先改 `auth.service`，让登录和 `auth/permission` 基于角色聚合
2. 再为系统管理新模块引入权限守卫
3. 旧业务接口保留 `RolesGuard` 一段时间
4. 后续逐步把后台业务接口迁移到权限守卫

## Admin 页面设计

### 用户管理

用户管理页继续沿用现有列表页 + 弹窗 CRUD 结构，不新增详情子路由。

列表字段建议：

- 账号
- 昵称
- 角色列表
- 状态
- 最近登录时间
- 创建时间

搜索项建议：

- 关键词
- 角色
- 状态

表单字段建议：

- 登录账号
- 初始密码
- 昵称
- 头像地址
- 角色多选
- 状态

规则建议：

- 没有角色的后台账号不能登录后台
- 默认超级管理员账号不能删除
- 默认超级管理员账号至少保留一个超级管理员角色

### 角色管理

角色管理页是 RBAC 的核心页面，不再保留占位实现。

列表字段建议：

- 角色名称
- 角色编码
- 说明
- 绑定用户数
- 权限数
- 状态
- 排序
- 是否内置

核心动作：

- 新增角色
- 编辑角色
- 启停用角色
- 删除角色
- 分配权限

交互建议：

- 角色基础信息使用表单弹窗
- 权限分配使用独立弹窗或抽屉
- 权限按 `system / football / basketball` 等模块分组展示

### 权限管理

权限管理页是“内置权限字典管理页”，不是“自由权限编辑器”。

展示字段建议：

- 权限名称
- 权限码
- 模块
- 资源
- 动作
- 描述
- 状态
- 是否内置

核心能力：

- 查询和筛选权限
- 编辑名称、描述、状态
- 执行“同步内置权限”

限制：

- 不允许编辑 `code`
- 不允许自由新增任意权限码

### 菜单管理

菜单管理页用于维护菜单树元数据和菜单权限绑定。

建议采用树表或树形列表。

字段建议：

- 菜单标题
- 菜单标识 `name`
- 路径 `path`
- 路由名 `routeName`
- 图标
- 类型
- 排序
- 状态
- 可见性
- 绑定权限

核心动作：

- 新增同级菜单
- 新增子菜单
- 编辑菜单
- 排序调整
- 启停用
- 删除
- 绑定权限

明确限制：

- 菜单管理不负责自动生成页面组件
- 菜单管理不直接驱动运行时路由注册

## 初始化数据与同步策略

本期不应采用“空表后完全手工维护”的策略，而应建立稳定的内置同步机制。

建议新增内置同步服务，职责：

- 把系统内置角色同步到数据库
- 把系统内置权限同步到数据库
- 把系统内置菜单同步到数据库
- 对缺失项做新增
- 对名称、描述、分组、排序等元信息做覆盖更新
- 不主动删除数据库中已有记录，避免误删已绑定数据

### 内置角色建议

- `super_admin`
- `system_viewer`

### 内置权限来源

把当前已有的权限全集落库，包括：

- `system.*`
- `football.*`
- `basketball.*`

### 内置菜单来源

至少先覆盖当前 admin 中稳定存在的系统管理菜单配置：

- `系统管理`
- `用户管理`
- `角色管理`
- `菜单管理`
- `权限管理`

## 数据迁移策略

### 迁移步骤

1. 新增 `Role / Permission / Menu / UserRole / RolePermission / MenuPermission`
2. 保留 `User.role` 作为兼容字段
3. 执行内置角色/权限/菜单同步
4. 执行历史用户角色迁移

### 历史用户迁移规则

- `User.role = 'admin'` 的后台账号自动绑定 `super_admin`
- `User.role = 'viewer'` 的后台账号自动绑定 `system_viewer`
- 纯小程序用户不处理

### 过渡期策略

- 登录和 `auth/permission` 优先读取角色关联
- `User.role` 暂时保留，后续评估移除

## 实施顺序

建议固定为以下顺序：

1. Prisma 模型与迁移
2. 内置角色/权限/菜单同步服务与 seed
3. `auth.service` 改为按角色聚合权限
4. 用户管理改为多角色
5. 角色管理页与角色权限分配接口
6. 权限管理页
7. 菜单管理页
8. 系统管理相关接口切到权限守卫
9. 最后评估并移除 `User.role`

## 验收标准

### 后端验收

- 超级管理员可正常登录并获得完整权限
- 无角色后台账号不能登录后台
- 多角色用户权限按并集合并
- 停用角色后不再贡献权限
- 停用权限后不再贡献权限
- 删除被用户引用的角色会被阻止
- 内置同步接口可重复执行，结果稳定
- `auth/permission` 不再依赖 `User.role` 硬编码权限集合

### Admin 验收

- 用户管理支持为用户分配多个角色
- 角色管理支持新增、编辑、停用、删除、分配权限
- 权限管理支持查看、筛选、维护元信息、同步内置权限
- 菜单管理支持维护树结构、排序、状态、绑定权限
- 页面访问与按钮显隐能随角色权限变化而变化
- 无权限用户即使手输路由，也无法访问系统管理对应页面

## 风险与边界

### 1. `User.role` 兼容期风险

在过渡阶段，`User.role` 和新角色关联会并存。实现时必须明确“后台授权以谁为准”，避免双轨逻辑冲突。

建议：

- 登录资格和权限聚合一旦切换成功，就以角色关联为准
- `User.role` 只保留迁移和兼容价值，不再参与新接口授权判断

### 2. 菜单数据与静态路由可能暂时不一致

因为本期菜单管理不接管运行时路由，数据库菜单与前端静态菜单在短期内可能出现不一致。

建议：

- 首期把菜单管理定位为“配置基础设施”
- 对 `routeName/path` 增加强校验，只允许绑定现有静态路由 key

### 3. 旧接口仍用角色守卫

系统管理先切权限守卫，旧业务模块可以暂时保留 `RolesGuard`。这属于可接受的阶段性混合状态，但需要在后续迭代中逐步统一。

## 总结

本次设计采用“完整 RBAC 模型先落地、前端静态路由暂时保留”的策略：

- 角色成为唯一授权中心
- 权限成为稳定系统契约
- 菜单成为可管理的导航元数据
- 用户管理、角色管理、权限管理、菜单管理形成清晰职责分工

这样既能解决当前后台权限写死的问题，又不会因为过早切动态菜单和动态路由，把改造范围扩张到不可控。
