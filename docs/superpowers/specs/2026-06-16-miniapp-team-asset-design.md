# Miniapp 球队资产页设计

## 1. 背景

当前 `apps/miniapp` 的 tabbar 第四项仍为“我的”，对应页面 [apps/miniapp/src/pages/team/index.vue](/Users/snow/Documents/Gaoge/gaoge/apps/miniapp/src/pages/team/index.vue) 只是占位内容。仓库内已有完整的足球资产公开接口，以及 `apps/web` 中已上线的球队资产总览页与资产明细页：

- `apps/web/src/views/TeamsPage.vue`
- `apps/web/src/views/TeamAssetPage.vue`

本次目标不是把 `web /teams/football` 整页搬进小程序，而是把 tabbar 第四项改成“球队”，并在小程序里落地一个参考 `web` 信息架构、但适配 miniapp 浅色风格的足球队资产浏览闭环。

## 2. 本次目标

本次仅实现足球队资产浏览链路：

- tabbar 第四项从“我的”改为“球队”
- “球队”页展示足球队资产总览
- 点击“查看明细”进入足球队资产明细页
- 总体布局参考 `apps/web` 中：
  - `/teams/football` 的资产卡片区块
  - `/teams/football/assets` 的资产明细页
- 整体视觉改为当前 miniapp 的浅色风格

## 3. 明确范围

### 3.1 包含

- 更新 miniapp tabbar 文案与入口
- 将 `pages/team/index` 改造成足球队资产总览页
- 新增 `pages/football/asset/index` 资产明细页
- 新增 miniapp 端足球资产 API 封装
- 复用现有后端足球资产公开接口
- 保留“我的”页面文件，但本次不再在 tabbar 中提供入口

### 3.2 不包含

- 不实现篮球队切换或篮球队资产视图
- 不搬运 `web /teams/football` 中的球队介绍、轮播、积分榜等模块
- 不新增 miniapp 专用后端聚合接口
- 不重构现有 web 端或 API 端足球资产逻辑
- 不要求本次新增新的 tabbar 位图资源

## 4. 参考来源

### 4.1 Web 参考结构

- `apps/web/src/views/TeamsPage.vue`
  - 参考“球队资产”卡片区块的标题、说明、查看明细按钮、三指标布局
- `apps/web/src/views/TeamAssetPage.vue`
  - 参考“资产明细”页的信息架构
  - 保留总览、筛选、分页列表的交互结构

### 4.2 Miniapp 当前风格

沿用 miniapp 当前浅色系页面风格：

- 浅灰蓝背景
- 白色或高透明白色卡片
- 轻边框、轻阴影
- 工具类优先，必要时配合少量 `scss`

## 5. 目标页面设计

### 5.1 Tabbar 第四项

将 tabbar 第四项从：

- 文案：`我的`
- 入口：`pages/profile/index`

改为：

- 文案：`球队`
- 入口：`pages/team/index`

本次保留原 `pages/profile/index` 文件，不提供 tabbar 入口。

图标策略：

- 若仓库内无现成球队图标，本次允许先复用现有 `profile` 图标资源完成功能闭环
- 不在本次需求里新增设计产物或生成新的位图资源

### 5.2 球队总览页

页面文件：

- `apps/miniapp/src/pages/team/index.vue`

页面职责：

- 作为“球队”tab 的首页
- 只展示足球队资产总览，不承担完整球队频道职责

页面结构：

1. 顶部资产主卡片

- 标题：`球队资产`
- 说明：`公开球队当前收支总览与历史明细。`
- 右侧主按钮：`查看明细`

2. 三项指标卡片

- `总收入`
- `总支出`
- `当前结余`

3. 状态区

- 加载态：显示轻量占位文案或骨架
- 失败态：在卡片内部展示错误文案和重试按钮

视觉要求：

- 版式参考 web 资产卡片区块
- 颜色切换为 miniapp 浅色体系
- 收入、支出、结余三类数据使用浅色强调：
  - 收入：浅绿色
  - 支出：浅红/珊瑚色
  - 结余：浅蓝色

交互要求：

- 页面加载时请求一次资产总览
- 点击“查看明细”跳转到 `/pages/football/asset/index`
- 不在本页展示资产明细列表

### 5.3 球队资产明细页

页面文件：

