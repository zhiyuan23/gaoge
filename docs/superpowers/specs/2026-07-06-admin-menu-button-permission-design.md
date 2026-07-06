# Admin 菜单权限与按钮权限设计

## 背景

当前仓库已经具备第一轮后台 RBAC 基础：

- `apps/api/prisma/schema.prisma` 已有 `Role / Permission / Menu` 及 `UserRole / RolePermission / MenuPermission` 关联表
- `apps/api` 已有系统用户、角色、菜单、权限管理服务
- `apps/admin` 已有用户管理、角色管理、菜单管理、权限管理页面
- 后台运行时已经通过 `/auth/permission` 返回 `permissions: string[]`
- admin 前端已经使用 `meta.auth` 控制页面访问，使用 `v-auth` 和表格 action `auth` 控制按钮显示

当前不足在于：菜单权限和按钮权限虽然底层都已经能用权限码表达，但后台配置体验仍偏技术化。管理员需要面对平铺权限码，难以直观理解“哪个角色能看到哪些菜单、能点击哪些按钮”。

本次目标是在当前用户权限功能内重构，不推翻现有权限码和守卫体系，把权限配置体验升级为主流中后台的“菜单树 + 页面访问 + 按钮操作”模式。

## 目标

- 管理员可以在 admin 后台配置菜单访问权限和按钮操作权限
- 角色授权时按菜单树展示页面和按钮，避免平铺权限码
- 当前登录用户侧栏菜单由后端按角色权限过滤
- 页面访问继续由 `meta.auth` 和权限码控制
- 按钮显示继续由 `v-auth`、表格 action `auth` 和权限码控制
- 后端接口继续用 `RequirePermissions` 做最终安全校验
- 保持现有 `Permission` 三段式权限码和 `permissions: string[]` 运行时协议

## 非目标

- 不做任意 Vue 组件路径动态加载
- 不做低代码页面渲染
- 不做数据权限，例如“只能看自己创建的数据”
- 不做字段权限，例如“隐藏手机号字段”
- 不做按钮级动态渲染配置，只控制已经写在页面里的按钮是否可见
- 不把小程序普通用户纳入后台 RBAC
- 不新增独立按钮权限表

## 总体方案

采用“已开发页面白名单 + 数据化菜单 + 统一权限码”的方案。

数据库负责：

- 菜单标题、图标、路径、路由名、排序、状态、显隐
- 菜单与页面访问权限的绑定
- 权限字典维护
- 角色与权限绑定
- 用户与角色绑定

前端代码负责：

- 实际页面组件
- 路由白名单和组件加载
- 页面内已有按钮和表格行操作
- `meta.auth`、`v-auth`、表格 action `auth` 的权限声明

运行时仍以权限码作为唯一授权判断依据：

```text
用户 -> 角色 -> 权限码
菜单 -> 页面访问权限码
```

## 权限语义

权限继续使用三段式：

```text
module.resource.action
```

例如：

```text
system.user.view
system.user.create
system.user.update
system.user.delete
system.user.reset-password
```

权限按 `action` 分为两类：

- 页面权限：`action = view`，用于菜单显示和页面访问
- 按钮权限：`action != view`，用于页面内按钮、表格行操作和接口写操作

同一个 `module.resource` 下的权限天然属于同一个页面资源。例如 `system.user.*` 都归属于“用户管理”。

## 数据模型

保持当前模型，不新增表。

### `Permission`

继续作为唯一权限字典。

- `code`：三段式权限码
- `module`：模块
- `resource`：资源
- `action`：动作
- `status`：启用状态
- `isBuiltIn`：是否内置

页面权限和按钮权限都存在这张表里。

### `Menu`

继续作为后台菜单树。

菜单只表达导航入口，不直接表达按钮权限。

### `MenuPermission`

语义收敛为“菜单绑定的页面访问权限”。

规则：

- `catalog` 目录菜单可以不绑定权限
- `menu` 页面菜单必须绑定一个或多个页面权限，默认推荐一个 `*.view`
- 菜单绑定权限时只允许绑定 `action = view` 的权限
- 菜单不直接绑定 `create / update / delete` 等按钮权限

### `RolePermission`

继续表达角色拥有的所有权限。

规则：

- 可以绑定页面权限
- 可以绑定按钮权限
- 角色授权保存时自动保证按钮权限对应的页面权限也被绑定

## 后端接口设计

### 保留接口

继续保留现有系统接口：

```text
GET /auth/profile
GET /auth/permission

GET /system/permissions
GET /system/permissions/grouped
POST /system/permissions
PATCH /system/permissions/:id
DELETE /system/permissions/:id
POST /system/permissions/sync-builtins

GET /system/menus/tree
POST /system/menus
PATCH /system/menus/:id
PATCH /system/menus/:id/sort
PATCH /system/menus/:id/permissions
DELETE /system/menus/:id

GET /system/roles
GET /system/roles/:id/permissions
PATCH /system/roles/:id/permissions
```

