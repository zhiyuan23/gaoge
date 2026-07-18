# 公共契约与 AI 迁移说明

本文用于指导后续把单体项目迁入当前 monorepo，或把 `apps/admin` 等应用从 monorepo 中迁出为独立项目时，如何处理公共类型、接口契约和迁移边界。

## 当前原则

当前仓库仍处于迁移收敛阶段。`apps/admin` 与 `apps/api` 已可运行，但 `packages/*` 仍以共享层骨架为主。

因此公共抽取遵循以下原则：

- 先稳定业务边界，再抽取公共包
- 不为了“看起来共享”提前抽象
- 只抽取跨应用、跨运行时、长期稳定的契约
- 应用私有实现继续留在应用内
- AI 迁移时优先保证可运行，再逐步收敛结构

## 公共类型规划

推荐把公共类型分为三层。

### 1. 领域类型

放置位置：`packages/shared/types`

适合放入：

- `Player`
- `UserProfile`
- `AuthUser`
- `TeamFund`
- `Banner`
- `Pagination`
- 枚举值对应的字符串联合类型，例如 `UserRole`、`UserStatus`

不适合放入：

- Vue 组件 props
- Nest request 对象
- Prisma 专用 include/select 类型
- 只在单个页面使用的临时类型

### 2. 接口契约与校验 schema

放置位置：`packages/shared/schemas`

适合放入：

- 登录请求参数
- 登录响应结构
- 球员创建/更新参数
- 资金明细创建/更新参数
- 分页查询参数
- 统一响应结构校验

推荐后续使用 schema 作为单一事实来源，再由 schema 推导类型。

示例方向：

```ts
export const adminLoginSchema = z.object({
  account: z.string().min(1),
  password: z.string().min(1),
})

export type AdminLoginPayload = z.infer<typeof adminLoginSchema>
```

### 3. API 客户端契约

放置位置：`packages/sdk/api-client`

适合放入：

- 基础请求客户端
- API envelope 解包
- 请求路径常量
- 不绑定具体 UI 框架的错误类型

不适合放入：

- Element Plus 提示
- Vue Router 跳转
- Pinia store 操作
- 小程序专用请求适配

`apps/admin`、`apps/web`、`apps/uniapp` 可分别在应用内包装 sdk，处理各自的登录态、错误提示和路由跳转。

## 当前类型归属规划

下面是当前 `apps/admin` 与 `apps/api` 已出现的类型，以及后续统一时推荐放置的位置。

### 已统一到 `packages/shared/types`

这些类型描述业务实体或跨端响应，适合作为前后端共同语言。

| 当前来源                                    | 共享类型名                                               | 目标位置                              | 说明                             |
| ------------------------------------------- | -------------------------------------------------------- | ------------------------------------- | -------------------------------- |
| `apps/admin/src/api/modules/players.ts`     | `Player` / `PlayerPayload`                               | `packages/shared/types/src/player.ts` | 与球员接口返回和前端提交参数对应 |
| `apps/admin/src/api/modules/user.ts`        | `AuthUser`                                               | `packages/shared/types/src/auth.ts`   | 后台登录用户信息，不包含 token   |
| `apps/admin/src/api/modules/user.ts`        | `AdminLoginPayload` / `AdminLoginResponse`               | `packages/shared/types/src/auth.ts`   | 登录接口请求和响应数据           |
| `apps/admin/src/api/modules/user.ts`        | `PermissionResponse`                                     | `packages/shared/types/src/auth.ts`   | 权限接口响应数据                 |
| `apps/api/src/modules/team/team.service.ts` | `TeamFundSummary`                                        | `packages/shared/types/src/team.ts`   | 资金汇总响应                     |
| `apps/api/prisma/schema.prisma`             | `TeamFund` / `TeamFundPayload` / `UpdateTeamFundPayload` | `packages/shared/types/src/team.ts`   | 资金明细实体和提交参数           |
| `apps/api/prisma/schema.prisma`             | `Banner` / `BannerPayload` / `UpdateBannerPayload`       | `packages/shared/types/src/banner.ts` | 轮播图实体和提交参数             |

### 已统一为共享值类型

这些值已放入 `packages/shared/types`。其中 `PlayerStatus` 暂时保留为 `string`，因为当前管理后台支持展示历史或自定义状态值。

| 类型名             | 推荐值                                                                       | 目标位置                |
| ------------------ | ---------------------------------------------------------------------------- | ----------------------- |
| `UserRole`         | `'user' \| 'admin'`                                                          | `packages/shared/types` |
| `UserStatus`       | `'active' \| 'inactive'`                                                     | `packages/shared/types` |
| `PlayerStatus`     | `string`                                                                     | `packages/shared/types` |
| `TeamFundType`     | `'income' \| 'expense'`                                                      | `packages/shared/types` |
| `TeamFundStatus`   | `'pending' \| 'confirmed' \| 'cancelled'`                                    | `packages/shared/types` |
| `TeamFundCategory` | `'game_fee' \| 'equipment' \| 'venue' \| 'activity' \| 'sponsor' \| 'other'` | `packages/shared/types` |
| `BannerStatus`     | `'active' \| 'inactive'`                                                     | `packages/shared/types` |

