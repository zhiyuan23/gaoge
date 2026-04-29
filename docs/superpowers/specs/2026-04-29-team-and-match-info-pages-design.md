# 球队信息与比赛信息页面设计

日期：2026-04-29

## 目标

在 `apps/admin` 的 `高歌FC` 菜单下，于 `球员信息` 平级新增两个真实业务页面：

- `球队信息`
- `比赛信息`

两者都采用与当前 `球员信息` 相同的页面组织结构和 CRUD 交互模式，而不是单独引入新的页面范式或仅搭建空壳菜单。

## 背景

当前后台已有 `球员信息` 页面，目录结构已经收敛为：

- `index.vue`
- `auth.ts`
- `model/*`
- `schemas/*`
- `components/*`

这一结构已经在仓库中形成稳定模式，适合作为后续真实业务页的统一模板。

同时，前序设计已经明确两类新业务实体：

- `Team`
- `MatchRound + MatchRoundTeamResult`

因此这次不应只创建路由占位页，而应直接按既有结构落成两个可用的后台功能页。

## 范围

包含：

- 新增 `球队信息` 页面、路由与权限定义
- 新增 `比赛信息` 页面、路由与权限定义
- 为两者补齐对应 API 模块与后台 CRUD 页面
- 比赛信息页支持维护一场比赛及该场 3 支球队的名次结果

不包含：

- 积分榜页面
- 球员与球队多对多归属改造
- 单场球员出战/报名明细
- 赛季、分组、淘汰赛等复杂比赛结构

## 设计原则

### 与球员信息保持同构

两个新页面都应遵循当前 `球员信息` 的同类结构：

- 页面逻辑集中在 `index.vue`
- 数据转换放到 `model/*`
- 列表、搜索、表单 schema 放到 `schemas/*`
- 表单体放到 `components/*`
- 权限定义放到 `auth.ts`

原因：

- 降低维护成本
- 保持后台模块的一致性
- 避免为单个新页面再引入另一套组织方式

### 先做真实业务页，不做空壳

本次不建议只加菜单和空页面。

如果只搭壳子，后续还要重复补齐：

- Prisma 模型
- API 接口
- 页面表单和列表
- 校验逻辑

这样会导致一次需求拆成两轮返工，收益低。

### 比赛信息以“一场比赛 + 3 支球队结果”作为最小完整单元

比赛信息页不拆成更细的对阵或赛季结构。

每条比赛记录直接对应：

- 一个 `MatchRound`
- 三条 `MatchRoundTeamResult`

这样最符合当前业务约束，也最容易支撑后续积分榜统计。

## 页面结构

建议新增目录：

```text
apps/admin/src/views/gaoge/team/
  index.vue
  auth.ts
  model/
    defaults.ts
    mapper.ts
    types.ts
  schemas/
    form.ts
    search.ts
    table.ts
  components/
    TeamFormDialog.vue

apps/admin/src/views/gaoge/match_round/
  index.vue
  auth.ts
  model/
    defaults.ts
    mapper.ts
    types.ts
  schemas/
    form.ts
    search.ts
    table.ts
  components/
    MatchRoundFormDialog.vue
```

说明：

- 命名沿用当前后台目录风格
- 比赛信息目录使用 `match_round`，与后端实体 `MatchRound` 对齐

## 路由与菜单

在 `apps/admin/src/router/modules/gaoge/index.ts` 中，于 `球员信息` 平级新增：

- `球队信息`
- `比赛信息`

建议：

- 路径：`/gaoge/team`
- 路由名：`team`
- 标题：`球队信息`

- 路径：`/gaoge/match-round`
- 路由名：`matchRound`
- 标题：`比赛信息`

## 数据模型与接口映射

### 球队信息

对应实体：`Team`

字段：

- `id`
- `code`
- `name`
- `slogan`
- `sponsorName`
- `sort`
- `createdAt`
- `updatedAt`

接口建议：

- `GET /teams`
- `POST /teams`
- `PATCH /teams/:id`
- `DELETE /teams/:id`

如果固定 3 队不允许新增删除，则页面层不展示新增/删除入口，但接口仍可按标准 CRUD 保留，或仅保留查询与更新，具体以后端实现阶段收敛。

### 比赛信息