### 新增 `GET /auth/menus`

返回当前登录用户可见菜单树，供 admin 侧栏使用。

过滤规则：

- 只返回 `status = active`
- 只返回 `visible = true`
- 页面菜单必须绑定页面权限
- 用户必须拥有菜单绑定的任一页面权限
- 目录菜单无需自身权限，但必须至少有一个可见子节点
- 无可见子节点的目录不返回
- 超级管理员按拥有全部内置权限处理

返回结构：

```ts
interface AuthMenu {
  id: number
  parentId: number | null
  title: string
  icon: string | null
  path: string
  routeName: string
  menuType: 'catalog' | 'menu'
  permissions: string[]
  children: AuthMenu[]
}
```

### 新增 `GET /system/permissions/tree`

返回角色授权弹窗所需的菜单权限树。

构建规则：

1. 读取完整菜单树
2. 页面菜单读取其绑定的 `view` 权限
3. 根据页面权限的 `module.resource` 查找同资源下所有 active 权限
4. `view` 展示为页面访问
5. 其他 action 展示为按钮权限
6. 目录只承载层级，不直接对应权限

页面菜单节点本身就是“页面访问”的勾选项，不再额外重复生成一个 `view` 子节点。页面菜单节点下面只放按钮权限节点。

返回结构：

```ts
interface SystemPermissionTreeNode {
  id: string
  label: string
  type: 'catalog' | 'menu' | 'permission'
  menuId?: number
  permissionId?: number
  permissionCode?: string
  disabled?: boolean
  children: SystemPermissionTreeNode[]
}
```

示例：

```json
[
  {
    "id": "menu:system",
    "label": "用户权限",
    "type": "catalog",
    "children": [
      {
        "id": "menu:systemUser",
        "label": "用户管理",
        "type": "menu",
        "permissionId": 31,
        "permissionCode": "system.user.view",
        "children": [
          {
            "id": "permission:system.user.create",
            "label": "新增",
            "type": "permission",
            "permissionId": 32,
            "permissionCode": "system.user.create",
            "children": []
          }
        ]
      }
    ]
  }
]
```

### 角色权限保存校验

`PATCH /system/roles/:id/permissions` 保存前后端都做一致性整理：

- 勾选按钮权限时，自动补上同 `module.resource` 的 `view` 页面权限
- 取消页面权限时，移除该页面下按钮权限
- 不允许新增绑定 inactive 权限
- `super_admin` 角色不允许被保存为空权限

后端做最终归一化，避免绕过前端写入不一致配置。

## Admin 页面设计

### 菜单管理

菜单管理负责配置导航入口。

树表列：

```text
菜单标题
类型
路径
路由名
页面权限
按钮权限数
排序
状态
可见
操作
```

表单字段：

```text
父级菜单
菜单类型：目录 / 页面
菜单标题
菜单标识
图标
路径
路由名
排序
状态
是否显示
页面权限
```

交互规则：

- 类型为目录时，页面权限隐藏或禁用
- 类型为页面时，页面权限必填
- 页面权限下拉只展示 `action = view` 的权限
- 选择页面权限后，展示同 `module.resource` 下按钮权限预览
- 按钮权限预览只读，不在菜单管理里编辑按钮权限
- 菜单绑定的路由名必须对应已开发页面白名单，否则列表提示“路由未接入”

操作：

- 新增根菜单
- 新增子菜单
- 编辑
- 权限预览
- 删除非内置且无子菜单的菜单

### 权限管理

权限管理负责维护权限字典。

列表新增友好字段：

```text
权限类型：页面 / 按钮
所属菜单：菜单标题 / 未绑定菜单
```

类型规则：

- `action = view` 显示“页面”
- 其他 action 显示“按钮”

所属菜单规则：

- 根据 `module.resource` 查找绑定对应 `view` 权限的菜单
- 能找到则显示菜单标题
- 找不到则显示“未绑定菜单”

权限新增和编辑继续遵循：

- 新增时 `code` 必填且唯一
- `code` 必须是 `module.resource.action`
- 保存后自动解析 `module / resource / action`
- 编辑时不允许修改 `code / module / resource / action / isBuiltIn`
- 内置权限不可删除
- 已绑定角色或菜单的权限不可删除

### 角色管理

角色管理的“分配权限”弹窗重构为树形授权体验。

弹窗结构：

```text
顶部：角色名称、已选页面数、已选按钮数、搜索
主体：权限树
底部：取消、保存
```

树形展示：

```text
[ ] 用户权限
  [ ] 用户管理（页面访问）
      [ ] 新增  [ ] 编辑  [ ] 启用  [ ] 停用  [ ] 重置密码  [ ] 删除
```

交互规则：

- 勾选目录：批量勾选下面所有页面和按钮
- 勾选页面访问：允许进入该页面
- 勾选按钮：自动勾选该页面访问权限
- 取消页面访问：自动取消该页面下所有按钮权限
- 页面下部分按钮勾选时，页面节点显示半选
- 支持一键全选当前页面权限
- 支持只勾页面访问，不勾按钮，用于只读角色
- 支持按菜单标题、权限名称、权限码搜索