### 后续应统一到 `packages/shared/schemas`

这些类型既是请求契约，又需要校验。后续推荐由 schema 推导类型，避免前端 payload、后端 DTO、文档三处漂移。

| 当前来源                                                                                          | 当前类型                            | 目标 schema            | 推导类型                |
| ------------------------------------------------------------------------------------------------- | ----------------------------------- | ---------------------- | ----------------------- |
| `apps/admin/src/api/modules/user.ts` / `apps/api/src/modules/auth/dto/login.dto.ts`               | `LoginPayload` / `AdminLoginDto`    | `adminLoginSchema`     | `AdminLoginPayload`     |
| `apps/admin/src/api/modules/players.ts` / `apps/api/src/modules/players/dto/create-player.dto.ts` | `PlayerPayload` / `CreatePlayerDto` | `createPlayerSchema`   | `CreatePlayerPayload`   |
| `apps/admin/src/api/modules/players.ts` / `apps/api/src/modules/players/dto/update-player.dto.ts` | `PlayerPayload` / `UpdatePlayerDto` | `updatePlayerSchema`   | `UpdatePlayerPayload`   |
| `apps/api/src/modules/team/dto/create-team-fund.dto.ts`                                           | `CreateTeamFundDto`                 | `createTeamFundSchema` | `CreateTeamFundPayload` |
| `apps/api/src/modules/team/dto/create-team-fund.dto.ts`                                           | `UpdateTeamFundDto`                 | `updateTeamFundSchema` | `UpdateTeamFundPayload` |
| `apps/api/src/modules/team/dto/create-team-fund.dto.ts`                                           | `QueryTeamFundDto`                  | `queryTeamFundSchema`  | `QueryTeamFundPayload`  |
| `apps/api/src/modules/banner/dto/create-banner.dto.ts`                                            | `CreateBannerDto`                   | `createBannerSchema`   | `CreateBannerPayload`   |
| `apps/api/src/modules/banner/dto/create-banner.dto.ts`                                            | `UpdateBannerDto`                   | `updateBannerSchema`   | `UpdateBannerPayload`   |

### 暂时不抽取的类型

以下类型即使有重复，也先留在应用内部：

- Vue 页面表单内部状态
- Pinia store state
- Router meta 扩展
- Element Plus 组件参数
- Nest `@Req()` 用户对象
- Prisma service 内部查询条件

## 推荐实现路线

类型统一建议按“小步可验证”推进，不一次性迁移全部 DTO。

### 阶段 1：抽取响应类型和当前稳定 payload 类型

当前已完成：

- `packages/shared/types/src/auth.ts`
- `packages/shared/types/src/player.ts`
- `packages/shared/types/src/team.ts`
- `packages/shared/types/src/banner.ts`
- `packages/shared/types/src/common.ts`
- `packages/shared/types/src/index.ts`

当前已接入：

- `apps/admin/src/api/modules/user.ts`
- `apps/admin/src/api/modules/players.ts`
- `apps/api/src/modules/auth/services/auth.service.ts`
- `apps/api/src/modules/team/team.service.ts`
- `apps/api/src/modules/*/dto` 中的状态/枚举类型

验证：

```bash
pnpm --filter @gaoge/shared-types typecheck
pnpm --filter @gaoge/app-admin typecheck
pnpm --filter @gaoge/app-api typecheck
```

### 阶段 2：抽取枚举和值约束

目标：

- 将角色、状态、资金类型等字符串联合类型放入 `packages/shared/types`
- 前端表单选项、后端权限判断、Prisma 写入参数逐步引用同一组类型

注意：

- Prisma schema 仍是数据库事实来源
- shared 类型只表达 TypeScript 契约，不直接依赖 Prisma

### 阶段 3：抽取请求 schema

目标：

- 在 `packages/shared/schemas` 使用 schema 定义请求契约
- 后端 DTO 逐步减少手写重复字段
- 前端表单校验逐步复用 schema

注意：

- 当前后端使用 `class-validator`，不建议一次性替换
- 可以先让 schema 服务于前端和共享类型，再评估是否引入 Nest pipe 复用 schema

### 阶段 4：OpenAPI 与 SDK

目标：

- 后端 Swagger/OpenAPI 输出成为接口文档来源
- `packages/sdk/openapi` 管理生成物
- `packages/sdk/api-client` 提供框架无关请求能力

触发条件：

- `apps/web` 与 `apps/uniapp` 已真实接入
- 至少两个应用消费同一接口契约
- API envelope 和错误处理规则稳定

## AI 执行类型统一时的检查清单

AI 在后续真正实施类型统一时，必须逐项检查：

- 是否有两个以上应用或一端一服务共同使用该类型
- 类型是否包含框架运行时对象
- 类型是否依赖 Prisma、Vue、Nest、uni-app
- 抽取后是否仍能独立迁出 `apps/admin`
- 是否需要同步更新 `docs/architecture/shared-contracts-and-ai-migration.md`
- 是否需要同步更新 `AGENTS.md`
- 是否已运行相关 package 与 app 的 typecheck

