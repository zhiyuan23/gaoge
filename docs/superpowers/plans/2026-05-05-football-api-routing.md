# Football API Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `apps/api` 的足球资源统一迁移到 `/football/*`，去掉全局 `/api` 前缀，并同步切换 `apps/admin` 的后台登录与资源调用路径。

**Architecture:** 后端先完成路由与模块边界重组，再在同一轮里切换 admin 调用封装。资源仍保持“一套 URL + 不同 guard”的模型，不新增兼容层，不扩展 spec 未要求的新业务。测试以现有 unit/e2e 为主，补足本次新增的鉴权与路由断言。

**Tech Stack:** NestJS 11, Prisma 5, Jest, Vue 3, Axios, pnpm workspace, Turborepo

---

### Task 1: 收敛后端入口与认证路由契约

**Files:**

- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/src/modules/auth/controllers/auth.controller.ts`
- Modify: `apps/api/src/modules/auth/dto/login.dto.ts`
- Modify: `apps/api/src/modules/auth/services/auth.service.ts`
- Modify: `apps/api/src/modules/auth/services/auth.service.spec.ts`
- Modify: `packages/shared/types/src/auth.ts`
- Modify: `apps/api/test/app.e2e-spec.ts`

- [ ] 去掉 `main.ts` 里的 `setGlobalPrefix('api')` 与 Swagger `addServer('/api')`，保留 `api-docs` 文档入口不变。
- [ ] 将认证路由从 `/auth/admin-login`、`/auth/wechat-login` 收敛到 `/auth/admin/login`、`/auth/miniapp/login`。
- [ ] 把 `WechatLoginDto` 重命名为 miniapp 登录 DTO，并让第一版只要求 `code` 必填，`nickname/avatarUrl` 继续作为可选字段。
- [ ] 在 `AuthService` 里保留现有微信登录链路，但输出语义改成 miniapp 登录；同时让 JWT payload 至少稳定包含 `role`，并补充 `clientType` 区分 `admin` 与 `miniapp`。
- [ ] 更新 `auth.service.spec.ts`，覆盖 admin 登录成功、非 admin 拒绝、miniapp 登录创建或更新用户的核心契约。
- [ ] 更新 `app.e2e-spec.ts`，把根路径断言从 `/api` 改成 `/`，确保测试基线与去前缀后的真实行为一致。

### Task 2: 重组足球领域模块并切换控制器前缀

**Files:**

- Create: `apps/api/src/modules/football/football.module.ts`
- Move/modify: `apps/api/src/modules/players/*` -> `apps/api/src/modules/football/players/*`
- Move/modify: `apps/api/src/modules/teams/*` -> `apps/api/src/modules/football/teams/*`
- Move/modify: `apps/api/src/modules/match-rounds/*` -> `apps/api/src/modules/football/match-rounds/*`
- Move/modify: `apps/api/src/modules/team/*` -> `apps/api/src/modules/football/fund/*`
- Modify: `apps/api/src/app.module.ts`

- [ ] 创建 `FootballModule`，只负责聚合 `players`、`teams`、`match-rounds`、`fund` 四个足球子模块。
- [ ] 把现有四组模块源码迁入 `src/modules/football/` 目录，保持 service/dto 逻辑尽量原样，避免顺手重构无关行为。
- [ ] 将控制器前缀改为 `football/players`、`football/teams`、`football/match-rounds`、`football/fund`。
- [ ] 删除旧 `TeamController` 里“任何登录用户可创建 fund” 的差异，统一 fund 的写接口为 admin-only。
- [ ] 更新 `AppModule`，移除顶层 `PlayersModule`、`TeamsModule`、`MatchRoundsModule`、`TeamModule` 的直接注册，改为只引入 `FootballModule`。

### Task 3: 同步 admin 调用层到新路径

**Files:**

- Modify: `apps/admin/src/api/user/index.ts`
- Modify: `apps/admin/src/api/players/index.ts`
- Modify: `apps/admin/src/api/teams/index.ts`
- Modify: `apps/admin/src/api/match-rounds/index.ts`

- [ ] 将后台登录请求切换到 `auth/admin/login`，保留 `profile`、`permission`、`logout` 原路径。
- [ ] 将球员、球队、比赛的调用封装切换到 `/football/*` 新路径。
- [ ] 保持读取接口的 `noAuth: true` 语义不变，避免把匿名可读能力误改成必须登录。

### Task 4: 验证与收尾

**Files:**

- Verify only: `apps/api/**/*`, `apps/admin/**/*`, `packages/shared/types/**/*`

- [ ] 运行 `pnpm --filter @gaoge/app-api exec jest --runInBand`，确认本次改动没有新增 API 单测回归；若仍有既有基线失败，单独标注。
- [ ] 运行 `pnpm --filter @gaoge/app-api test:e2e`
- [ ] 运行 `pnpm --filter @gaoge/app-api typecheck`
- [ ] 运行 `pnpm --filter @gaoge/app-admin typecheck`
- [ ] 复查 `Swagger` 和前端请求封装里不再残留 `/api/...` 旧路径语义。
