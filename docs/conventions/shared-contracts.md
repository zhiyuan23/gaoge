# 共享契约与跨包边界规范

本规范用于约束 `apps/*` 与 `packages/*` 之间的类型、schema、sdk 和共享能力边界。

## 核心原则

- 先稳定业务边界，再抽共享包
- 只抽跨应用、跨运行时、长期稳定的契约
- 应用私有实现继续留在应用内
- `packages/*` 不依赖 `apps/*`

## 推荐分层

### `packages/shared/*`

适合放：

- 领域类型
- 稳定常量
- 运行时无关工具函数
- 共享 schema

不适合放：

- Vue / React / Nest / uni-app 运行时代码
- Prisma 专用类型
- 单页面内部类型

### `packages/sdk/*`

适合放：

- API 客户端
- OpenAPI 生成物
- 传输层 envelope 解包
- 框架无关错误类型

不适合放：

- UI 提示
- 路由跳转
- 登录态存储

### `packages/ui/*`

适合放：

- 设计令牌
- 明确可复用的 UI 能力

不适合放：

- 某个应用页面私有组件
- 强绑定单一业务的页面骨架

## 类型归属判断

满足以下条件中的大部分时，才考虑进入共享层：

- 至少两个应用会使用
- 不依赖单一前端或后端运行时
- 业务语义稳定，不会随单个页面频繁波动
- 可以独立命名和理解

否则优先留在应用内。

## 禁止行为

- 通过深路径引用别的包内部文件
- 把 Prisma `select/include/where` 类型直接提升到共享包
- 把页面临时表单状态抽到共享层
- 为了“以后可能复用”提前制造公共包

## 抽取顺序建议

优先抽：

- DTO 和响应类型
- 共享枚举和值类型
- 稳定 schema

暂缓抽：

- 页面交互状态
- 业务页面布局
- 与具体框架生命周期强耦合的封装

## 参考

- [docs/architecture/shared-contracts-and-ai-migration.md](/Users/snow/Documents/Gaoge/gaoge/docs/architecture/shared-contracts-and-ai-migration.md:1)
