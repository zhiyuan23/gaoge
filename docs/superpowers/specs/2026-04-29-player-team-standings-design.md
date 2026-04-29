# 球员多球队归属与积分榜设计

日期：2026-04-29

## 目标

围绕当前 `apps/api` 与 `apps/admin` 的球员信息模块，完成下一阶段数据结构设计，为以下需求提供稳定基础：

- 球员资料新增 `playerNumber`（球员号码）字段，范围 `0~100`，全局唯一。
- 球员资料新增 `jerseyName`（球衣印字名称）字段。
- `openid` 在新增和修改球员时改为非必填。
- 球员可同时归属多支固定球队，不再是单个自由文本分队。
- 系统内固定存在 3 支球队：
  - `皇家高歌`
  - `高歌国际`
  - `高歌联`
- 后续开发积分榜模块时，既能统计每轮比赛结果，也能汇总总积分榜。

本次先确定设计，不直接展开实现细节之外的业务扩展。

## 背景

当前仓库中的球员信息模块已经完成首轮迁入，前后端现状如下：

- `Player.openid` 当前为必填唯一字段。
- 球员尚无独立号码字段。
- `Player.subTeam` 当前为可空字符串。
- 前端球员表单把“分队”作为自由输入或临时选项使用。
- 列表字段和搜索条件尚未收敛到当前业务要求。
- 后端筛选按 `subTeam` 文本值做等值查询。
- Prisma 注释中曾提及“多选用逗号分隔字符串”，但当前实际模型仍然只是单字段文本。

这一实现无法稳定支撑新的业务约束：

- 球员号码需要全局唯一，且范围固定为 `0~100`。
- 新增和编辑球员时 `openid` 不能再作为必填项。
- 球员允许兼属多支球队。
- 单场比赛中球员只能代表其中一支球队出战。
- 球队积分需要按固定球队实体统计，而不是按自由文本聚合。

因此需要把“球队”从球员自由文本字段升级为独立实体，并引入球员与球队的关联关系。

## 范围

包含：

- 调整球员与球队的数据模型。
- 明确固定球队初始化方式。
- 为球员资料录入定义新的字段与提交结构。
- 为单轮比赛结果与总积分榜定义基础数据模型。
- 定义旧 `subTeam` 数据的迁移方向。

不包含：

- 球队后台独立 CRUD 页面。
- 赛季、分组、淘汰赛等复杂赛制。
- 球员单场技术统计，如进球、助攻、出场时间。
- 球员转会历史、时间区间归属历史。
- 复杂积分规则配置能力。

## 设计原则

### 固定球队也要有独立实体

虽然当前只有 3 支固定球队，且不需要后台动态维护，但球队仍应作为独立表存在，而不是继续作为球员上的裸文本值存在。

原因：

- 后续比赛结果和积分榜都需要稳定主键。
- 球员多队归属需要标准化关联关系。
- 球队名称、口号、赞助商等信息应集中存储。

### 只做当前明确需要的建模

本轮不为未来不确定需求增加复杂结构。

因此：

- 不做球队管理后台页面。
- 不做可配置积分规则表。
- 不做球员归属历史生效时间。

固定 3 支球队通过迁移或 seed 初始化即可。

### 比赛结果保留明细，总榜实时汇总

积分榜模块既要看每轮结果，也要看累计总分，因此应保存每轮比赛的球队名次结果，再按结果聚合出总榜。

当前不需要额外维护“总榜快照表”。

## 数据模型

### `Player`

保留现有球员主体信息，新增：

- `playerNumber Int`
- `jerseyName String?`

调整：

- `openid` 从必填唯一调整为可空唯一。
- `nickname` 保持必填且全局唯一。
- `playerNumber` 必填、全局唯一，值域限制为 `0~100`。
- 现有 `subTeam` 不再作为长期正式归属字段继续扩展。

建议处理策略：

- 迁移期内可短暂保留 `subTeam` 用于旧数据映射与兼容。
- 新逻辑全部转向 `PlayerTeam`。
- 完成迁移与前后台切换后，删除 `subTeam`。

约束建议：

- `@@unique([playerNumber])`
- `@@unique([nickname])`
- `@@unique([openid])` 保留，但 `openid` 允许为空

号码规则：

- 仅允许整数
- 范围为 `0` 到 `100`
- 不允许重复

### `Team`

新增球队表，字段建议如下：