对应实体：

- `MatchRound`
- `MatchRoundTeamResult`

主记录字段：

- `id`
- `matchDate`
- `venue`
- `remark`
- `createdAt`
- `updatedAt`

结果字段：

- `teamId`
- `rank`
- `points`

接口建议：

- `GET /match-rounds`
- `GET /match-rounds/:id`
- `POST /match-rounds`
- `PATCH /match-rounds/:id`
- `DELETE /match-rounds/:id`

写入方式：

- 创建和编辑都以事务方式同时处理主表和 3 条球队结果

结果约束：

- 一场比赛必须正好有 3 条球队结果
- 3 个 `teamId` 不可重复
- `rank` 必须唯一且正好覆盖 `1 / 2 / 3`
- `points` 由后端按名次自动计算：
  - `1 -> 2`
  - `2 -> 1`
  - `3 -> 0`

## 球队信息页面设计

### 列表

列表字段：

- `名称`
- `Slogan`
- `赞助商名称`
- `排序`
- `创建时间`
- `更新时间`

### 搜索

第一轮搜索条件建议只保留：

- `关键词（名称）`

原因：

- 当前字段量不多
- 不需要提前引入复杂筛选

### 表单

表单字段：

- `名称`：必填
- `slogan`：非必填
- `sponsorName`：非必填
- `sort`：必填，默认 `0`

关于 `code`：

- 不建议在后台对运营展示
- 更适合初始化时写死，或由后端按规则生成

### 按钮策略

如果固定 3 支球队不允许新增删除：

- 页面保留列表和编辑
- 隐藏新增、删除按钮

如果允许维护：

- 保留完整 CRUD

## 比赛信息页面设计

### 列表

列表字段：

- `比赛日期`
- `场地`
- `备注`
- `本场结果摘要`
- `创建时间`
- `更新时间`

其中 `本场结果摘要` 用于在列表中简要展示 3 支球队的本场名次和积分，例如：

- `皇家高歌 第1(2分) / 高歌国际 第2(1分) / 高歌联 第3(0分)`

### 搜索

第一轮建议搜索条件为：

- `比赛日期`
- `场地关键词`（可选）

### 表单

表单字段：

- `比赛日期`：必填
- `场地`：非必填
- `备注`：非必填

结果录入区：

- 固定展示 3 支球队：
  - `皇家高歌`
  - `高歌国际`
  - `高歌联`
- 每支球队录入一个名次：`1 / 2 / 3`
- 页面实时显示该名次对应积分：`2 / 1 / 0`

### 前端校验

提交前需校验：

- 3 个名次都已填写
- 名次不能重复

如果校验失败，前端直接阻止提交并提示用户。

### 后端校验

服务端仍需重复校验：

- 是否正好 3 条球队结果
- 名次是否唯一
- 球队是否重复
- `points` 是否由系统重新计算

## 权限设计

建议沿用当前 `player/auth.ts` 模式，为两个新模块分别建立权限常量。

### 球队信息

建议权限：

- `team:view`
- `team:create`
- `team:update`
- `team:delete`

### 比赛信息

建议权限：

- `matchRound:view`
- `matchRound:create`
- `matchRound:update`
- `matchRound:delete`

页面按钮和表格操作按这些权限控制显隐。

## 实施边界

本轮实现应包含：

- Prisma 模型与迁移
- API 模块
- Admin 页面
- 路由菜单

本轮不应顺手扩展：

- 积分榜页面
- 球员多队归属
- 单场球员出战明细
- 赛季和复杂赛程

## 实施顺序建议

1. 先实现 `Team` 的 Prisma 模型、迁移和 API
2. 再实现 `球队信息` 页面
3. 实现 `MatchRound` 与 `MatchRoundTeamResult` 的 Prisma 模型、迁移和 API
4. 实现 `比赛信息` 页面
5. 挂载路由与菜单
6. 运行 typecheck 与接口验证

## 结论

这次最合适的做法不是只加平级菜单壳子，而是直接按 `球员信息` 当前结构落成两个真实业务页：

- `球队信息`
- `比赛信息`

这样既保持后台架构一致，也能让后续积分榜、球队归属等能力建立在稳定的数据和页面基础上，而不是继续堆临时页面。
