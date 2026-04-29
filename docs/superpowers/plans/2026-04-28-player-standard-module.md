# Player Standard Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `apps/admin` 中新增 `球员标准模块` 菜单页，参考 `basic-main` 的标准模块列表示例页，使用现有球员数据与表单作为占位能力。

**Architecture:** 新页面只负责标准模块演示交互，复用现有球员模块的搜索 schema、表格 schema、表单组件和 API。为支持批量操作骨架，对 `EsTable` 补充最小的多选列与选择变更事件支持。

**Tech Stack:** Vue 3 `script setup`、TypeScript、Element Plus、现有 `EsSearch` / `EsTable` / `FaDrawer`

---

## 文件结构

- 新建：`apps/admin/src/views/gaoge/player_standard_module/index.vue`
- 新建：`apps/admin/src/views/gaoge/player_standard_module/components/PlayerStandardFormDialog.vue`
- 新建：`apps/admin/src/views/gaoge/player_standard_module/components/PlayerStandardFormDrawer.vue`
- 修改：`apps/admin/src/router/modules/gaoge/index.ts`
- 修改：`apps/admin/src/components/common/EsTable/index.vue`
- 修改：`apps/admin/src/components/common/EsTable/types.ts`

## 任务

### Task 1: 扩展 `EsTable` 多选能力

- [ ] 增加 `showSelection` prop，默认 `false`
- [ ] 为 `EsTableEmits` 增加 `selectionChange`
- [ ] 在 `ElTable` 上转发 `selection-change`
- [ ] 在内置列逻辑中兼容 `selection` / `index`

### Task 2: 新建标准模块表单壳

- [ ] 新建 `PlayerStandardFormDialog.vue`
- [ ] 新建 `PlayerStandardFormDrawer.vue`
- [ ] 两者都复用 `PlayerForm.vue` 与现有 mapper/defaults

### Task 3: 新建标准模块页面

- [ ] 实现说明区
- [ ] 实现列表高度切换
- [ ] 实现表单模式切换
- [ ] 接入球员搜索、列表、分页、删除
- [ ] 接入多选与批量操作骨架
- [ ] 在 `modal` / `drawer` 下实现新增编辑
- [ ] 在 `router` 模式下给出未启用提示

### Task 4: 接路由与校验

- [ ] 在 `gaoge` 路由下新增 `player-standard`
- [ ] 跑 `eslint --fix`
- [ ] 跑 `stylelint --fix`
- [ ] 跑 `pnpm --dir apps/admin typecheck`