- `apps/miniapp/src/pages/football/asset/index.vue`

页面职责：

- 展示足球队资产总览与历史流水记录
- 作为球队 tab 页的详细浏览页

页面结构：

1. 顶部页头

- 标题：`球队资产明细`
- 简介：说明当前为公开收支总览与历史流水记录

2. 总览卡片

- 展示：
  - `总收入`
  - `总支出`
  - `当前结余`

3. 筛选区

- `全部`
- `收入`
- `支出`

4. 资产流水列表

- 标题
- 类型标签
- 描述
- 日期
- 赛季信息（有则展示）
- 场次信息（有则展示）
- 金额
  - 收入：绿色正号
  - 支出：红色负号

5. 分页区

- `上一页`
- `第 X 页`
- `下一页`

交互要求：

- 挂载时并行请求总览与第一页列表
- 切换筛选时：
  - 重置到第 1 页
  - 只重拉列表
- 翻页时只拉列表
- 保持与 web 端一致的分页式数据行为，不改成无限滚动

视觉要求：

- 结构参考 `web TeamAssetPage`
- 视觉改为 miniapp 浅色版
- 强化移动端触控区域与卡片层次

## 6. 数据与接口设计

本次直接复用现有公开接口，不新增 API 协议。

### 6.1 资产总览

- `GET /football/asset-records/summary`

返回数据使用共享类型：

- `AssetRecordSummary`

### 6.2 资产列表

- `GET /football/asset-records`

使用共享类型：

- `AssetRecordListParams`
- `AssetRecordListResponse`

本次 miniapp 主要使用字段：

- `page`
- `pageSize`
- `direction`

## 7. 文件改动方案

### 7.1 页面与路由

- 修改：`apps/miniapp/src/pages.json`
  - tabbar 第四项改为“球队”
  - 第四项 `pagePath` 改为 `pages/team/index`
  - 注册 `pages/football/asset/index`

### 7.2 miniapp 页面

- 修改：`apps/miniapp/src/pages/team/index.vue`
  - 从占位页改为球队资产总览页

- 新增：`apps/miniapp/src/pages/football/asset/index.vue`
  - 实现球队资产明细页

### 7.3 miniapp API

- 新增：`apps/miniapp/src/api/football/asset/index.ts`
  - `requestFootballAssetSummary`
  - `requestFootballAssetRecords`

### 7.4 可选本地辅助文件

如页面实现中存在明显重复，可新增轻量文件，例如：

- `apps/miniapp/src/pages/team/model.ts`
- `apps/miniapp/src/pages/football/asset/model.ts`

限制：

- 只放本页格式化、标签映射、展示辅助逻辑
- 不做跨页面、跨应用的过早抽象

## 8. 状态与异常处理

### 8.1 总览页

- 加载中：显示加载文案或骨架
- 加载失败：显示错误文案与重试操作
- 空数据：总览数值按接口返回展示，不额外构造空页

### 8.2 明细页

- 总览加载失败：总览卡片区域显示失败信息
- 列表加载失败：列表区域显示失败信息与重试按钮
- 列表为空：展示“暂无资产记录”空态
- 切换筛选和翻页时保留页面骨架，避免整页闪烁

## 9. 设计约束

- 严格参考 `web` 的信息架构，不直接照搬暗色皮肤
- miniapp 优先保持浅色风格一致性
- 不扩展到篮球资产
- 不顺手重构 profile 页面或其它 tab 页
- 不改 API 协议

## 10. 验证计划

最低验证：

- `pnpm --filter @gaoge/app-miniapp typecheck`

如本次改动牵动共享类型或 API 类型引用，再补：

- `pnpm --filter @gaoge/app-api typecheck`

## 11. 风险与取舍

### 11.1 tabbar 图标

当前仓库未确认存在球队专用 tabbar 图标资源，因此本次默认不新增图片资源。若没有合适图标，先复用现有图标完成功能闭环，后续再补品牌化替换。

### 11.2 范围控制

`web /teams/football` 中还包含球队展示、积分榜等内容，但这些不属于本次“球队资产入口”目标。为避免范围失控，本次只抽取资产相关结构。

### 11.3 明细交互

虽然小程序常见无限滚动，但本次为了对齐 `web` 数据行为并降低实现风险，先保留分页交互，不额外改协议或换加载模型。
