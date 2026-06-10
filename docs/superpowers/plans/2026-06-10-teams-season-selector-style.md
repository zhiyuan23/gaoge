# Teams Season Selector Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `apps/web/src/views/TeamsPage.vue` 的赛季切换器重做为标题右侧的单行胶囊样式，并保持现有赛季切换逻辑可用。

**Architecture:** 保持现有 `seasonYear` / `seasonName` 状态和 `loadStandings()` 数据流不变，只调整模板结构与局部样式。测试侧新增一个围绕赛季切换器 DOM 和交互的用例，先红后绿，避免只做视觉改动而漏掉行为回归。

**Tech Stack:** Vue 3、Vue Test Utils、Vitest、Tailwind 原子类、scoped CSS

---

### Task 1: 为新的赛季切换器结构补一个失败测试

**Files:**

- Modify: `apps/web/src/views/TeamsPage.test.js`

- [ ] **Step 1: 写一个失败测试，锁定新的 DOM 结构和交互**

在 `apps/web/src/views/TeamsPage.test.js` 新增一个用例，断言：

- 存在年份 `select`
- 存在四个赛季切换按钮
- 点击赛季按钮会触发新的 standings 请求

- [ ] **Step 2: 运行单测，确认它先失败**

Run: `pnpm --filter @gaoge/app-web test -- src/views/TeamsPage.test.js`

Expected:

- 失败点落在“赛季标签按钮不存在”或“找不到新的选择器结构”

### Task 2: 重做 `TeamsPage.vue` 里的赛季切换器模板与样式

**Files:**

- Modify: `apps/web/src/views/TeamsPage.vue`

- [ ] **Step 1: 调整模板结构**

把当前两列 `grid` 的两个 `select` 改为：

- 外层单行胶囊容器
- 左侧年份 `select`
- 右侧赛季按钮组

保留现有 `seasonYear` / `seasonName` 状态，不引入新的共享组件。

- [ ] **Step 2: 补充最小实现样式**

在 `TeamsPage.vue` 中补充：

- 胶囊外层
- 年份选择器的箭头和去原生化样式
- 赛季按钮默认、hover、active 样式
- 移动端换行规则

- [ ] **Step 3: 保持逻辑最小化**

赛季按钮通过直接设置 `seasonName` 触发已有 watch，不修改 `loadStandings()`。

### Task 3: 跑绿并做页面级验证

**Files:**

- Modify: `apps/web/src/views/TeamsPage.test.js`
- Modify: `apps/web/src/views/TeamsPage.vue`

- [ ] **Step 1: 重新运行目标测试，确认通过**

Run: `pnpm --filter @gaoge/app-web test -- src/views/TeamsPage.test.js`

Expected:

- `TeamsPage.test.js` 全部通过

- [ ] **Step 2: 运行 web 应用类型检查或等价最小校验**

Run: `pnpm --filter @gaoge/app-web typecheck`

Expected:

- exit 0

- [ ] **Step 3: 记录结果并准备交付**

交付时说明：

- 哪些结构被改了
- 运行了哪些验证命令
- 如果没有浏览器视觉验收，则明确说明
