# Gaoge Monorepo

当前分支用于搭建全栈 monorepo 基座。

## 目录结构

- `apps/`：可独立运行、构建和部署的应用
- `packages/`：共享能力、工具和配置
- `infra/`：部署与环境相关资源
- `docs/`：架构说明与协作约定

## 第一阶段范围

- `apps/api`：NestJS 服务端应用入口
- `apps/admin`：Vue 3 管理后台壳
- `apps/web`：Vue Web 应用壳
- `apps/miniapp`：uni-app 小程序应用壳
- `packages/shared/*`：类型、常量、工具函数、校验契约
- `packages/sdk/*`：接口客户端与契约生成边界
- `packages/ui/tokens`：跨端设计令牌
- `packages/server/database`：服务端数据库访问边界
- `packages/configs/*`：工作区级共享配置

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
