# 高歌 FC 赛季排行榜设计

日期：2026-05-13

## 目标

在 `apps/web` 的高歌 FC 页面中新增“赛季排行榜”功能，面向指定赛季展示三支固定球队的积分对比与每轮积分明细。

本次目标是：

- 支持按 `year + season` 查看单个赛季的排行榜，例如 `2026 春季赛`
- 页面主体包含柱状图积分对比与积分明细表
- 数据口径基于 `apps/api` 现有高歌 FC 比赛信息
- 后端提供面向前台直接消费的只读聚合接口

本次先完成设计，不在此文档中展开实现代码。

## 背景

当前仓库里，足球域已经具备支撑排行榜的数据基础：

- `Team` 表保存固定 3 支球队实体
- `MatchRound` 表保存比赛轮次主记录
- `MatchRoundResult` 表保存每轮每支球队的名次与积分

现有积分规则已经收敛为固定三队制：

- 每轮必须正好有 3 条结果
- 名次固定覆盖 `1 / 2 / 3`
- 积分固定为 `1 -> 2 分`、`2 -> 1 分`、`3 -> 0 分`

同时，`apps/web` 当前仍以静态内容为主，还没有直接消费足球比赛接口的排行榜能力。

因此这次不需要重新设计底层表结构，而是需要把已有比赛数据整理为前台可直接渲染的 standings 结构。

## 范围

包含：

- 判断排行榜是否需要新增表或字段
- 为足球域新增按赛季聚合的排行榜只读接口
- 为共享类型补充排行榜 contract
- 在 `apps/web` 的高歌 FC 页面中新增赛季排行榜区块
- 约定赛季筛选、柱状图、积分明细表和空态行为

不包含：

- 新增排行榜快照表、汇总表或物化表
- 修改现有比赛录入流程
- 新增复杂赛制，例如分组、淘汰赛、主客场
- 增加后台排行榜管理页
- 篮球域排行榜同步实现

## 设计结论

### 不修改表结构

本次不新增排行榜表，也不为 `Team`、`MatchRound`、`MatchRoundResult` 增加字段。

原因：

- 当前排行榜需要的数据已经完整存在于比赛结果明细中
- 查询范围仅限“单个赛季的 3 支固定球队”，实时聚合成本很低
- 若现在新增总榜快照表，会引入重复数据与额外一致性维护

因此本次采用“保留明细、按赛季实时聚合”的方案。

### 新增前台专用 standings 接口

虽然前端可以直接请求现有 `GET /football/match-rounds` 再自行透视，但不建议这样做。

原因：

- 前端会承担轮次透视、球队补齐、总分汇总等聚合逻辑
- 后续若 `admin` 或 `miniapp` 也要复用排行榜，会重复实现
- 排行榜口径应由后端统一，而不是散在各端

因此建议在 `apps/api` 新增一个面向展示层的只读接口：

- `GET /football/standings?year=2026&season=春季赛`

该接口专门服务赛季排行榜展示，不影响现有比赛录入与查询接口。

## 数据基础复用

本次直接复用以下实体：

- `Team`
- `MatchRound`
- `MatchRoundResult`

依赖关系如下：

- `MatchRound` 通过 `year + season` 表示一个赛季中的某一轮比赛
- `MatchRoundResult` 通过 `matchRoundId + teamId` 绑定某轮某队结果
- `points` 已经是后端按名次计算后的积分快照，可直接用于榜单聚合

这意味着排行榜无需新增存储层，只需要在读取层补一个聚合出口。

## API 设计

### 路由

- `GET /football/standings`

查询参数：

- `year`: 必填，赛季年度，例如 `2026`
- `season`: 必填，赛季枚举，取值沿用现有比赛赛季：`春季赛 | 夏季赛 | 秋季赛 | 冬季赛`

### 返回结构

建议新增独立 contract，而不是复用 `MatchRoundListResponse`：

