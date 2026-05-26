# API 模块开发规范

本规范只面向 `apps/api`，用于统一 NestJS + Prisma 后端模块实现方式。

## 适用范围

适用于 `apps/api/src/modules/*` 下的业务模块，以及 `apps/api/src/common/*` 中会被多个模块复用的基础能力。

## 模块结构

标准业务模块优先采用如下结构：

```text
src/modules/<domain>/<resource>/
  <resource>.module.ts
  <resource>.controller.ts
  <resource>.service.ts
  <resource>.service.spec.ts
  dto/
    create-<resource>.dto.ts
    update-<resource>.dto.ts
    <resource>-list.dto.ts
```

规则：

- 一个资源一个模块，不把多个无关资源硬塞进同一个 service
- `controller` 负责路由、参数接收、守卫和权限装配
- `service` 负责业务逻辑、查询拼装和 Prisma 调用
- DTO 只表达请求参数契约，不承接业务流程

## 路由与命名

- 按 `领域/资源` 组织模块目录，例如 `football/player`
- HTTP 路由保持资源集合语义，优先使用复数，例如 `/football/players`
- 控制器、服务、模块类名优先使用单数资源名，例如 `PlayerController`、`PlayerService`
- 列表查询 DTO 优先使用 `<Resource>ListDto`

## 请求与响应

- 成功响应默认服从全局 `ResponseInterceptor`
- 异常响应默认服从全局 `HttpExceptionFilter`
- 模块内部不要各自发明新的 envelope 结构
- 若确需返回特殊响应形态，应先确认不会破坏全局响应契约

参考实现：

- [apps/api/src/common/http/response.interceptor.ts](/Users/snow/Documents/Gaoge/gaoge/apps/api/src/common/http/response.interceptor.ts:1)
- [apps/api/src/common/http/http-exception.filter.ts](/Users/snow/Documents/Gaoge/gaoge/apps/api/src/common/http/http-exception.filter.ts:1)

## 查询与分页

- 列表查询参数在 DTO 中显式定义，不直接吃松散 query
- `service` 内应拆出 `build*Where`、`build*OrderBy` 这类辅助函数，而不是把 Prisma 条件内联到长方法里
- 分页能力优先保持同一套参数语义，例如 `page`、`pageSize`、`keyword`
- 页面专属的特殊筛选保留在对应资源模块内，不提前抽成“万能查询工具”

## Prisma 使用约定

- `PrismaService` 作为数据库访问入口，由模块注入使用
- Prisma `select`、`include`、`where` 组装逻辑留在 service 内部
- 不把 Prisma 专用类型直接上抛到共享包
- 涉及事务时，在 service 内明确事务边界，不把事务上下文扩散到 controller

## 配置读取

- 与业务模块强相关的配置统一通过 `ConfigService` 读取
- 不在普通业务文件中散落 `process.env.*`
- `main.ts`、脚本文件和极少量基础启动代码可直接读取进程环境变量

## 测试

- 新增或修改 service 业务逻辑时，优先补对应 `.service.spec.ts`
- 修改全局响应、异常、鉴权等基础设施时，应补对应基础层测试
- 暂不为了形式统一强制所有 controller 都补测试，但影响协议、守卫或异常路径时要补

## 不建议的做法

- 在 controller 里直接写大段 Prisma 查询
- 为了复用而提前做通用基类 service
- 让 DTO、Prisma 模型、共享类型三者互相机械映射但没有稳定边界
- 在单个模块里顺手兼做别的资源的业务逻辑
