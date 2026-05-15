# Gaoge Monorepo

当前仓库用于承载高歌体育的全栈 monorepo。

## 目录结构

- `apps/`：可独立运行、构建和部署的应用
- `packages/`：共享能力、工具和配置
- `infra/`：部署与环境相关资源
- `docs/`：架构说明与协作约定

## 当前应用

- `apps/api`：已迁入的 NestJS 服务端，当前包含球员信息 CRUD
- `apps/admin`：已迁入的 Vue 3 管理后台，当前已接通球员信息 CRUD
- `apps/web`：已迁入的 Vue Web 应用
- `apps/miniapp`：已迁入的 uni-app 小程序应用
- `apps/desktop`：已接入的 Electron + React 桌面应用底座
- `packages/shared/*`：类型、常量、工具函数、校验契约
- `packages/sdk/*`：接口客户端与契约生成边界
- `packages/ui/tokens`：跨端设计令牌
- `packages/server/database`：服务端数据库访问边界
- `packages/configs/*`：工作区级共享配置

## 当前迁移状态

- `gaoge-server` 已迁入 `apps/api`
- `gaoge-admin` 已迁入 `apps/admin`
- 原单仓库中的独立配置已按当前 monorepo 规范收敛
- 当前部署入口以 `apps/api` 为主，后续其他应用迁入后再继续补充工作流

## 基础约束

1. `apps/*` 可以依赖 `packages/*`
2. `packages/*` 不能反向依赖 `apps/*`
3. `shared/*` 保持运行时无关，不绑定具体框架
4. UI 按框架分别维护，不强行做跨框架组件复用

## 代码规范

- `Prettier` 负责统一代码格式
- `ESLint` 负责代码质量与可自动修复规则
- VS Code 在保存时执行格式化，并应用 ESLint 自动修复
- 代码风格参考 `gaoge-admin`：无分号、单引号、最多一个空行、`import` 排序、稳定的 Vue 区块顺序
- `Stylelint` 负责 `CSS`、`SCSS` 与 Vue 样式块规范

## 环境变量

- `apps/admin` 使用多环境变量文件，仓库内保留：
  - `.env.example`
  - `.env.development.example`
  - `.env.production.example`
  - `.env.uat.example`
- `apps/api` 保留 `.env.example`
- 本地运行时请复制对应示例文件生成真实 `.env*` 文件；真实环境变量不提交到 git
- 本次迁移后，已将原单仓库的本地环境变量复制到当前工作区，仅用于你当前机器上的运行，不会进入版本库

## 本地运行

### 安装依赖

在仓库根目录执行：

```bash
pnpm install
```

### 启动 Electron

Electron 首次运行前，除了安装工作区依赖，还需要放行并补跑原生依赖/二进制安装脚本。否则 `pnpm dev:desktop` 可能会报 `Electron uninstall` 或 `Electron failed to install correctly`。

在仓库根目录依次执行：

```bash
pnpm approve-builds
pnpm install:desktop-native
pnpm dev:desktop
```

`pnpm approve-builds` 时请允许：

- `electron`
- `better-sqlite3`

`pnpm install:desktop-native` 会通过 `electron-builder install-app-deps` 按 Electron 自身的 ABI 重建 `better-sqlite3` 这类原生依赖。普通的 `pnpm rebuild` 只会按当前 Node.js ABI 编译，仍然可能在 Electron 启动时报 `NODE_MODULE_VERSION` 不匹配。