```ts
interface FootballStandingParams {
  year: number | string
  season: MatchRoundSeason
}

interface FootballStandingRound {
  id: number
  round: number
  matchDate: string
  label: string
}

interface FootballStandingTeam {
  teamId: number
  teamCode: 'real' | 'inter' | 'united'
  teamName: string
  totalPoints: number
  roundPoints: number[]
}

interface FootballStandingResponse {
  season: {
    year: number
    season: MatchRoundSeason
  }
  rounds: FootballStandingRound[]
  teams: FootballStandingTeam[]
}
```

说明：

- `rounds` 用于前台柱状图和表格表头
- `teams` 用于图表与表格行数据
- `roundPoints` 与 `rounds` 一一对齐，前台无需再次透视
- `totalPoints` 直接驱动柱状图与表格最右侧总分列

### 聚合规则

接口内部处理规则如下：

- `year` 和 `season` 均为必填，缺任一项直接返回 `400`
- 查询指定 `year + season` 下的全部足球 `MatchRound`
- 不走分页
- 轮次顺序按 `round asc`，同轮再按 `matchDate asc`
- 每轮读取 3 条 `results`，抽取每支球队的 `points`
- 以球队为维度聚合出：
  - `roundPoints`
  - `totalPoints`
- 返回结果中始终补齐固定 3 支球队

### 排序规则

返回给前台的 `teams` 顺序建议统一为：

1. `totalPoints desc`
2. `team.sort asc`
3. `team.id asc`

原因：

- 柱状图和表格都应使用同一球队顺序
- 同分时需要稳定顺序，避免前端每次刷新顺序抖动

### 空赛季行为

当某个赛季没有任何比赛记录时：

- 返回 `200`
- `rounds = []`
- `teams` 仍返回固定 3 支球队
- 每支球队：
  - `roundPoints = []`
  - `totalPoints = 0`

这样前台可以稳定渲染空态，而不是处理接口缺字段或列表缺项。

### 脏数据行为

若数据库中出现不满足现有业务约束的比赛结果，例如：

- 某轮结果不是 3 条
- 某轮缺少某支球队结果
- 某轮名次不是完整的 `1 / 2 / 3`

则 standings 接口不做静默兜底拼装，应直接报错。

原因：

- 排行榜属于聚合结果，静默容错会掩盖源数据问题
- 当前系统已把三队结果完整性视为核心业务约束

## `apps/web` 页面设计

### 页面位置

排行榜不新增独立路由，直接放在高歌 FC 页面内部。

原因：

- 用户心智上，排行榜属于球队页内容的一部分
- 本次需求只针对高歌 FC，不需要再拆一层页面导航
- 避免当前前台页面结构被一次需求过度扩展

### 页面结构

高歌 FC 页面中的排行榜区块建议由以下区域组成：

1. 赛季筛选区
2. 柱状图积分对比区
3. 积分明细表区
4. 空态区

### 赛季筛选区

至少包含两个筛选项：

- `year`
- `season`

默认值先落到当前明确需求：

- `2026`
- `春季赛`

交互规则：

- 首次进入高歌 FC 页面时按默认赛季请求 standings
- 切换 `year` 或 `season` 时重新请求 standings
- 筛选状态仅影响排行榜区块，不改动球队页其它静态内容

### 柱状图积分对比区

柱状图只展示 3 支球队的 `totalPoints`。

设计要求：

- 球队顺序与接口返回 `teams` 保持一致
- 颜色保持稳定，与球队身份一致
- 当 `totalPoints` 全为 `0` 时仍保留柱状图骨架，不隐藏模块

实现原则：

- 不引入重型图表库
- 直接使用 Vue + CSS 完成 3 柱简单图形渲染

原因：

- 数据量极小
- 需求图形简单
- 减少前台额外依赖与体积

### 积分明细表区

表格结构固定为：

```text
球队 | 第1轮 | 第2轮 | 第3轮 | ... | 总积分
皇家高歌 | 2 | 1 | 0 | ... | 8
高歌国际 | 1 | 2 | 2 | ... | 9
高歌联   | 0 | 0 | 1 | ... | 3
总积分   | 3 | 3 | 3 | ... | 20
```

规则说明：

