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

正式生产 workflow 在执行 `prisma migrate deploy` 前还必须依次完成：

- 校验配置目标和实际实例均为 `[::1]:5432/gaoge_db`
- 确认 User、Player、Team、MatchRound、FootballAssetRecord 五张关键表均非空
- 创建 custom-format `pg_dump`
- 使用 `pg_restore --list` 验证备份可读取，并输出大小和 SHA-256
- 只保留最新 14 份 `gaoge-db-pre-migration-*.dump`

发布失败时 workflow 自动恢复旧 release 和 `shared/api.env`，但不自动执行 migration 逆向回滚或恢复数据库备份。所有生产 migration 必须保持旧、新 release 在短期内兼容；数据恢复必须人工执行。

Prisma 表结构变更的最低 smoke test：

- `pnpm --filter @gaoge/app-api exec prisma migrate status` 显示数据库结构已同步
- 至少请求一次受影响接口，确认不是旧 DTO、旧 Prisma Client 或未迁移数据库导致的 `400` / `500`

### 改 `apps/admin`

优先执行：

- `pnpm --filter @gaoge/app-admin typecheck`

若改动包含明显脚本、lint 风险或大范围样式调整，再补充：

- `pnpm lint`

### 改 `apps/sports`

优先执行：

- `pnpm --filter @gaoge/app-sports typecheck`
- `pnpm --filter @gaoge/app-sports test`

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

### 改生产部署、数据库守卫或 PostgreSQL 自愈脚本

至少执行：

```bash
node --test \
  scripts/production-database-guard.test.mjs \
  scripts/verify-production-runtime-guard.test.mjs \
  scripts/verify-postgres-healthcheck.test.mjs
bash -n scripts/deployment/verify-remote-runtime.sh
bash -n infra/deploy/postgres/check-postgres.sh
pnpm exec prettier --check \
  .github/workflows/deploy-api.yml \
  scripts/deployment/production-database-guard.mjs \
  scripts/production-database-guard.test.mjs \
  scripts/verify-production-runtime-guard.test.mjs \
  scripts/verify-postgres-healthcheck.test.mjs
```

生产发布后还要获得以下新鲜证据：

- 数据库身份为 `::1:5432/gaoge_db`
- 五类关键业务计数均大于零，且不低于发布前基线
- 四个只读业务接口返回 `code=0` 且 `data.total > 0`
- `gaoge-api` 在线，`current` 指向本次 SHA，Admin CORS 预检通过
- 本次迁移前备份存在、权限为 `600` 且 `pg_restore --list` 成功
- `pm2-deploy.service` enabled/active，deploy 用户的 PM2 dump 只保存 `gaoge-api`

## 提交前要求

- 提交前至少完成与本次改动范围相匹配的最低验证
- 若因环境、平台或时间原因未运行某项关键校验，应明确说明未验证项
- 不把“理论上应该没问题”当成完成依据

## 不建议的做法

- 文档改动也机械跑完整仓库校验
- 大范围改动只跑单个页面的局部验证
- 没跑命令就直接声称测试通过
