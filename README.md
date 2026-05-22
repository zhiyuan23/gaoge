# Gaoge Monorepo

高歌数字全栈业务仓库，采用 `pnpm workspace + Turbo` 组织多应用与共享包，统一管理前台 Web、管理后台、小程序、服务端与桌面端。

当前仓库已经完成首批真实应用迁入，重点在于将原有单仓库能力持续收敛到统一的工程结构、依赖体系与发布入口中。

## 项目概览

### 仓库目标

- 在一个工作区中承载多个可独立运行的真实应用
- 通过 `packages/*` 复用稳定共享能力
- 保持应用边界清晰、依赖方向单向
- 统一开发、类型检查、Lint 与构建流程

### 当前应用矩阵

| 应用           | 角色                                    | 主要技术栈                                                |
| -------------- | --------------------------------------- | --------------------------------------------------------- |
| `apps/api`     | 统一后端服务，提供鉴权、RBAC 与领域 API | NestJS, Prisma, TypeScript, Swagger                       |
| `apps/admin`   | 内部管理后台，承载运营与 CRUD 管理      | Vue 3, Vite, TypeScript, Element Plus, Pinia, UnoCSS      |
| `apps/web`     | 面向用户的 Web 前台                     | Vue 3, Vite, Tailwind CSS                                 |
| `apps/miniapp` | 微信小程序前台                          | uni-app, Vue 3, TypeScript, TDesign, Pinia, UnoCSS        |
| `apps/desktop` | 桌面客户端，包含本地存储与 Electron 壳  | Electron, React, TypeScript, Tailwind CSS, better-sqlite3 |

## Monorepo 结构

```text
.
├─ apps/         # Independently runnable and deployable applications
├─ packages/     # Shared packages only, not partial applications
├─ docs/         # Architecture, collaboration rules, and operations docs
├─ infra/        # CI, deployment, Docker, Nginx and environment assets
└─ scripts/      # Workspace-level helper scripts
```

### 依赖方向

仓库遵循单向依赖模型：

```text
apps -> sdk/ui/server/shared/configs
sdk/ui/server -> shared/configs
shared -> configs
```

规则：

- `apps/*` can depend on `packages/*`
- `packages/*` 不能反向依赖 `apps/*`
- 应用之间不能直接横向依赖
- 运行时无关的共享代码应放在 `packages/shared/*`

## 应用说明

### `apps/api`

统一后端服务，面向管理后台、Web 前台、小程序与桌面端提供共用的鉴权、RBAC 与业务数据访问能力。

**技术栈**

- NestJS 11
- Prisma 5
- TypeScript
- JWT / Passport
- Swagger

**主要职责**

- 鉴权与权限控制
- 统一领域 API 提供
- 数据库迁移与种子脚本
- OpenAPI 与服务契约支撑

**常用命令**

| 操作               | 命令                                           |
| ------------------ | ---------------------------------------------- |
| 启动开发模式       | `pnpm dev:api`                                 |
| 在应用目录范围启动 | `pnpm --filter @gaoge/app-api dev`             |
| 构建               | `pnpm --filter @gaoge/app-api build`           |
| 启动生产构建产物   | `pnpm --filter @gaoge/app-api start:prod`      |
| 执行数据库迁移     | `pnpm --filter @gaoge/app-api db:migrate`      |
| 部署数据库迁移     | `pnpm --filter @gaoge/app-api db:migrate:prod` |
| 执行种子脚本       | `pnpm --filter @gaoge/app-api db:seed`         |
| 打开 Prisma Studio | `pnpm --filter @gaoge/app-api db:studio`       |

### `apps/admin`

内部管理后台，承载运营流程、RBAC 配置以及足球等业务模块的后台 CRUD 页面。

**技术栈**

- Vue 3
- Vite
- TypeScript
- Element Plus
- Pinia
- UnoCSS
- ECharts / VChart / VXE Table

**主要职责**

- 后台 CRUD 页面
- 内部配置与权限菜单
- 表单、表格、图表、富文本等后台交互能力

**常用命令**