- `id Int @id @default(autoincrement())`
- `code String @unique`
- `name String`
- `slogan String?`
- `sponsorName String?`
- `sort Int @default(0)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

初始化固定数据：

- `gaoge-real` / `皇家高歌`
- `gaoge-inter` / `高歌国际`
- `gaoge-united` / `高歌联`

说明：

- `slogan` 使用规范拼写。
- `sponsorName` 先设为可空，便于后续逐步补录。
- 当前不开放任意新增、删除球队。

### `PlayerTeam`

新增球员与球队关联表，表示一个球员可以归属多支球队。

字段建议：

- `id Int @id @default(autoincrement())`
- `playerId Int`
- `teamId Int`
- `createdAt DateTime @default(now())`

约束建议：

- `@@unique([playerId, teamId])`
- `@@index([teamId])`

关系语义：

- 一个球员可关联多支球队。
- 一支球队可关联多名球员。

### `MatchRound`

新增比赛轮次表，用于记录一轮三队循环赛的主记录。

字段建议：

- `id Int @id @default(autoincrement())`
- `matchDate DateTime`
- `venue String?`
- `remark String?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

说明：

- 当前“一轮比赛”对应一次三支球队都参与的结果录入。
- 本轮不拆成更细的对阵表。

### `MatchRoundTeamResult`

新增比赛轮次球队结果表，记录某轮中每支球队的名次与积分。

字段建议：

- `id Int @id @default(autoincrement())`
- `matchRoundId Int`
- `teamId Int`
- `rank Int`
- `points Int`
- `createdAt DateTime @default(now())`

约束建议：

- `@@unique([matchRoundId, teamId])`
- `@@unique([matchRoundId, rank])`
- `rank` 仅允许 `1 / 2 / 3`
- `points` 由系统根据 `rank` 自动计算：
  - `1 -> 2`
  - `2 -> 1`
  - `3 -> 0`

说明：

- 同一轮固定会有 3 条球队结果。
- 不允许人工随意填写积分，避免数据不一致。

## 业务规则

### 球员归属规则

- 球员资料中可以同时归属多支球队。
- 球队归属选项固定来自 `Team` 表。
- 前端不允许手动输入球队名称。

### 球员字段规则

- `playerNumber` 为必填字段。
- `playerNumber` 仅允许 `0~100` 的整数。
- `playerNumber` 全局唯一。
- `nickname` 为必填字段。
- `nickname` 全局唯一。
- `openid` 为非必填字段。
- `openid` 若填写，则仍需满足唯一性。

### 单场代表规则

- 球员虽然可以兼属多队，但在单场比赛中只能代表其中一支球队出战。
- 这一规则本次先在设计中明确，具体落实到后续比赛出场/报名模块时，由“单场出战记录”绑定唯一 `teamId` 实现。

### 积分规则

每轮比赛三支球队循环赛，最终得出一轮名次：

- 第 1 名：2 分
- 第 2 名：1 分
- 第 3 名：0 分

总积分榜按所有历史 `MatchRoundTeamResult.points` 聚合。

## 前后端改造方向

### 球员录入

后台球员表单调整为：

- 新增 `playerNumber`
- 新增 `jerseyName`
- 原“分队”输入改为“所属球队”多选
- 选项来源为 `GET /teams`
- 不允许 `allow-create` 自定义输入

表单提交规则：

- `openid` 非必填
- `playerNumber` 必填
- `nickname` 必填
- `teamIds` 作为所属球队多选结果提交
- `playerNumber` 在前后端双重校验 `0~100`

### 球员接口

`PlayerPayload` 调整为：

- 增加 `playerNumber: number`
- 增加 `jerseyName?: string`
- `openid?: string`
- 删除 `subTeam?: string`
- 增加 `teamIds?: number[]`

球员查询返回结构建议包含：

- 球员基础信息
- 所属球队列表，至少包含 `id`、`name`

关键词查询规则调整为：

- 仅搜索 `nickname`
- 仅搜索 `playerNumber`
- 不再把 `openid`、`realName`、`position`、旧 `subTeam` 作为关键词搜索目标

### 球队接口

新增：

- `GET /teams`

用途：

- 球员录入多选
- 球员列表筛选
- 后续比赛录入与积分榜查询

当前不新增球队写接口。

### 比赛录入接口

建议新增：

- `GET /match-rounds`
- `POST /match-rounds`

`POST /match-rounds` 的录入约束：

- 必须提交 3 支固定球队结果
- 每支球队在同一轮只能出现一次
- 名次只能为 `1 / 2 / 3`
- 不能重复名次
- `points` 后端自动计算，不接受前端自由传值

### 积分榜接口

建议新增：

- `GET /standings`

返回：

- 各球队总积分
- 可附带比赛轮次数、第一名次数等扩展统计，但不是本轮必须项

## 后台页面改造方向

### 球员信息页

需要调整：

- 列表字段改为：
  - `号码`
  - `头像`
  - `昵称`
  - `真实姓名`
  - `分队`
  - `备注`
