# 开发规范索引

本目录用于沉淀面向人和 AI 的开发约定。

放在这里的内容应满足两个条件：

- 不是全仓库最高优先级的硬约束，不适合继续堆进 `AGENTS.md`
- 需要跨任务复用，且应长期作为实现时的默认参考

当前规范包括：

- [api-module.md](./api-module.md)：`apps/api` 的模块结构、路由、DTO、Prisma 与错误处理约定
- [admin-page-patterns.md](./admin-page-patterns.md)：`apps/admin` 页面装配、权限、查询和弹窗模式
- [miniapp-architecture.md](./miniapp-architecture.md)：`apps/miniapp` 微信原生小程序目录、服务分组和导入路径约定
- [frontend-styling.md](./frontend-styling.md)：前端样式方案的应用边界与使用原则
- [admin-crud.md](./admin-crud.md)：`apps/admin` CRUD 页面结构与通用组件使用约定
- [shared-contracts.md](./shared-contracts.md)：共享类型、schema、sdk 与跨包边界约定
- [env-and-config.md](./env-and-config.md)：环境变量、配置读取与多应用配置边界约定
- [testing-and-verification.md](./testing-and-verification.md)：按改动范围执行校验与提交前验证约定

维护规则：

- 仓库级协作规则、目录职责、依赖方向继续维护在 [AGENTS.md](../../AGENTS.md)
- 应用级或页面级实现约定优先维护在 `docs/conventions/*`
- 设计稿、阶段性方案和一次性实现讨论仍放在 `docs/superpowers/specs/*` 或 `docs/superpowers/plans/*`，不要把它们当成长期规范入口
