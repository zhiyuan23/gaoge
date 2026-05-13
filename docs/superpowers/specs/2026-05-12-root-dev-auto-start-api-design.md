# 根目录开发命令自动拉起 API 方案

> 适用范围：高歌体育 monorepo 根目录开发脚本，涉及 `apps/admin`、`apps/web`、`apps/miniapp`、`apps/api`

## 1. 背景与目标

当前仓库已经提供以下根目录开发命令：

- `pnpm dev:admin`
- `pnpm dev:web`
- `pnpm dev:miniapp`
- `pnpm dev:api`
- `pnpm dev:admin-api`

现状是 `dev:admin`、`dev:web` 和 `dev:miniapp` 只会单独启动对应前端应用，不会自动带起 `api`。这会带来两个开发体验问题：

- 本地调试 `admin`、`web` 或 `miniapp` 时，常常还要手动再开一个 `api`
- 若开发者已经单独启动了 `api`，再执行双开命令又可能造成重复启动尝试

本方案目标是优化根目录开发编排体验，使：

- `pnpm dev:admin` 在本地 `api` 未启动时自动带起 `api`
- `pnpm dev:web` 在本地 `api` 未启动时自动带起 `api`
- `pnpm dev:miniapp` 在本地 `api` 未启动时自动带起 `api`
- 若 `api` 已启动，则只启动目标前端应用，不重复拉起 `api`
- 保持应用间依赖关系不变，不把该逻辑写入 `apps/*` 内部脚本

## 2. 范围与非目标

### 2.1 本次范围

- 修改根目录 `package.json` 中 `dev:admin`、`dev:web` 与 `dev:miniapp` 的行为
- 在根目录新增一个轻量开发编排脚本
- 复用现有 `api` 健康检查入口判断服务是否已启动

### 2.2 非目标

- 不修改 `apps/admin/package.json` 内部 `dev`
- 不修改 `apps/miniapp/package.json` 内部 `dev`
- 不修改 `apps/api/package.json` 内部 `dev`
- 不改变 `dev:admin-api` 的现有显式双开语义
- 不引入跨应用源码依赖
- 不处理“端口被其他非本项目服务占用”的复杂识别与抢占

## 3. 可选方案与取舍

### 3.1 方案 A：根脚本先探活，按需启动 API

行为：

1. 执行 `pnpm dev:admin`、`pnpm dev:web` 或 `pnpm dev:miniapp`
2. 先请求本地 `api` 健康检查地址
3. 若健康检查成功，只启动目标应用
4. 若健康检查失败，并行启动 `api + 目标应用`

优点：

- 符合当前需求
- 只改根脚本，最小入侵
- 不改变应用目录职责
- 已启动 `api` 时不会重复拉起

缺点：

- 需要一段额外的根目录脚本
- 默认假设本地 `api` 运行在既定地址

### 3.2 方案 B：始终使用双开命令

行为：

- `dev:admin`、`dev:web` 与 `dev:miniapp` 固定并行启动 `api + 前端`

优点：

- 实现最简单

缺点：

- 已有单独 `api` 进程时体验差
- 容易出现重复启动或端口冲突
- 不满足“已启动则不额外启动”的需求

### 3.3 方案 C：把自动启动逻辑写入应用内部脚本

行为：

- 在 `apps/admin`、`apps/web` 或 `apps/miniapp` 内部 `dev` 前加探测与启动逻辑

优点：

- 从各应用目录单独执行时也能生效

缺点：

- 会把根层开发编排能力下沉到应用包
- 与当前用户明确要求的“只作用于根目录”不一致
- 增加应用脚本复杂度

### 3.4 推荐方案

采用方案 A。

原因：

- 满足当前需求且改动最小
- 保持 monorepo 单向依赖与目录职责不变
- 属于常见的根层开发体验优化，而不是运行时架构耦合

## 4. 核心设计

### 4.1 API 存活判断方式

使用现有 `apps/api` 健康检查接口：

- 地址：`http://127.0.0.1:3000/health`

判断规则：

- 请求成功并返回任意 `2xx` 状态码，视为本项目 `api` 已启动
- 请求失败、连接拒绝、超时或非 `2xx`，视为 `api` 未启动

选择 HTTP 健康检查而不是只查端口的原因：

