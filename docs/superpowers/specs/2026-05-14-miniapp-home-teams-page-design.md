# 小程序 Home Player Team 三页重做方案

日期：2026-05-14

## 目标

参考平级项目 `../gaoge-sports-uni` 的页面布局与视觉氛围，为当前 `apps/miniapp` 重做以下三个页面：

- `pages/home/index`
- `pages/football/player/index`
- `pages/team/index`

本次重做的原则是：

- 允许放弃当前页面里的既有元素和排版
- 仅借鉴参考项目的布局思路、暗色配色和内容组织
- 不迁移参考项目的 `uview-plus` 组件依赖和写法
- 当前 `apps/miniapp` 统一使用现有的 uni-app + Vue + TDesign 体系
- 页面优先静态展示，只有当前仓库已有接口能支撑的内容才接真实数据

## 背景

当前仓库内：

- `apps/miniapp/src/pages/home/index.vue` 已有登录态和积分榜请求逻辑，但页面结构更偏管理信息展示
- `apps/miniapp/src/pages/football/player/index.vue` 已有 `GET /football/players` 列表请求，但布局较简陋
- `apps/miniapp` 当前没有 `team` 页面
- `apps/miniapp/src/data/teams.ts` 已经包含 `高歌 FC` 与另一支队伍的静态资料
- `apps/miniapp/src/pages.json` 当前 tabBar 为 `home / player / profile`
- 参考项目 `gaoge-sports-uni` 的 `home / player / team` 三页已形成完整的小程序内容页形态，但依赖 `uview-plus`

因此这次工作的重点不是复刻参考项目的技术实现，而是把它的页面分工和视觉风格迁入当前 miniapp，同时服从现有 monorepo 与 miniapp 技术栈约束。

## 范围

包含：

- 重写 `home` 页的信息结构与样式
- 重写 `player` 页的信息结构与样式
- 新增 `team` 页
- 调整 `pages.json`，形成 `home / player / team` 三页主导航
- 复用当前已有的 `auth.me`、`football/standings`、`football/players` 数据能力
- 将 miniapp 页面视觉改成接近参考项目的暗色体系

不包含：

- 引入或恢复 `uview-plus`
- 修改 `apps/api` 接口口径
- 改造 `packages/*`
- 迁移参考项目里的财务、资产、编辑、分享等本次无业务支撑的模块
- 删除 `profile` 页面文件本身

## 设计结论

### 方案选择

确认采用以下页面分工：

- `home` 只做轻量门面页
- `player` 承载主要的球员列表浏览
- `team` 承载高歌 FC 的静态球队介绍

不采用“首页大聚合页”方案，也不把球队信息继续堆回首页。

原因：

- 参考项目的三页分工更清晰，符合这次“参考布局”的要求
- 当前 miniapp 的真实数据能力足够支撑 `home` 与 `player`，而 `team` 可以安全使用静态资料落地
- 三页边界清楚后，后续如果继续补赛程、球队详情或个人页，也更容易演进

### 技术路线

页面实现坚持以下约束：

- 不引入 `uview-plus` 组件和样式体系
- 优先使用 uni-app 原生基础组件：`view`、`text`、`image`、`scroll-view`、`swiper`
- 继续兼容当前 miniapp 已接入的 TDesign；若需要小型图标或按钮，可选择性使用 `t-` 组件
- 不为了复刻参考项目而新增一套跨页面 UI 抽象

原因：

- 当前项目已从参考项目的 `uview-plus` 技术路线迁出，回退会制造两套 UI 体系并存的问题
- 这次需求的核心是页面结果，而不是复刻同构组件树
- 三个页面都能在现有基础组件上稳定实现，不需要扩大依赖范围

## 页面设计

### Home 页

`home` 页承担“高歌 FC 门面页”职责，从上到下包含 4 个区块。

#### 1. Hero 头图区

使用 `apps/miniapp/src/data/teams.ts` 中高歌 FC 的以下静态字段：

- `heroImage`
- `name`
- `fullName`
- `heroBadge`

页面顶部采用大图铺满 + 深色遮罩的方式展示，形成参考项目首页的首屏氛围。该区块不再保留当前首页的大块登录态卡片。

#### 2. 球队摘要卡

使用高歌 FC 的静态字段组合一张深色摘要卡，展示：

- 成立时间 `founded`
- 城市 `city`
- 主场 `stadium`
- 宣言 `quote`

这一区块用于承接参考项目首页里“视觉头图之后马上看到赛事主体信息”的节奏，但内容改成当前仓库已有的球队资料。

#### 3. 赛季概览卡

真实数据接当前已有接口：

- `authStore.me`
- `getFootballStandings({ year: 2026, season: '春季赛' })`

展示内容只保留轻量摘要，不在首页塞入完整积分明细表。推荐输出：

- 赛季名
- 轮次数量
- 参赛队数量
- 高歌 FC 的当前积分
- 若能稳定得出排序，则补充当前名次

若接口失败：

- 不展示技术错误堆栈
- 降级为简短文案，如“赛季数据稍后更新”

若 `me.binding` 存在：

- 在赛季概览卡底部或侧边展示“我已绑定的球员号码/昵称”

若 `me.binding` 不存在：

- 不额外制造单独状态卡
- 仅保持赛季概览内容完整

这样可以保留当前项目已有登录态价值，同时不破坏首页作为内容门面的轻量感。

#### 4. 快捷入口区

首页底部放两个入口卡片：