| 操作               | 命令                                       |
| ------------------ | ------------------------------------------ |
| 启动开发模式       | `pnpm dev:admin`                           |
| 在应用目录范围启动 | `pnpm --filter @gaoge/app-admin dev`       |
| 生产构建           | `pnpm --filter @gaoge/app-admin build`     |
| UAT 构建           | `pnpm --filter @gaoge/app-admin build:uat` |
| 类型检查           | `pnpm --filter @gaoge/app-admin typecheck` |

### `apps/web`

面向用户的 Web 前台，适合官网、业务展示类页面以及后续 Web 端用户交互场景。

**技术栈**

- Vue 3
- Vite
- TypeScript
- Tailwind CSS 4
- Vue Router
- Vitest

**主要职责**

- 官网或业务展示页面
- 用户向 Web 路由与前台界面
- 视觉与内容驱动的前端体验

**常用命令**

| 操作               | 命令                                   |
| ------------------ | -------------------------------------- |
| 启动开发模式       | `pnpm dev:web`                         |
| 在应用目录范围启动 | `pnpm --filter @gaoge/app-web dev`     |
| 构建               | `pnpm --filter @gaoge/app-web build`   |
| 预览构建产物       | `pnpm --filter @gaoge/app-web preview` |
| 运行测试           | `pnpm --filter @gaoge/app-web test`    |

### `apps/miniapp`

基于 uni-app 的小程序前台，主要服务微信小程序场景，并保留 Vue 体系下的开发体验。

**技术栈**

- uni-app
- Vue 3
- TypeScript
- Pinia
- UnoCSS
- TDesign uni-app
- vue-i18n

**主要职责**

- 微信小程序入口
- 移动端优先的业务交互流程
- 通过统一后端访问共享业务能力

**常用命令**

| 操作                   | 命令                                         |
| ---------------------- | -------------------------------------------- |
| 启动微信小程序开发模式 | `pnpm dev:miniapp`                           |
| 在应用目录范围启动     | `pnpm --filter @gaoge/app-miniapp dev`       |
| 启动 H5 调试           | `pnpm --filter @gaoge/app-miniapp dev:h5`    |
| 启动生产模式调试       | `pnpm --filter @gaoge/app-miniapp dev:prod`  |
| 构建                   | `pnpm --filter @gaoge/app-miniapp build`     |
| 类型检查               | `pnpm --filter @gaoge/app-miniapp typecheck` |

### `apps/desktop`

基于 Electron 和 React 的桌面客户端，负责桌面端交互、本地 SQLite 存储以及与后端服务的联动。

**技术栈**

- Electron
- React 19
- TypeScript
- electron-vite
- Tailwind CSS 4
- React Router
- React Query
- Zustand
- better-sqlite3

**主要职责**

- 桌面壳与原生打包
- 本地存储与桌面侧能力承载
- 桌面业务流程与数据同步

**常用命令**

| 操作               | 命令                                         |
| ------------------ | -------------------------------------------- |
| 启动开发模式       | `pnpm dev:desktop`                           |
| 在应用目录范围启动 | `pnpm --filter @gaoge/app-desktop dev`       |
| 构建应用           | `pnpm --filter @gaoge/app-desktop build`     |
| 构建 unpacked 目录 | `pnpm --filter @gaoge/app-desktop build:dir` |
| 构建安装包         | `pnpm --filter @gaoge/app-desktop dist`      |
| 重装原生依赖       | `pnpm install:desktop-native`                |
| 运行测试           | `pnpm --filter @gaoge/app-desktop test`      |
| 运行 E2E 测试      | `pnpm --filter @gaoge/app-desktop test:e2e`  |

## 共享包说明

`packages/*` 只放稳定共享能力，不放半个应用。

### `packages/shared/*`

运行时无关的共享基础层：

- `@gaoge/shared-types`：共享 TypeScript 类型
- `@gaoge/shared-constants`：共享常量
- `@gaoge/shared-utils`：共享工具函数
- `@gaoge/shared-schemas`：共享 Schema 与校验契约

### `packages/sdk/*`

接口访问与集成边界层：

- `@gaoge/sdk-api-client`：API Client 抽象
- `@gaoge/sdk-openapi`：OpenAPI 相关共享支持

### `packages/server/*`

服务端共享模块：

- `@gaoge/server-database`：共享数据库访问边界

### `packages/ui/*`

共享 UI 资产层，不强行做跨框架组件复用：

- `@gaoge/ui-tokens`：设计令牌

### `packages/configs/*`