- 表头中的轮次来自 `rounds`
- 3 行球队数据来自 `teams`
- 每格分值来自 `teams[n].roundPoints[index]`
- 最右列显示该球队 `totalPoints`
- 最底部增加一行“总积分”，用于汇总每轮积分列与全赛季积分总和

底部“总积分”行的意义：

- 每列都能校验该轮三队总分是否恒为 `3`
- 最右下角能显示赛季总积分总和
- 视觉上形成完整闭环，而不是只看每队合计

### 空态

当 `rounds` 为空时：

- 保留排行榜标题与筛选器
- 柱状图区显示无比赛数据空态
- 表格显示空态说明，不渲染伪造轮次列

不建议在空赛季时直接隐藏整块内容。

### 移动端行为

由于轮次数量可能增长，表格采用横向滚动，而不是强行压缩列宽。

规则：

- 移动端优先保证球队名与分数可读
- 表格允许横向滚动
- 柱状图和表格顺序始终一致

## 共享类型设计

建议在 `packages/shared/types` 中补充 standings 相关类型，避免只在 `apps/api` 内部临时声明。

至少新增：

- `FootballStandingParams`
- `FootballStandingRound`
- `FootballStandingTeam`
- `FootballStandingResponse`

原因：

- `apps/api` 与 `apps/web` 共享同一份接口 contract
- 后续若 `apps/admin` 或 `apps/miniapp` 复用排行榜，不需要重复定义类型
- 避免前后端对返回结构的理解偏移

## 实现落点

### `apps/api`

建议新增足球 standings 只读模块，例如：

```text
apps/api/src/modules/football/standing/
  standing.controller.ts
  standing.service.ts
  dto/
```

职责：

- controller 负责解析 `year + season`
- service 负责按赛季读取并聚合 standings
- 不改动现有 `match-round` 的增删改查接口

### `apps/web`

建议在现有高歌 FC 页面中新增：

- standings 请求逻辑
- 赛季筛选状态
- 柱状图组件或内聚区块
- 积分明细表区块

同时补一个最小可用的数据请求层，不继续把排行榜相关数据写死在 `src/data` 中。

### `packages/shared/types`

新增 standings contract 并导出给前后端复用。

## 测试与验证

### 后端

至少覆盖以下情况：

- 正常赛季能返回轮次、球队每轮积分和总积分
- 空赛季返回空 `rounds` 与三队零分
- 同分时按 `team.sort` 稳定排序
- 某轮脏数据不满足三队约束时直接报错
- 缺 `year` 或 `season` 时返回 `400`

### 前端

至少验证以下场景：

- `2026 春季赛` 可正确展示柱状图和积分表
- 切换赛季时数据同步刷新
- 空赛季能正确展示空态
- 移动端表格可横向滚动
- 图表与表格的球队顺序保持一致

## 风险与边界

### 现有比赛数据为空

如果当前数据库尚未录入 `2026 春季赛` 的足球比赛，功能仍可上线，但页面初始看到的是空态。

这不是接口错误，而是业务数据未录入。

### 当前前台尚无成熟 API 层

`apps/web` 目前更多依赖静态数据，因此这次实现会顺带引入最小取数路径。

本次只应补足排行榜所需部分，不借题扩张为完整前台数据层重构。

### 排行榜仅面向单赛季

本次明确只看单个赛季，例如 `2026 春季赛`。

因此：

- 不做跨赛季累计
- 不做历史榜总榜
- 不做赛季对比视图

若未来出现这些需求，再在当前 standings 接口之上扩展，而不是现在提前抽象。

## 最终结论

本次高歌 FC 赛季排行榜功能不修改数据库表结构。

实现方式为：

- 继续复用现有 `Team`、`MatchRound`、`MatchRoundResult`
- 在 `apps/api` 新增按 `year + season` 聚合的 `GET /football/standings` 只读接口
- 在 `packages/shared/types` 中补齐 standings contract
- 在 `apps/web` 的高歌 FC 页面内新增赛季筛选、柱状图积分对比和积分明细表

这样可以在保持现有比赛录入模型不变的前提下，为前台提供稳定、可复用、口径统一的排行榜能力。
