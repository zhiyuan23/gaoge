# 测试与校验规范

本规范用于约束仓库内不同改动范围下的最低验证标准。

## 核心原则

- 不在没有新鲜验证证据的前提下宣称“已完成”或“可用”
- 优先跑与改动最贴近的校验，再决定是否扩大到全仓
- 文档改动、样式改动、业务逻辑改动的验证强度应区分对待

## 最低验证标准

### 只改文档

- 检查文档内容、路径和链接引用是否合理
- 不强制运行 `lint`、`typecheck` 或测试

### 改 `apps/api`

优先执行与改动最相关的命令，例如：

- `pnpm --filter @gaoge/app-api typecheck`
- `pnpm --filter @gaoge/app-api test`

若改动影响全局协议、共享类型或根配置，再评估是否补跑根级校验。

#### 涉及 Prisma 表结构变更

当修改 `apps/api/prisma/schema.prisma`、新增/调整 `apps/api/prisma/migrations/*`，或后端代码开始读写新表/新列时，开发完成后必须同步本地数据库、Prisma Client 和运行中的 API 进程。

本地开发库执行：

```bash
pnpm --filter @gaoge/app-api exec prisma migrate dev
pnpm --filter @gaoge/app-api db:generate
pnpm --filter @gaoge/app-api typecheck
pnpm --filter @gaoge/app-api test
pnpm dev:api
```

如果当前已经有 API 进程在 `3000` 端口运行，需要确认它加载的是最新代码；必要时重启 API 进程后再做接口 smoke test。

生产或部署环境不能使用 `migrate dev`，应执行部署入口：

```bash
pnpm db:migrate:prod:api
```

Prisma 表结构变更的最低 smoke test：

- `pnpm --filter @gaoge/app-api exec prisma migrate status` 显示数据库结构已同步
- 至少请求一次受影响接口，确认不是旧 DTO、旧 Prisma Client 或未迁移数据库导致的 `400` / `500`

### 改 `apps/admin`

优先执行：

- `pnpm --filter @gaoge/app-admin typecheck`

若改动包含明显脚本、lint 风险或大范围样式调整，再补充：

- `pnpm lint`

### 改 `apps/web`

优先执行：

- `pnpm --filter @gaoge/app-web typecheck`
- `pnpm --filter @gaoge/app-web test`

### 改 `apps/uniapp`

优先执行：

- `pnpm --filter @gaoge/app-uniapp typecheck`

### 改 `apps/desktop`

优先执行：

- `pnpm --filter @gaoge/app-desktop typecheck`
- `pnpm --filter @gaoge/app-desktop test`

若改动影响桌面端完整交互流程，再评估：

- `pnpm --filter @gaoge/app-desktop test:e2e`

### 改根配置、共享包或多应用联动代码

优先执行：

- `pnpm typecheck`
- `pnpm lint`

必要时再补应用定向测试。

## 提交前要求

- 提交前至少完成与本次改动范围相匹配的最低验证
- 若因环境、平台或时间原因未运行某项关键校验，应明确说明未验证项
- 不把“理论上应该没问题”当成完成依据

## 不建议的做法

- 文档改动也机械跑完整仓库校验
- 大范围改动只跑单个页面的局部验证
- 没跑命令就直接声称测试通过
