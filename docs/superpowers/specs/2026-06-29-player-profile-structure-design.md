# 球员资料结构扩展设计

## 背景

当前球员信息由 `Player` 主表承载，已有 `subTeam` 文本字段和 `position` 文本字段。后台表单可以编辑这些字段，小程序登录态摘要也会返回分队和位置。

新的需求是：

- `subTeam` 改为从球队信息中选择，支持单选和多选
- 引入主队概念，但允许无主队
- 个别球员可以没有主队，同时代表三支球队
- `position` 改为参考足球位置选择，支持单选和多选
- 引入主位置概念
- 新增签名或简介字段，每人维护一句话，长度控制在 15 个字

本设计只处理球员基础资料结构，不引入赛季数据、能力值、荣誉、照片墙等更重的球员档案系统。

## 设计目标

- 球队归属使用真实球队资源，而不是继续存逗号文本
- 能表达“代表多队”和“无主队”
- 能表达“可踢多个位置”和“主位置”
- 保持现有后台球员 CRUD 的目录结构和交互模式
- 保持小程序登录态摘要可继续消费球员资料
- 对旧字段 `subTeam`、`position` 做兼容迁移，不一次性打断现有页面

## 数据模型

### 球队关系

在 `Player` 上新增可空主队字段：

```prisma
primaryTeamId Int?
primaryTeam   Team? @relation("PlayerPrimaryTeam", fields: [primaryTeamId], references: [id], onDelete: SetNull, onUpdate: Cascade)
```

新增球员-球队关联表：

```prisma
model PlayerTeam {
  playerId  Int
  teamId    Int
  createdAt DateTime @default(now())

  player Player @relation(fields: [playerId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  team   Team   @relation(fields: [teamId], references: [id], onDelete: Restrict, onUpdate: Cascade)

  @@id([playerId, teamId])
  @@index([teamId])
}
```

语义：

- `PlayerTeam` 表示球员代表哪些球队
- `Player.primaryTeamId` 表示主队
- `primaryTeamId` 可为空
- 当 `primaryTeamId` 不为空时，必须包含在 `teamIds` 中
- `teamIds` 可多选；为了避免无归属数据，后台新增/编辑默认要求至少选择一个代表球队

示例：

| 场景                       | `teamIds`                      | `primaryTeamId` |
| -------------------------- | ------------------------------ | --------------- |
| 只属于皇家高歌             | `[皇家高歌]`                   | `皇家高歌`      |
| 主队皇家高歌，也代表高歌联 | `[皇家高歌, 高歌联]`           | `皇家高歌`      |
| 无主队，同时代表三支球队   | `[皇家高歌, 高歌国际, 高歌联]` | `null`          |

### 位置字段

在 `Player` 上新增：

```prisma
positions       String[]
primaryPosition String?
```

语义：

- `positions` 表示可踢位置，支持多个
- `primaryPosition` 表示主位置
- `primaryPosition` 可为空
- 当 `primaryPosition` 不为空时，必须包含在 `positions` 中
- 后台新增/编辑默认要求至少选择一个可踢位置

位置暂不建表，使用共享字典。原因是足球位置是稳定业务字典，不需要后台动态维护；后续如果要自定义位置、排序、分组或图标，再独立建 `FootballPosition` 资源。

建议第一版位置 code：

| code                   | 展示名 |
| ---------------------- | ------ |
| `goalkeeper`           | 门将   |
| `center_back`          | 中后卫 |
| `left_back`            | 左后卫 |
| `right_back`           | 右后卫 |
| `defensive_midfielder` | 后腰   |
| `central_midfielder`   | 中前卫 |
| `attacking_midfielder` | 前腰   |
| `left_winger`          | 左边锋 |
| `right_winger`         | 右边锋 |
| `striker`              | 中锋   |
| `forward`              | 前锋   |

### 签名字段

在 `Player` 上新增：

```prisma
signature String?
```

语义：

- 用于一句话签名或简介
- 可为空
- 后端限制最多 15 个字符
- 前端输入框设置 `maxlength=15` 并展示字数

## 旧字段兼容

`subTeam` 和 `position` 当前仍有接口、后台列表、小程序摘要依赖。本次不立即删除字段，采用兼容迁移。

### `subTeam`

- 保留数据库字段 `subTeam`
- 新写入以 `teamIds` / `primaryTeamId` 为准
- 返回球员数据时附带新字段 `teams`、`teamIds`、`primaryTeamId`、`primaryTeam`
- 兼容字段 `subTeam` 可由已选球队名称拼接生成，或在迁移完成前继续返回旧值
- 后台表单不再直接编辑 `subTeam` 文本

迁移旧数据时，按 `subTeam` 文本匹配 `Team.name`：

- 能匹配到一个或多个球队时，写入 `PlayerTeam`
- 旧 `subTeam` 只有一个球队时，可将其设为 `primaryTeamId`
- 旧 `subTeam` 有多个球队或无法可靠判断主队时，`primaryTeamId` 保持为空

### `position`

- 保留数据库字段 `position`
- 新写入以 `positions` / `primaryPosition` 为准
- 返回球员数据时附带新字段 `positions`、`primaryPosition`
- 兼容字段 `position` 可由主位置展示名或 `positions` 展示名拼接生成
- 后台表单不再直接编辑 `position` 文本