工作区级共享工具链配置：

- `@gaoge/config-typescript`
- `@gaoge/config-eslint`
- `@gaoge/config-prettier`

## 快速开始

### 环境要求

- Node.js `>= 22`
- pnpm `10.8.1`，或兼容的 `pnpm 10`

### 安装依赖

在仓库根目录执行：

```bash
pnpm install
```

安装阶段会自动完成：

- 工作区根依赖安装
- `apps/api` 在 `postinstall` 中执行 `prisma generate`
- `apps/desktop` 在 `postinstall` 中执行 `electron-builder install-app-deps`

这一步对 Electron 原生依赖很重要，例如 `better-sqlite3` 必须按 Electron 的 ABI 重建，而不是仅按 Node.js ABI 编译。

### 环境变量

当前仓库内已提供：

- `apps/api/.env.example`

推荐做法：

1. 按需复制示例文件生成真实本地 `.env`
2. 真实环境变量不要提交到版本库
3. 新增环境依赖时，为对应应用补齐示例文件

## 本地开发

### 根目录常用命令

以下命令均在仓库根目录执行。

| 命令                  | 说明                                       |
| --------------------- | ------------------------------------------ |
| `pnpm dev`            | 启动所有声明了 `dev` 脚本的工作区应用      |
| `pnpm dev:api`        | 仅启动 API                                 |
| `pnpm dev:admin`      | 启动管理后台；若 API 未运行会自动一并启动  |
| `pnpm dev:web`        | 启动 Web 前台；若 API 未运行会自动一并启动 |
| `pnpm dev:miniapp`    | 启动小程序；若 API 未运行会自动一并启动    |
| `pnpm dev:desktop`    | 启动桌面端；若 API 未运行会自动一并启动    |
| `pnpm build`          | 构建全部可构建的应用与共享包               |
| `pnpm build:desktop`  | 仅构建桌面端                               |
| `pnpm lint`           | 执行 Prettier 检查、ESLint 与 Stylelint    |
| `pnpm lint:fix`       | 自动格式化并修复可修复问题                 |
| `pnpm lint:style`     | 仅执行 Stylelint                           |
| `pnpm lint:style:fix` | 自动修复样式问题                           |
| `pnpm typecheck`      | 执行工作区类型检查                         |
| `pnpm clean`          | 清理工作区构建产物                         |
| `pnpm cz`             | 使用 Commitizen 生成 conventional commit   |

### API 自动联动启动说明

`pnpm dev:admin`、`pnpm dev:web`、`pnpm dev:miniapp` 与 `pnpm dev:desktop` 由 `scripts/dev-with-api.mjs` 包装执行。

行为如下：

- 若 API 健康检查通过，仅启动目标应用
- 若 API 未运行，则自动同时启动目标应用与 `@gaoge/app-api`
- 默认健康检查地址：`http://127.0.0.1:3000/health`

## 工程约定

### 代码风格

仓库默认遵循：

- Prettier 负责格式化
- ESLint 负责代码质量
- Stylelint 负责样式规则
- 风格基线参考 `gaoge-admin`
  - 无分号
  - 单引号
  - 最多一个空行
  - `import` 排序
  - 稳定的 Vue 区块顺序

### 命名与组织

- 应用目录名表达产品角色，而不是技术名
- 共享包统一使用 `@gaoge/*`
- 应用内部路径别名统一使用 `@/`
- 跨包引用使用工作区包名，不直接依赖其他包内部路径
- 业务目录优先采用 `领域/资源` 两级结构，例如 `football/player`
- 模块目录、资源名、类名优先使用单数，例如 `player`、`PlayerService`
- REST 路由优先保持复数资源集合语义，例如 `/football/players`

## 建议开发流程

日常开发建议按以下顺序进行：

1. 执行 `pnpm install`
2. 准备本地环境变量
3. 通过根目录命令启动目标应用
4. 提交前执行 `pnpm typecheck` 与 `pnpm lint`
5. 使用 `pnpm cz` 生成 conventional commit

## 相关文档

- [AGENTS.md](./AGENTS.md)：仓库内 AI 协作规则
- `docs/architecture`：架构与设计说明
- `docs/ops`：运维与部署参考
- `infra/`：CI、部署、Docker 与 Nginx 等基础设施资源