- 前往 `player`
- 前往 `team`

卡片视觉延续暗色主题，承担参考项目首页的导流功能。

### Player 页

`player` 页承担“球队成员浏览页”职责，保留真实列表接口，整体接近参考项目的连续内容流。

#### 顶部高亮卡

如果 `authStore.me?.binding` 存在，则页面顶部先单独显示“我的球员卡”。

信息来源：

- `me.binding.playerNumber`
- `me.binding.nickname`

若能在球员列表中匹配到同号码球员，可补足其状态、分队等信息；匹配不到则只显示绑定摘要。

没有绑定时不显示该区块。

#### 球员列表区

继续使用当前已有接口：

- `GET /football/players`

页面主体采用纵向卡片流。每张卡尽量展示当前接口已经稳定提供的字段：

- 号码 `playerNumber`
- 昵称 `nickname`
- 分队 `subTeam`
- 状态 `status`

如果存在合适字段，也可展示简短补充信息；但不依赖参考项目中当前仓库没有的数据模型，例如球衣图、称呼标签、头像编辑入口等。

布局目标：

- 比现有实现更像“浏览球队成员”
- 减少表格式信息感
- 强化号码和昵称层级

### Team 页

`team` 页是纯静态球队介绍页，本次只使用高歌 FC 数据，不展示另一支队伍。

页面从上到下包含：

#### 1. 头图与名称

使用：

- `heroImage`
- `name`
- `fullName`

形成独立的信息页开场。

#### 2. 基础信息卡组

展示 4 个静态信息块：

- 成立时间
- 所在城市
- 主场
- 类型

其中类型固定显示为“足球”。

#### 3. 球队宣言卡

使用 `quote` 单独展示。

#### 4. 图集区

使用 `gallery` 做静态图集展示。

图集以两列或单列卡片形式展示，不增加预览、放大、瀑布流等扩展能力。

## 视觉设计

### 总体方向

三个页面统一采用参考项目的暗色视觉体系，而不是沿用当前 miniapp 的白底卡片页面。

视觉基准：

- 页面主背景接近参考项目的 `#161b26`
- 面板背景接近 `#242831`
- 主强调色接近参考项目的亮绿色 `#21d59d`
- 文本主色使用浅色
- 次要文本使用灰蓝色弱化

### 与当前 miniapp 的关系

虽然当前 miniapp 已接入 TDesign，但这次不会强依赖 TDesign 的默认浅色视觉，也不会去兼容参考项目的 `uview-plus` token。

页面样式可以在当前 miniapp 的 `scss` 中直接定义，并按需要补充局部 CSS 变量。目标是：

- 视觉氛围靠近参考项目
- 技术实现保持当前 miniapp 风格
- 不为这三页扩散成全局主题重构

### 组件约束

不要求每个视觉块都用 TDesign 组件还原。

优先级如下：

1. 基础布局优先使用 uni-app 原生组件
2. 若现有 `CustomNavbar` 可用，则继续复用
3. 若某些小交互用 TDesign 更稳，可局部使用，但不把页面写成 TDesign 组件演示页

## 路由与页面组织

### 页面文件

本次目标文件为：

- `apps/miniapp/src/pages/home/index.vue`
- `apps/miniapp/src/pages/football/player/index.vue`
- `apps/miniapp/src/pages/team/index.vue`

### pages.json

`pages.json` 做以下调整：

- 新增 `pages/team/index`
- tabBar 从当前的 `home / player / profile` 改为 `home / player / team`

`profile` 页面文件本身不删除，只是从这次主导航中移出。

## 数据与状态设计

### Home 页

保留或新增以下本地状态：

- `standingsLoading`
- `standingsError`
- `standings`

不再保留当前首页里“多队切换”相关状态，因为本次确认 miniapp 只使用高歌 FC 数据。

### Player 页

保留：

- `page`
- `pageSize`
- `total`
- `players`

若本次页面不需要分页交互，则仍可一次拉取较大页容量，保持实现简单。

### Team 页

只消费 `teamMap['gaoge-fc']` 或等价静态常量，不引入远程请求。

## 错误处理

### Home 页 standings 失败

失败时：

- 首页不显示大段错误信息
- 改成轻量占位说明
- 保持页面其余静态内容仍可正常浏览

### Player 页列表失败

失败时：

- 显示简洁的空状态或失败态
- 允许用户下拉刷新或通过轻量按钮重试

本次不增加复杂的错误码映射。

## 测试与验证

完成实现后至少做以下验证：

- `pnpm --filter @gaoge/miniapp typecheck`
- 运行当前仓库可用的 lint 校验，至少覆盖本次改动文件
- 检查 `pages.json` 路由与 tabBar 配置是否能正确编译
- 人工确认 `home / player / team` 三页均可进入，且 `team` 已替代 tabBar 中的 `profile`

## 不做事项

本次明确不做：

- 接入赛程、比赛详情、财务、资产等参考项目页面模块
- 恢复 `uview-plus`
- 做全局暗色主题改造
- 在 `packages/*` 提炼球队展示共享层
- 新增后台式管理交互

## 实施摘要

本次实现应聚焦于：

- 用参考项目的深色内容页思路重做 miniapp 三页
- 首页轻量化，只保留门面和赛季摘要
- 球员页承担真实列表浏览
- 球队页承担高歌 FC 的静态介绍
- 技术上继续留在当前 `apps/miniapp` 的 TDesign/uni-app 体系内
