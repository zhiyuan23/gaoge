# Admin 工程底座同步

## 事实源与职责

- 知识库同步组维护 active 成员。
- `gaoge/apps/admin` 是通用底座上游参考。
- 本文只维护技术边界，不重复成员名单。

## 默认同步范围

- `layouts`、通用菜单 Store、`settings.default`、`Settings` 类型和聚焦测试。
- RBAC/导航机制：Resource 有效权限、服务端 Menu 事实源、受控页面注册表、fail-closed、内置字段所有权、精确同步、自定义依赖保护和一致性测试。
- Admin 交互机制：菜单/资源同页工作区、图标名称规范化和语义化次级文字颜色。
- 新文件必须能由通用布局或菜单行为直接证明。

## 默认排除范围

- 业务 `routeName`、组件映射、菜单树、Permission/Resource 注册表与绑定、RBAC seed、品牌、租户、端口、API 和部署配置。

目标项目必须依据自己的真实页面、权限模型和 migration 历史重新配置上述项目专属内容，禁止复制 Gaoge 的菜单节点和权限码作为默认数据。

## 基线判断

- 比较源修改前 blob、源当前 blob 和目标当前 blob。
- `BASE` 可迁移，`MISSING` 可新增，`DIVERGED` 必须语义合并。

## 冲突处理

- dirty 目标停止写入。
- 禁止 `reset`、`checkout` 和整目录覆盖。
- 项目特化优先保留，并由测试或静态断言验证。

## 验证

- 运行聚焦测试、ESLint、Stylelint、Admin typecheck、production build 和 `git diff --check`。
- 涉及 RBAC 时另运行空库/既有库 migration、内置同步幂等与依赖阻断、权限矩阵、导航/配置树顺序、未知 routeName 失败关闭和管理员/受限角色浏览器回归。
- 每个仓库独立验证。

## 一次同步顺序

1. 发现 active 成员并冻结源/目标 branch、HEAD、dirty 状态与数据库范围。
2. 盘点目标项目页面注册、菜单注册表、权限模型、migration 和历史兼容数据。
3. 将变更标记为 `BASE`、`MISSING`、`DIVERGED`，并区分通用机制与项目专属数据。
4. 先语义合并机制，再按目标项目真实业务适配 routeName、Resource、Permission 和菜单树。
5. 在项目独立数据库执行 migration 与精确内置同步，禁止复用其他项目数据库。
6. 完成自动化、接口和浏览器验证后，更新目标仓总设计、实施记录与知识库 CURRENT。

当前 RBAC/服务端导航的完整设计和验证证据见：

- [Admin RBAC 工程底座总设计](../superpowers/specs/2026-08-26-admin-rbac-foundation-design.md)
- [Admin RBAC 工程底座实施与验证记录](../superpowers/plans/2026-08-26-admin-rbac-foundation-implementation.md)

## Skill 约定

- Skill 动态查询 `kb:topic:gaoge-admin-foundation-sync`。
- Skill 不硬编码长期成员，不自动覆盖 `DIVERGED` 文件。
