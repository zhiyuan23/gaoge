# Admin 工程底座同步

## 事实源与职责

- 知识库同步组维护 active 成员。
- `gaoge/apps/admin` 是通用底座上游参考。
- 本文只维护技术边界，不重复成员名单。

## 默认同步范围

- `layouts`、通用菜单 Store、`settings.default`、`Settings` 类型和聚焦测试。
- 新文件必须能由通用布局或菜单行为直接证明。

## 默认排除范围

- 业务路由、业务菜单常量、RBAC seed、品牌、端口、API 和部署配置。

## 基线判断

- 比较源修改前 blob、源当前 blob 和目标当前 blob。
- `BASE` 可迁移，`MISSING` 可新增，`DIVERGED` 必须语义合并。

## 冲突处理

- dirty 目标停止写入。
- 禁止 `reset`、`checkout` 和整目录覆盖。
- 项目特化优先保留，并由测试或静态断言验证。

## 验证

- 运行聚焦测试、ESLint、Stylelint、Admin typecheck、production build 和 `git diff --check`。
- 每个仓库独立验证。

## Skill 约定

- Skill 动态查询 `kb:topic:gaoge-admin-foundation-sync`。
- Skill 不硬编码长期成员，不自动覆盖 `DIVERGED` 文件。
