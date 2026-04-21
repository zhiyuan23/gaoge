# Admin/API Lint 收敛实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `apps/admin` 与 `apps/api` 在不破坏现有可运行能力的前提下通过根级 `pnpm lint`，并把迁移期豁免控制在局部、显式、可回收的范围内。

**Architecture:** 先收敛规则冲突和工具噪音，再批量自动修复可自动处理的问题，最后只对必须手改的历史代码做最小补丁。根仓库规范继续作为主规范，旧仓库习惯只在迁移期做局部兼容。

**Tech Stack:** pnpm, Turborepo, ESLint 9 flat config, Prettier 3, Stylelint 17, Vue 3, NestJS, TypeScript

---

### Task 1: 收敛迁移期规则冲突

**Files:**

- Modify: `eslint.config.js`
- Modify: `stylelint.config.js`
- Modify: `lint-staged.config.js`

- [ ] 明确 `apps/admin` 与 `apps/api` 的迁移期局部豁免边界，只处理会系统性阻塞 lint 的规则。
- [ ] 去掉已迁入代码中的无效 ESLint 规则引用噪音，避免“规则不存在”直接阻塞。
- [ ] 调整 stylelint/暂存区扫描范围，避免 vendor 或生成文件反复进入校验。

### Task 2: 批量自动修复可自动处理的问题

**Files:**

- Modify: `apps/admin/**/*`
- Modify: `apps/api/**/*`

- [ ] 先对 `apps/admin` 与 `apps/api` 分别执行 `eslint --fix`。
- [ ] 再执行必要的 `prettier --write` 与 `stylelint --fix`。
- [ ] 复查自动修复后的剩余错误，按规则类型重新分类。

### Task 3: 修复少量必须手改的问题

**Files:**

- Modify: `apps/admin/src/**/*`
- Modify: `apps/api/src/**/*`

- [ ] 只处理无法通过配置或自动修复解决的少量剩余错误。
- [ ] 优先修复影响 lint 通过但改动面小的问题，不在这一轮顺手做无关重构。

### Task 4: 验证与文档同步

**Files:**

- Modify: `AGENTS.md`（如果规则边界变化）
- Modify: `README.md`（如果开发流程说明变化）

- [ ] 运行 `pnpm lint`
- [ ] 运行 `pnpm typecheck`
- [ ] 必要时补充文档中对迁移期规则边界的说明
- [ ] 用中文 conventional commit 提交
