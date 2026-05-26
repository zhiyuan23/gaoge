# Monorepo 结构说明

本文用于说明仓库顶层的 monorepo 分层和目录职责。

它只回答三类问题：

- 顶层有哪些应用和共享层
- 它们各自负责什么
- 它们之间允许怎样依赖

它不展开描述某个应用内部的详细目录结构。应用内部结构应由对应的架构文档或应用文档单独维护。

## 核心原则

按可部署应用组织，按共享能力复用。

## 应用层

- `apps/api`：后端 API 服务边界
- `apps/admin`：Vue 3 管理后台应用
- `apps/web`：Vue Web 应用
- `apps/miniapp`：uni-app 小程序应用
- `apps/desktop`：Electron + React 桌面应用
- `apps/ios`：iOS + SwiftUI 原生应用

## 共享包层

- `packages/shared/types`：DTO 与领域类型
- `packages/shared/constants`：稳定共享常量
- `packages/shared/utils`：与运行时无关的工具函数
- `packages/shared/schemas`：校验与解析契约
- `packages/sdk/api-client`：请求客户端与传输层契约
- `packages/sdk/openapi`：接口生成产物边界
- `packages/ui/tokens`：设计令牌
- `packages/server/database`：数据库访问边界
- `packages/configs/*`：工作区共享配置

## 依赖方向

```text
apps -> sdk/ui/server/shared/configs
sdk/ui/server -> shared/configs
shared -> configs
```

## 命名约定

- 应用目录名描述产品角色，而不是技术栈
- 共享包统一使用 `@gaoge/*` scope
- 应用内部使用 `@/` 作为本地别名
- 跨包引用统一使用工作区包名