- 表单新增 `球衣名称`
- 表单新增 `球员号码`
- `OpenID` 改为非必填
- `号码` 改为必填
- `昵称` 改为必填
- “分队”字段改为“所属球队”多选
- 列表展示所属球队名称列表
- 搜索条件改为：
  - `关键词（昵称/号码）`
  - `分队`

当前不需要：

- 新建球队管理页

### 比赛录入页

后续新增“一轮比赛录入”页面，界面规则：

- 固定展示 3 支球队
- 每支球队选择本轮名次
- 系统自动展示对应积分
- 保存时校验名次唯一性

### 积分榜页

后续新增：

- 单轮结果查看
- 总积分榜查看

总榜直接聚合展示，不维护单独人工录入总分。

## 数据迁移策略

### 旧字段迁移

现有 `Player.subTeam` 如已有数据，应迁移到 `PlayerTeam`。

迁移方式：

- 先创建 `Team` 固定数据。
- 读取旧 `subTeam`。
- 将旧值映射到固定球队编码或名称。
- 写入 `PlayerTeam`。

### 兼容期处理

迁移初期可以短暂保留 `subTeam` 字段，避免前后端切换期间接口完全断裂。

但要求：

- 新代码不再把 `subTeam` 作为唯一真实来源。
- 完成前后台切换与数据迁移后，删除 `subTeam`。

### 旧值映射约束

若历史数据存在非标准值，应单独清洗，不要静默写入错误球队。

例如：

- 标准值可映射：`皇家高歌`、`高歌国际`、`高歌联`
- 旧英文或别名如存在，应在迁移脚本中显式映射
- 无法识别的值应记录并人工确认

### 旧球员数据补齐

由于 `playerNumber` 改为必填且唯一，历史球员数据如果缺少号码，不能直接满足新约束。

处理原则：

- 迁移前先盘点现有数据是否已有可映射号码来源。
- 若历史数据缺少号码，需要补录后再完全切换到新约束。
- 不建议用脚本自动生成占位号码，否则会污染真实业务数据。

## 校验与测试要求

### 数据层

- `Player.playerNumber` 唯一
- `Player.nickname` 唯一
- `Player.openid` 唯一但允许为空
- `Team.code` 唯一
- `PlayerTeam(playerId, teamId)` 唯一
- `MatchRoundTeamResult(matchRoundId, teamId)` 唯一
- `MatchRoundTeamResult(matchRoundId, rank)` 唯一

### 接口层

- 创建/更新球员时校验 `playerNumber` 为 `0~100` 整数
- 创建/更新球员时校验 `nickname` 必填且唯一
- 创建/更新球员时 `openid` 可空，若传值则校验唯一
- 创建/更新球员时校验 `teamIds` 只能来自现有固定球队
- 创建比赛轮次时校验三支球队结果完整且名次不重复
- `points` 必须由服务端计算

### 前端层

- 球员表单正确校验 `OpenID` 非必填
- 球员表单正确校验 `号码` 必填、范围 `0~100`
- 球员表单正确校验 `昵称` 必填
- 球员表单球队选项只能选固定值
- 球员列表正确展示 `号码 / 头像 / 昵称 / 真实姓名 / 分队 / 备注`
- 球员搜索条件收敛为 `关键词（昵称/号码）` 与 `分队`
- 球员列表与搜索展示正确的球队名称
- 比赛录入页正确联动名次与积分

## 实施顺序建议

1. Prisma 调整 `Player`：
   - `openid` 改为可空
   - 增加 `playerNumber`
   - 增加 `jerseyName`
2. Prisma 新增 `Team`、`PlayerTeam`、`MatchRound`、`MatchRoundTeamResult`
3. 初始化固定 3 支球队
4. 迁移旧 `subTeam` 数据到 `PlayerTeam`
5. 补齐历史球员号码数据
6. 调整 `apps/api` 的 DTO、查询、返回结构
7. 调整 `apps/admin` 的球员页面录入、列表与筛选
8. 新增比赛轮次录入与积分榜接口、页面
9. 移除旧 `subTeam` 字段及其前后端兼容逻辑

## 结论

本次不建议继续沿用 `Player.subTeam` 文本字段，也不建议只用字符串数组承载球队归属。

最合适的方案是：

- 在 `Player` 中新增 `playerNumber`
- 新增固定 `Team` 表
- 新增 `PlayerTeam` 关联表
- 在 `Player` 中新增 `jerseyName`
- 将 `openid` 调整为非必填
- 将球员列表与搜索条件收敛到当前明确业务规则
- 通过 `MatchRound` 与 `MatchRoundTeamResult` 承载单轮比赛结果
- 总积分榜按比赛结果实时聚合

这样既满足当前“球员号码唯一 + OpenID 非必填 + 3 支固定球队 + 球员兼属 + 单轮积分榜 + 总积分榜”的明确需求，也不会提前引入超出当前范围的复杂抽象。
