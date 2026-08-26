# Admin 导航与路由注册规范

本规范适用于 `apps/admin` 的业务导航与动态路由。

## 职责边界

- 服务端 `Menu` 管理业务导航的标题、图标、结构、排序、状态和显隐。
- 前端 `admin-page-registry` 只负责 `routeName` 到页面组件的受控映射，不保存业务菜单树。
- API Guard 始终是最终授权点；前端导航和路由隐藏不能替代服务端授权。

## 新增与调整业务页面

新增可配置业务页面时，先将稳定的页面标识加入 `ADMIN_PAGE_ROUTE_NAMES`，再加入 `admin-page-registry` 的组件注册表，最后配置服务端菜单。`routeName` 是服务端菜单和注册表之间唯一的页面契约。

- `group` 不对应路由，仅承载业务分组。
- `catalog` 使用 `Layout`，承载其下页面并跳转到首个有效页面。
- `menu` 必须注册组件；未注册的页面由客户端安全隐藏并输出诊断。
- 业务菜单不得重新写入 `router/modules`。那里只可保留框架示例、测试或真正固定的系统路由；固定隐藏兼容路由单独维护在 `fixed-hidden-routes.ts`。

## 跨仓库同步

跨 Gaoge Admin/RBAC 仓库只同步机制：服务端 Menu 来源、受控页面注册表、fail-closed 回退和一致性测试。不得同步本项目的实际 registry key、组件映射或业务菜单树；各项目必须按自身产品和权限模型配置标题、图标、层级和排序。

同步还必须保留内置字段所有权、精确内置数据回收和自定义依赖阻断：代码维护结构字段，数据库维护标题、图标、排序、状态和显隐；任何目标项目都必须使用独立数据库与自己的注册表验证，不能把其他 Gaoge 项目的内置数据当作本项目默认值。

完整架构、当前 Gaoge 菜单树和一次同步清单见 [Admin RBAC 工程底座总设计](../superpowers/specs/2026-08-26-admin-rbac-foundation-design.md) 与 [实施验证记录](../superpowers/plans/2026-08-26-admin-rbac-foundation-implementation.md)。