## 当前阶段不要立即抽取的内容

以下内容暂时保留在应用内：

- `apps/admin/src/api/index.ts`
- `apps/admin/src/store`
- `apps/admin/src/router`
- `apps/api/src/common`
- `apps/api/src/modules/*/dto`
- `apps/api/prisma`

原因：

- `web` 与 `uniapp` 已完成真实迁入，但共享契约仍处于逐步收敛阶段
- API 契约仍可能跟随业务调整
- 过早共享会增加迁移阻力

## 后续抽取顺序

推荐按以下顺序逐步推进：

1. 抽取稳定枚举和值对象
   - 用户角色、用户状态、球员状态、资金类型、资金状态
2. 抽取只读响应类型
   - `Player`
   - `AuthUser`
   - `LoginResponse`
   - `PermissionResponse`
3. 抽取请求 payload 类型
   - `AdminLoginPayload`
   - `PlayerCreatePayload`
   - `PlayerUpdatePayload`
4. 引入 schema 作为校验来源
   - 后端 DTO 与前端表单逐步对齐 schema
5. 抽取框架无关 API client
   - 等 `web`、`uniapp` 接口消费模式稳定后再做

## 从 monorepo 迁出独立前端项目

如果后续要把 `apps/admin` 迁出为独立前端项目，AI 应按以下步骤处理。

### 迁出前检查

确认以下依赖边界：

- `apps/admin` 是否引用了 `@gaoge/*` 包
- 是否依赖根目录 lint、prettier、typescript 配置
- 是否依赖根目录环境变量或脚本
- 是否依赖 monorepo 的路径别名
- 是否需要保留 `packages/shared/*` 类型

检查命令：

```bash
rg -n "from ['\"]@gaoge/|import\\(['\"]@gaoge/" apps/admin
rg -n "@/" apps/admin/src
pnpm --filter @gaoge/app-admin typecheck
```

### 迁出策略

优先选择以下两种策略之一。

策略 A：独立项目复制共享类型

- 适合短期独立部署
- 从 `packages/shared/*` 复制所需类型到新项目 `src/shared`
- 保持迁出成本低
- 后续需要手动同步类型变化

策略 B：独立项目继续依赖共享包

- 适合多个项目长期并行维护
- 把 `packages/shared/*` 发布为私有 npm 包，或用 git dependency 引用
- 类型一致性更好
- 包发布、版本管理成本更高

当前阶段推荐策略 A。等 `web`、`uniapp` 都稳定后，再评估策略 B。

### 迁出步骤

1. 复制 `apps/admin` 到新仓库根目录
2. 提升 `apps/admin/package.json` 为新仓库根 `package.json`
3. 复制必要配置
   - `tsconfig.json`
   - `tsconfig.app.json`
   - `vite.config.ts`
   - `uno.config.ts`
   - `postcss.config.js`
   - `components.json`
4. 复制必要环境变量示例
   - `.env.example`
   - `.env.development.example`
   - `.env.production.example`
   - `.env.uat.example`
5. 处理共享类型
   - 若存在 `@gaoge/*` 引用，按策略 A 或 B 处理
6. 调整脚本
   - 去掉 monorepo filter
   - 保留 `dev`、`build`、`typecheck`、`lint`
7. 运行校验
   - `pnpm install`
   - `pnpm typecheck`
   - `pnpm build`

## 从独立项目迁入 monorepo

AI 迁入新项目时应按以下步骤执行。

1. 先确认项目角色
   - 管理后台放入 `apps/admin`
   - H5/Web 放入 `apps/web`
   - uni-app 小程序放入 `apps/uniapp`
   - 原生小程序放入 `apps/miniapp`
   - 后端服务放入 `apps/api`
2. 保留应用私有实现
   - 不把页面、store、router、服务私有逻辑提前放入 `packages`
3. 统一包名
   - 应用包名使用 `@gaoge/app-*`
   - 共享包使用 `@gaoge/*`
4. 统一脚本
   - 应用内保留 `dev`、`build`、`typecheck`、`clean`
   - 根目录通过 turbo filter 调用
5. 统一路径规则
   - 应用内部使用 `@/`
   - 跨包引用使用工作区包名
6. 先跑通，再抽取
   - 优先保证迁入应用可启动、可构建、核心流程可用
   - 只在确认多个应用真实复用后抽取公共包

## AI 修改边界

AI 在执行迁移或抽取时必须遵守：

- 不删除预留目录，除非用户明确要求
- 不移动真实业务文件，除非已有迁移计划
- 不把单应用临时类型抽到共享包
- 不让 `packages/*` 依赖 `apps/*`
- 不让应用之间横向依赖
- 不在 `shared/*` 中引入 Vue、React、Nest、uni-app 运行时依赖
- 修改目录职责、命名规则或迁移流程时，同步更新 `AGENTS.md` 和本文档
