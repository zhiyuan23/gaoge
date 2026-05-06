# 系统管理菜单与用户管理首期设计

## 背景

当前 monorepo 中，后台管理端 `apps/admin` 已具备静态菜单、静态路由、权限过滤的基础能力：

- 路由主入口定义在 [apps/admin/src/router/routes.ts](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/router/routes.ts)
- 路由生成与拍平逻辑位于 [apps/admin/src/store/route/index.ts](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/store/route/index.ts)
- 菜单生成与权限过滤位于 [apps/admin/src/store/menu/index.ts](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/store/menu/index.ts)
- 按钮级权限判断位于 [apps/admin/src/composables/useAuth.ts](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/composables/useAuth.ts)

同时，`apps/api` 已具备后台登录与权限返回接口，但权限仍是按管理员角色硬编码返回：

- 接口入口在 [apps/api/src/modules/auth/controllers/auth.controller.ts](/Users/snow/Documents/Gaoge/gaoge/apps/api/src/modules/auth/controllers/auth.controller.ts)
- 权限拼装逻辑在 [apps/api/src/modules/auth/services/auth.service.ts](/Users/snow/Documents/Gaoge/gaoge/apps/api/src/modules/auth/services/auth.service.ts)
- 当前 Prisma 数据模型只有 `User.role` 字符串，没有独立的 `Role / Menu / Permission` 实体，见 [apps/api/prisma/schema.prisma](/Users/snow/Documents/Gaoge/gaoge/apps/api/prisma/schema.prisma)

接下来要开发后台“用户管理”，并为后续“角色管理 / 菜单管理 / 权限管理”预留清晰的信息架构。当前最需要先确定的是菜单与路由的规划，以及首期按什么边界执行。

## 目标

- 在后台新增一个顶级菜单 `系统管理`
- 在 `系统管理` 下规划 4 个二级菜单：
  - `用户管理`
  - `角色管理`
  - `菜单管理`
  - `权限管理`
- 首期采用前端静态菜单和静态路由实现，与当前 `apps/admin` 主路径保持一致
- 首期完整交付 `用户管理`，其余三个模块先建立稳定路由入口和占位页面
- 统一权限码命名，保证后续角色授权与菜单授权可直接复用

## 非目标

- 本次不直接切换到后端动态菜单树驱动
- 本次不一次性完成完整 RBAC 平台
- 本次不在 `packages/*` 中提前抽象尚未稳定的后台权限框架
- 本次不重构现有 admin 全站路由体系

## 方案对比

### 方案一：纯静态首期

做法：

- `apps/admin` 新增 `系统管理` 路由模块
- 菜单与路由继续由前端静态定义
- `apps/api` 只补用户管理接口和新的权限码返回

优点：

- 与当前后台实现最一致
- 改动边界清晰，最容易先把用户管理做起来
- 不会把菜单规划与权限平台建设强耦合

缺点：

- `菜单管理` 首期只能作为业务入口和占位页面存在，不能直接驱动运行时菜单

### 方案二：静态路由，后端先落菜单模型

做法：

- 前端运行时仍然使用静态路由
- 后端提前建设 `Role / Menu / Permission` 数据模型与管理接口
- 前端“菜单管理”先管理未来要接管的菜单树数据

优点：

- 为未来切换到后端动态菜单做更多前置铺垫

缺点：

- 首期范围扩大，用户管理会被权限平台建设拖慢

### 方案三：直接切到后端动态菜单

做法：

- `apps/api` 返回菜单树与权限树
- `apps/admin` 改为后端驱动注册菜单和路由

优点：

- 目标形态一步到位

缺点：

- 与当前仓库现状不匹配
- 当前后端缺少角色、菜单、权限模型
- 当前权限返回仍是硬编码，直接切换风险最高

## 结论

采用方案一：

- 首期使用 `前端静态菜单 + 前端静态路由`
- 顶级菜单固定为 `系统管理`
- 四个二级菜单一次性规划到位
- 只完整开发 `用户管理`
- `角色管理 / 菜单管理 / 权限管理` 首期先提供稳定占位页

同时，首期命名和目录结构必须按后续 RBAC 演进要求设计，避免后续返工一级菜单和权限命名。

## 菜单与路由设计

### 一级菜单

- 标题：`系统管理`
- 路径前缀：`/system`
- 路由名：`system`

该一级菜单作为独立业务域，与当前 `高歌体育 / 演示 / 测试` 并列，直接挂载到 [apps/admin/src/router/routes.ts](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/router/routes.ts) 的 `asyncRoutes` 中。

### 二级菜单

在 `系统管理` 下固定以下 4 个二级页面：

- `/system/user` 对应 `用户管理`
- `/system/role` 对应 `角色管理`
- `/system/menu` 对应 `菜单管理`
- `/system/permission` 对应 `权限管理`

### 路由层级策略

首期每个模块只建立一个列表页路由，不额外拆 `create / edit / detail` 子路由。新增、编辑、启用禁用、重置密码等动作默认通过列表页内抽屉或弹窗完成。

这样处理的原因：

- 当前 admin 已具备列表页 CRUD 组织方式，和现有模式一致
- 避免为了首期功能引入大量隐藏路由
- 先稳定菜单信息架构，后续某个模块变复杂时再补隐藏子路由即可

### 前端目录规划

- 新增 [apps/admin/src/router/modules/system/index.ts](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/router/modules/system/index.ts)
- 新增 [apps/admin/src/views/system/user/index.vue](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/views/system/user/index.vue)
- 新增 [apps/admin/src/views/system/role/index.vue](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/views/system/role/index.vue)
- 新增 [apps/admin/src/views/system/menu/index.vue](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/views/system/menu/index.vue)
- 新增 [apps/admin/src/views/system/permission/index.vue](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/views/system/permission/index.vue)

