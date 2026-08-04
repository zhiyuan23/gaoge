# 球员超级英雄字段设计

## 背景

后台“球员信息”需要为每位球员记录一个对应的漫威或 DC 超级英雄。当前只需要维护英雄名称，不需要记录所属阵营、英雄图片或其他资料。

本次变更沿用现有球员 CRUD 数据链路，在 `Player` 上增加一个可空文本字段，并在后台表单和列表中接入。公共球员 API 同步返回该字段，但本次不修改 uni-app 或其他客户端页面。

## 目标

- 为球员保存一个可自由输入的超级英雄名称
- 允许现有球员和新球员暂时不填写
- 支持在后台新增、编辑和清空该字段
- 在后台球员列表直接展示该字段
- 保持现有球员 CRUD、权限和页面结构不变

## 非目标

- 不维护漫威或 DC 阵营
- 不提供预设英雄枚举或下拉选项
- 不建立独立的超级英雄数据表
- 不增加超级英雄搜索条件
- 不修改 uni-app、Sports、Desktop、iOS 或 Miniapp 的页面展示
- 不自动为现有球员填充英雄名称

## 数据模型

在 Prisma `Player` 模型中增加：

```prisma
superheroName String?
```

字段语义：

- 保存超级英雄的展示名称，例如“钢铁侠”或“蝙蝠侠”
- 数据库允许 `null`
- 现有球员迁移后该字段保持 `null`
- 使用普通文本列，不增加唯一约束或索引
- 多名球员可以对应同一个超级英雄

新增一条独立 Prisma migration，只增加该列，不改动现有球员数据。

## 共享协议与 API

### 共享类型

`Player` 增加：

```ts
superheroName: string | null
```

`PlayerPayload` 增加：

```ts
superheroName?: string | null
```

使用 `null` 表达显式清空；省略字段表示调用方不更新该值。

### DTO 与校验

`CreatePlayerDto` 增加可选字段 `superheroName`：

- 接受字符串或 `null`
- 字符串最多 50 个字符
- 空白字符串由后台提交映射为 `null`

`UpdatePlayerDto` 继续通过 `PartialType(CreatePlayerDto)` 继承该字段和校验。

### 接口行为

现有接口路径不变：

- `GET /football/players`
- `GET /football/players/:id`
- `POST /football/players`
- `PATCH /football/players/:id`

列表、详情、创建和更新响应均包含 `superheroName`。当前服务序列化会展开 `Player` 标量字段，因此不新增单独查询或关联加载。

## Admin 后台

沿用 `apps/admin/src/views/sports/football/player` 的现有模块拆分。

### 表单

在球员新增/编辑表单中增加：

- 标签：`超级英雄`
- 控件：普通文本输入框
- 占位提示：`请输入对应的漫威或 DC 超级英雄`
- 非必填
- `maxlength=50`
- 展示字数限制

表单模型默认值为空字符串。编辑已有球员时，接口的 `null` 映射为空字符串；提交时，去除首尾空格，空值映射为 `null`，从而支持清空已有内容。

### 列表

在昵称和真实姓名附近增加“超级英雄”列：

- 建议宽度为 140
- 有值时显示英雄名称
- 空值显示 `-`
- 不增加筛选项；沿用现有 `EsTable` 列插槽处理空值展示

## 数据流

新增或编辑时：

1. 后台表单维护 `superheroName` 字符串。
2. mapper 去除首尾空格；空值转换为 `null`。
3. API DTO 校验可空性、字符串类型和 50 字符上限。
4. `PlayerService` 将字段随现有标量数据写入 Prisma。
5. 返回结果通过共享 `Player` 类型提供 `string | null`。
6. 后台列表展示名称或 `-`。

## 错误处理

- 超过 50 个字符时，后台表单阻止提交并提示长度限制。
- 绕过前端直接请求 API 时，DTO 同样拒绝超过 50 个字符的值。
- `null` 是合法值，用于清空字段。
- 本字段不增加唯一性或业务关联校验，不产生新的冲突错误。

## 测试与验证

实现完成后至少执行：

- 补充 DTO 校验测试，覆盖合法名称、`null` 和超长名称
- 补充或调整 API 服务测试，确认创建、更新和返回值包含 `superheroName`
- 验证后台 mapper 能完成 `null`、普通文本和清空值的双向转换
- `pnpm --filter @gaoge/app-api exec prisma migrate dev`
- `pnpm --filter @gaoge/app-api db:generate`
- `pnpm --filter @gaoge/app-api typecheck`
- `pnpm --filter @gaoge/app-api test`
- `pnpm --filter @gaoge/app-admin typecheck`
- 根据共享类型影响补跑根级 `pnpm typecheck`
- 重启或确认运行中的 API 已加载最新代码
- `prisma migrate status` 确认数据库结构同步
- 对受影响的球员创建、更新、清空和列表接口做 smoke test

生产部署继续使用现有 `pnpm db:migrate:prod:api` 流程，不在生产环境执行 `prisma migrate dev`。

## 知识库状态

知识库对仓库名 `gaoge` 的上下文查询错误回退到了 `gaoge-compass`，且针对“球员信息”的定向检索没有结果。本设计因此以当前 `main` 分支源码、仓库级 `AGENTS.md` 和 `docs/conventions` 为准。实现完成后应评估通过 `kb-maintainer` 补充或修复当前仓库映射。