迁移旧数据时，按中文展示名或历史文本映射到位置 code：

- 能匹配到一个位置时，写入 `positions=[code]`，并设为 `primaryPosition`
- 能匹配到多个位置时，写入 `positions`，`primaryPosition` 为空
- 无法匹配时，保留旧 `position` 文本，不强行写入新字段

## 共享类型

在 `packages/shared/types` 增加足球位置类型和选项：

```ts
export type FootballPosition =
  | 'goalkeeper'
  | 'center_back'
  | 'left_back'
  | 'right_back'
  | 'defensive_midfielder'
  | 'central_midfielder'
  | 'attacking_midfielder'
  | 'left_winger'
  | 'right_winger'
  | 'striker'
  | 'forward'
```

`Player` 增加：

```ts
teamIds: number[]
teams: Team[]
primaryTeamId: number | null
primaryTeam: Team | null
positions: FootballPosition[]
primaryPosition: FootballPosition | null
signature: string | null
```

`PlayerPayload` 增加：

```ts
teamIds?: number[]
primaryTeamId?: number | null
positions?: FootballPosition[]
primaryPosition?: FootballPosition | null
signature?: string
```

小程序摘要 `MiniappPlayerSummary` 同步增加相同展示字段，避免个人页后续再单独请求球员详情。

## API 设计

### 列表与详情

`GET /football/players` 和 `GET /football/players/:id` 返回球员时包含：

- `teams`
- `teamIds`
- `primaryTeam`
- `primaryTeamId`
- `positions`
- `primaryPosition`
- `signature`

列表查询新增可选参数：

```ts
teamId?: number
primaryTeamId?: number | 'none'
position?: FootballPosition
primaryPosition?: FootballPosition
```

第一版后台搜索建议只接入 `teamId` 和 `position`，主队/主位置筛选可以后续按实际使用补充。

### 创建与更新

`POST /football/players` 和 `PATCH /football/players/:id` 接受：

- `teamIds`
- `primaryTeamId`
- `positions`
- `primaryPosition`
- `signature`

服务层校验：

- `teamIds` 必须指向存在的球队
- `primaryTeamId` 不为空时必须存在于 `teamIds`
- `positions` 必须是合法位置 code
- `primaryPosition` 不为空时必须存在于 `positions`
- `signature` 去除首尾空格后不超过 15 个字符，空字符串归一化为 `null`

写入球队关系时，在事务中完成：

1. 更新 `Player` 主表字段
2. 删除该球员原有 `PlayerTeam`
3. 按 `teamIds` 重建关联

## 后台设计

球员表单调整：

- “代表球队”：多选，从 `football/teams` 拉取，按球队排序展示
- “主队”：单选，只能从已选代表球队中选择，额外提供“无主队”
- “可踢位置”：多选，使用足球位置字典
- “主位置”：单选，只能从已选可踢位置中选择，额外提供“无主位置”
- “签名/简介”：输入框，`maxlength=15`，显示字数

表单联动：

- 当代表球队移除某球队，如果该球队是主队，则自动清空主队
- 当可踢位置移除某位置，如果该位置是主位置，则自动清空主位置
- 新增时可默认不选主队、不选主位置，但代表球队和可踢位置需要选择

列表展示调整：

- “分队”列改为“代表球队”，展示球队名称列表
- 新增“主队”列，空值展示“无主队”
- “位置”列展示可踢位置中文名列表
- 新增“主位置”列，空值展示“无主位置”
- 可新增“签名”列，内容较短，适合直接展示

搜索调整：

- “分队”筛选改为“代表球队”，从球队信息动态生成选项
- 新增“位置”筛选，使用位置字典

## 小程序影响

小程序当前个人页仍是静态展示，但登录态和个人资料接口已经返回球员摘要。本次扩展后：

- 登录态摘要包含主队、代表球队、主位置、可踢位置、签名
- 可绑定球员列表可以继续只显示号码、昵称、球队摘要
- 球队摘要优先展示主队；无主队时展示代表球队名称拼接

小程序资料编辑接口如继续开放编辑，应先只允许编辑签名、昵称、真实姓名等个人资料字段，不建议让普通用户直接改主队和代表球队。

## 测试与验证

后端：

- `PlayerService` 创建时校验主队必须包含在代表球队中
- `PlayerService` 更新时校验主位置必须包含在可踢位置中
- `PlayerService` 创建/更新会重建 `PlayerTeam`
- `PlayerService` 列表返回包含球队关系
- `MiniappService` 和 `AuthService` 返回扩展后的摘要字段

前端：

- 后台球员表单主队选项随代表球队变化
- 后台球员表单主位置选项随可踢位置变化
- 签名输入限制 15 个字
- 列表筛选按代表球队和位置工作

建议验证命令：

```bash
pnpm lint
pnpm typecheck
```

若实现包含 Prisma schema 变更，还需要在 `apps/api` 内运行 Prisma 生成和相关后端测试。

## 不在本次范围

- 删除 `subTeam` 和 `position` 旧字段
- 建立可后台维护的位置资源
- 球员能力值、身高体重、惯用脚、国籍、身价等完整档案字段
- 球员赛季统计和比赛数据
- 小程序静态个人页改成真实接口渲染