最终提交仍是：

```ts
{
  permissionIds: number[]
}
```

### 用户管理

用户管理继续维护用户和角色关系。

规则：

- 一个后台用户可以绑定多个角色
- 登录后权限取所有 active 角色的 active 权限合集
- 重复权限自动去重
- 用户没有任何 active 角色时，禁止后台登录或提示无后台权限，沿用当前逻辑

## 运行时设计

admin 登录后加载：

```text
GET /auth/profile
GET /auth/permission
GET /auth/menus
```

运行时职责：

- `/auth/profile` 返回当前用户资料
- `/auth/permission` 返回当前用户权限码合集
- `/auth/menus` 返回当前用户可见菜单树

前端：

- 侧栏菜单优先使用 `/auth/menus`
- 页面访问继续使用路由 `meta.auth`
- 页面按钮继续使用 `v-auth`
- 表格行操作继续使用 action `auth`
- 前端仍保留路由组件白名单，不因为数据库菜单动态加载未知页面

后端：

- 所有需要保护的接口继续使用 `JwtAuthGuard + PermissionsGuard + RequirePermissions`
- 前端隐藏按钮只作为体验优化，不作为安全边界

## 超级管理员与内置权限

超级管理员规则：

- `super_admin` 默认拥有所有内置权限
- 不允许停用 `super_admin`
- 不允许把 `super_admin` 权限保存为空
- 同步内置权限后，超级管理员自动拥有新增内置权限

内置权限规则：

- 内置权限可编辑名称、说明、状态
- 内置权限码不可修改
- 内置权限不可删除
- 同步内置权限只 upsert，不删除自定义权限

## 异常和空状态

- 菜单没有绑定页面权限：角色授权树标记“未绑定页面权限”，不可勾选按钮
- 权限没有对应菜单：权限管理显示“未绑定菜单”
- 角色没有任何权限：允许保存，但该角色用户登录后没有后台入口
- 菜单绑定的页面权限被停用：运行时菜单不显示，授权树标记停用
- 后端菜单指向未接入前端路由：admin 侧栏过滤或禁用，菜单管理提示“路由未接入”

## 分阶段实现

### 阶段一：后端能力

- 新增 `/auth/menus`
- 新增 `/system/permissions/tree`
- 角色权限保存增加页面权限与按钮权限一致性归一化
- 菜单权限绑定限制为 `view` 权限

### 阶段二：共享类型和 admin API

- 在 `packages/shared/types` 增加权限树和当前用户菜单类型
- 在 `apps/admin/src/api` 增加对应 API 封装
- 保持现有权限响应兼容

### 阶段三：admin 页面重构

- 菜单管理增加页面权限选择、按钮权限预览、路由接入提示
- 权限管理增加权限类型和所属菜单展示
- 角色授权弹窗改成菜单树授权
- 用户管理保持多角色分配模式

### 阶段四：运行时接入

- 侧栏菜单切到 `/auth/menus`
- 页面访问和按钮权限继续使用现有权限码判断
- 保留静态路由白名单

## 验证要求

后端：

- 覆盖 `/auth/menus` 对菜单状态、显隐、权限、空目录的过滤
- 覆盖 `/system/permissions/tree` 对菜单和按钮权限的归组
- 覆盖角色保存时按钮权限自动补页面权限
- 覆盖取消页面权限时移除按钮权限
- 覆盖 inactive 权限不参与运行时授权

前端：

- `pnpm --filter @gaoge/app-admin typecheck`
- 角色授权弹窗勾选、半选、搜索、保存流程可用
- 菜单管理页面权限选择和按钮预览可用
- 登录后侧栏菜单按当前用户权限展示

API：

- `pnpm --filter @gaoge/app-api typecheck`
- `pnpm --filter @gaoge/app-api test`

若实现中涉及 Prisma 表结构变更，必须按 `docs/conventions/testing-and-verification.md` 的 Prisma 小节执行迁移、生成 Prisma Client、重启 API 并做 smoke test。本设计默认不需要新增表，但实现时若发现必须调整结构，应补充迁移和验证。

## 风险与处理

### 菜单配置和前端路由不一致

后端菜单不负责动态加载页面组件。admin 侧栏必须基于前端路由白名单过滤未知路由，菜单管理中提示“路由未接入”。

### 管理员误配按钮权限

角色授权保存时前后端都做归一化：按钮权限自动补页面权限，取消页面权限自动取消按钮权限。

### 权限码命名不友好

权限树默认展示中文权限名称，权限码只作为辅助信息，不作为管理员主要操作对象。

### 自定义权限无法归属菜单

自定义按钮权限必须拥有同 `module.resource` 的 `view` 页面权限并被菜单绑定，才能在角色授权树中自然归属。否则在权限管理中显示“未绑定菜单”，提示管理员补齐页面权限或菜单绑定。