目录和命名按业务域 `system/<resource>` 固定，避免后续再迁移。

## 权限码规划

统一使用：

`system.<resource>.<action>`

这样可以同时覆盖页面访问权限、按钮级权限以及后续角色授权、菜单授权、接口守卫。

### 页面级权限

- `system.user.view`
- `system.role.view`
- `system.menu.view`
- `system.permission.view`

### 用户管理首期操作级权限

- `system.user.create`
- `system.user.update`
- `system.user.enable`
- `system.user.disable`
- `system.user.reset-password`
- `system.user.delete`

### 后续模块预留权限

- `system.role.create`
- `system.role.update`
- `system.role.delete`
- `system.role.assign-permission`
- `system.menu.create`
- `system.menu.update`
- `system.menu.delete`
- `system.menu.sort`
- `system.permission.create`
- `system.permission.update`
- `system.permission.delete`

### 路由与权限绑定

首期菜单显示和路由访问继续复用现有 `meta.auth` 机制：

- `用户管理` 路由使用 `meta.auth = ['system.user.view']`
- `角色管理` 路由使用 `meta.auth = ['system.role.view']`
- `菜单管理` 路由使用 `meta.auth = ['system.menu.view']`
- `权限管理` 路由使用 `meta.auth = ['system.permission.view']`

按钮级权限继续通过 [apps/admin/src/composables/useAuth.ts](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/composables/useAuth.ts) 控制。

## 首期执行边界

### 前端

首期前端做两类事情：

1. 建立 `系统管理` 菜单和 4 个二级路由入口
2. 只完整实现 `用户管理` 页面，其余 3 个页面先作为占位页

占位页需要具备明确标题和“建设中”状态，避免出现空白页或未接线路由。

### 后端

首期后端只补“用户管理最小闭环”，不提前引入完整 RBAC 表结构。范围包括：

- 用户列表
- 新增后台用户
- 编辑后台用户
- 启用用户
- 禁用用户
- 重置密码
- `auth/permission` 返回中补齐 `system.*` 页面权限与 `system.user.*` 操作权限

当前 `User.role` 继续保留字符串模型，不在首期切换为角色关联表。

## 数据模型策略

首期不新增 `Role / Menu / Permission` Prisma 实体。原因是当前目标是先让 `用户管理` 可用，而不是一次完成完整权限平台。

这意味着：

- `User.role` 暂时继续承担“后台管理员 / 普通用户”这一级角色识别
- `admin` 用户首期默认拥有全部 `system.*` 权限
- 后续真正开发 `角色管理 / 菜单管理 / 权限管理` 时，再引入独立实体与关联表

## 第二阶段演进方向

待首期 `用户管理` 稳定后，再进入真正的权限平台建设，顺序建议如下：

1. Prisma 增加 `Role / Permission / Menu` 及关联表
2. 后端按用户角色动态聚合权限
3. `User.role` 从单字符串逐步过渡到角色关联
4. 菜单管理开始真正管理菜单树数据
5. 评估是否从静态菜单切换到后端动态菜单驱动

第二阶段开始前，不应在首期代码里伪造完整 RBAC 架构，以免引入长期负担。

## 文件职责建议

### admin

- `router/modules/system/index.ts`
  - 只定义 `系统管理` 的模块路由树

- `views/system/user/index.vue`
  - 用户管理列表页，承载查询、列表、弹窗或抽屉 CRUD 入口

- `views/system/role/index.vue`
- `views/system/menu/index.vue`
- `views/system/permission/index.vue`
  - 首期作为占位页，保留后续真实模块入口

- 视需要新增 `views/system/user/auth.ts`
  - 统一声明用户管理页面用到的权限常量

- `api/user` 或新增 `api/system/user`
  - 承载后台用户管理请求

### api

- 新增独立的系统用户管理模块，例如 `modules/system/user`
  - 与现有 `football/*` 业务域平级
  - 负责后台系统用户 CRUD 与状态管理

- `modules/auth/services/auth.service.ts`
  - 只扩展权限码返回，不在这里混入用户管理业务逻辑

这样可以保证“鉴权”和“用户管理”虽然相关，但模块职责仍然分离。

## 错误处理与约束

- 首期用户管理接口必须校验后台管理员权限，不允许普通用户进入后台用户管理流程
- 禁用用户后，后续其登录与资料读取要遵循现有 `status` 逻辑
- 重置密码应作为独立操作，不混入普通编辑接口
- 占位页面必须可正常路由进入，不能报错或出现菜单点击无响应

## 测试与验收

### admin 验收

- 进入后台后可见新的一级菜单 `系统管理`
- `系统管理` 下可见 4 个二级菜单
- 没有 `system.user.view` 时，`用户管理` 菜单不可见
- `用户管理` 页面按钮按 `system.user.*` 权限正确显隐
- `角色管理 / 菜单管理 / 权限管理` 可打开占位页且无报错

### api 验收

- 管理员可获取用户列表并完成新增、编辑、启用禁用、重置密码
- 非管理员访问后台用户管理接口时被拒绝
- `auth/permission` 返回包含 `system.*` 与 `system.user.*` 权限
- 被禁用用户无法继续作为有效后台用户使用现有后台链路

## 实施建议

推荐分两批执行：

### 第一批

- 建立 `系统管理` 菜单和路由骨架
- 新增 4 个页面入口
- 打通 `用户管理` 后端接口和前端页面
- 扩展首期权限码

### 第二批

- 开始建设 `角色管理 / 菜单管理 / 权限管理`
- 同步引入独立 RBAC 数据模型
- 评估动态菜单接管时机

这种拆分可以保证当前需求尽快落地，同时不把后续完整权限平台的成本提前压到首期开发中。