- 比纯端口探测更能确认“这个服务可用”
- 当前仓库已经存在 `/health`，无需新增后端能力

### 4.2 根目录编排脚本

在根目录新增一个 Node 脚本，例如：

- `scripts/dev-with-api.mjs`

脚本职责：

- 接收目标应用参数，如 `admin`、`web`、`miniapp`
- 检查本地 `api` 健康状态
- 根据结果决定执行：
  - 只启动目标应用
  - 或并行启动 `api + 目标应用`
- 直接复用现有 `turbo run dev --filter=...` 机制

脚本不负责：

- 动态发现所有应用
- 自动修改端口
- 杀掉旧进程
- 重试或等待 `api` 完全就绪后再起前端

### 4.3 根目录命令调整

调整后预期行为：

- `pnpm dev:admin`
  - 若 `api` 已启动，等价于当前的 `turbo run dev --filter=@gaoge/app-admin`
  - 若 `api` 未启动，等价于 `turbo run dev --parallel --filter=@gaoge/app-admin --filter=@gaoge/app-api`
- `pnpm dev:web`
  - 若 `api` 已启动，等价于当前的 `turbo run dev --filter=@gaoge/app-web`
  - 若 `api` 未启动，等价于 `turbo run dev --parallel --filter=@gaoge/app-web --filter=@gaoge/app-api`
- `pnpm dev:miniapp`
  - 若 `api` 已启动，等价于当前的 `turbo run dev --filter=@gaoge/app-miniapp`
  - 若 `api` 未启动，等价于 `turbo run dev --parallel --filter=@gaoge/app-miniapp --filter=@gaoge/app-api`

以下命令保持不变：

- `pnpm dev:api`
- `pnpm dev:admin-api`

### 4.4 失败边界与预期

本方案接受以下边界：

- 若本地 `api` 运行端口不是 `3000`，脚本会将其视为未启动
- 若 `127.0.0.1:3000` 上运行的是其他服务，但其 `/health` 不返回 `2xx`，脚本仍会尝试启动 `api`
- 若 `api` 正在启动但健康检查尚未通过，脚本会走“双开”分支

这是可接受的，因为本次目标是优化常见本地开发场景，不是构建一个复杂的本地进程管理器。

## 5. 实现细节建议

### 5.1 技术实现

优先使用 Node 原生能力实现：

- `fetch` 做健康检查
- `child_process.spawn` 启动 `pnpm` / `turbo`
- `stdio: 'inherit'` 透传输出

理由：

- 当前仓库 Node 版本满足原生 `fetch` 能力
- 无需新增第三方依赖
- 可读性与维护成本都更可控

### 5.2 参数约束

脚本首期只支持两个目标值：

- `admin`
- `web`
- `miniapp`

若传入其他参数，脚本应直接报错并退出，避免隐藏行为。

### 5.3 日志输出

建议保留简短日志，明确当前分支：

- `API is running, starting admin only`
- `API is not running, starting api + admin`

日志只需帮助开发者理解脚本判断结果，不需要做复杂彩色输出。

## 6. 测试与验证

至少验证以下场景：

1. 未启动 `api` 时执行 `pnpm dev:admin`
   - 预期同时启动 `api` 与 `admin`
2. 已单独启动 `api` 后执行 `pnpm dev:admin`
   - 预期只启动 `admin`
3. 未启动 `api` 时执行 `pnpm dev:web`
   - 预期同时启动 `api` 与 `web`
4. 已单独启动 `api` 后执行 `pnpm dev:web`
   - 预期只启动 `web`
5. 未启动 `api` 时执行 `pnpm dev:miniapp`
   - 预期同时启动 `api` 与 `miniapp`
6. 已单独启动 `api` 后执行 `pnpm dev:miniapp`
   - 预期只启动 `miniapp`
7. `pnpm dev:admin-api`
   - 预期行为保持不变

代码级验证应至少覆盖：

- 健康检查成功分支
- 健康检查失败分支
- 非法参数分支

## 7. 对现有架构的影响

本方案不会改变以下原则：

- `apps/*` 之间无直接依赖
- 根目录脚本仍只是开发入口编排
- `packages/*` 与应用职责边界保持不变

因此，这属于开发体验增强，不属于架构层依赖变更。
