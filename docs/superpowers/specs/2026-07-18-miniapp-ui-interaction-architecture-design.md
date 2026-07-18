# 高歌 miniapp UI 与交互架构设计

日期：2026-07-18

状态：已确认设计，待实现计划

## 1. 目标

为 `apps/miniapp` 微信原生 Skyline 小程序定义第一套可长期演进的前台 UI 与交互架构，覆盖：

- 视觉风格与主题色
- 页面信息架构
- 底部主导航
- 通用公共组件分层
- 赛事业务组件分层
- 首页、赛程、榜单、我的、详情和报名签到等关键交互模式
- 后续实现时的目录落点与验证方式

本设计不直接改运行代码。实现阶段再按本设计拆分计划并逐步落地。

## 2. 参考与定位

用户确认参考“粗门小程序”的信息架构和交互气质，但不做贴近复刻。

参考重点：

- 年轻运动社交气质
- 强活动卡片流
- 分类与筛选前置
- 绿色高亮主操作
- 报名、参与、分享等动作清晰
- 空状态和运营文案更轻松

公开参考来源：

- 粗门官网：https://www.cumen.fun/
- 粗门 App Store 页面：https://apps.apple.com/cn/app/%E7%B2%97%E9%97%A8/id1593823623
- 公开截图中展示的活动流、运动分类、城市和时间筛选、绿色 CTA 与五栏导航模式

高歌 miniapp 不应变成粗门的泛活动平台。高歌的核心身份是“赛事俱乐部入口”，第一版服务高歌超级联赛，应优先服务：

- 看下一场比赛
- 看赛程
- 报名
- 签到
- 看积分榜
- 看球队与球员
- 查看战报和生成分享海报

## 3. 设计原则

### 3.1 赛事优先，不做泛广场

首页首屏必须明确当前赛季和下一场比赛，而不是先展示泛活动流。活动发现感可以借鉴粗门，但高歌需要保留赛事秩序和联赛主线。

### 3.2 主操作前置

报名、签到、查看赛程、查看榜单、生成海报是用户最常触发的动作。页面中应有一个明确主操作，次要操作通过文字按钮、图标按钮或更多菜单承载。

### 3.3 图片增强真实感

赛事、球队、球员、战报优先使用真实图片或真实可配置封面。无图时使用统一占位，不使用纯装饰渐变作为主视觉。

### 3.4 原生轻组件

继续遵守现有技术架构：

- 微信原生小程序
- Skyline
- glass-easel
- TypeScript
- WXSS tokens
- 自研轻量组件

不引入 TDesign、Vant、WeUI、Tailwind、UnoCSS 或跨端 UI 框架。

### 3.5 触控友好

主要点击区域不小于 `88rpx` 高。图标按钮视觉尺寸可小，但点击热区必须足够。列表卡片的主 CTA 和卡片跳转区域要有清晰边界，避免误触。

## 4. 视觉系统

### 4.1 风格方向

采用“赛事俱乐部型”视觉：

- 浅灰绿页面底
- 白色内容卡片
- 黑绿撞色赛事 hero
- 荧光运动绿作为主按钮和选中态
- 琥珀色作为提醒、徽章、排名变化点缀
- 小面积圆角卡片和清晰分割
- 真实赛事图、球队图和球员头像提升现场感

避免：

- 大面积深色导致阅读疲劳
- 大面积单一绿色导致廉价感
- 过多渐变和装饰图形
- 后台管理式表格视觉
- 纯营销页 hero 结构

### 4.2 主题色 token

建议将 `apps/miniapp/miniprogram/styles/tokens.wxss` 扩展为以下语义 token：

```css
page {
  --gg-color-bg: #f4f7f5;
  --gg-color-surface: #ffffff;
  --gg-color-surface-raised: #ffffff;
  --gg-color-surface-inverse: #101417;
  --gg-color-border: #e4eae6;
  --gg-color-divider: #edf1ee;

  --gg-color-text-primary: #101417;
  --gg-color-text-secondary: #5b6360;
  --gg-color-text-muted: #8a948f;
  --gg-color-text-inverse: #ffffff;

  --gg-color-primary: #16e66d;
  --gg-color-primary-pressed: #12c85e;
  --gg-color-primary-soft: #dffbe9;
  --gg-color-primary-ink: #062b18;

  --gg-color-accent: #ffb020;
  --gg-color-accent-soft: #fff2cf;

  --gg-color-success: #12b76a;
  --gg-color-warning: #f79009;
  --gg-color-danger: #ef4444;
}
```

当前已有 `--gg-color-primary: #0f766e` 偏稳重，适合后台或通用品牌底色，但作为粗门参考下的运动小程序主按钮不够有活力。实现时应保留深绿色作为 `primaryInk` 或深色场景色，把主 CTA 调整为更亮的运动绿。

### 4.3 字体层级

使用系统字体，不额外引入字体文件。

```text
display: 48rpx / 60rpx / 700  首页赛季标题、关键数字
title-lg: 40rpx / 52rpx / 700  详情页主标题
title-md: 34rpx / 46rpx / 600  卡片标题、区块标题
body: 28rpx / 42rpx / 400      正文
label: 24rpx / 34rpx / 500     标签、辅助信息
caption: 22rpx / 30rpx / 400   次级说明
```

赛事数据、比分、排名数字应使用更高字重和等宽数字特性可读策略；微信 WXSS 不稳定支持等宽数字时，至少保证数字区域有稳定宽度。

### 4.4 圆角与阴影

```text
radius-sm: 8rpx
radius-md: 16rpx
radius-lg: 24rpx
radius-pill: 999rpx

shadow-card: 0 8rpx 24rpx rgba(16, 20, 23, 0.06)
shadow-sheet: 0 -12rpx 32rpx rgba(16, 20, 23, 0.10)
```

卡片圆角默认不超过 `24rpx`。底部操作栏和浮层可以使用更大顶部圆角，但不要让所有元素都变成胶囊。

## 5. 信息架构

### 5.1 主包页面

主包只放高频入口：

```text
pages/home/index        首页
pages/schedule/index    赛程
pages/standings/index   榜单
pages/profile/index     我的
```

### 5.2 分包页面

低频、详情和长流程进入分包：

```text
packages/match/pages/match-detail/index
packages/match/pages/registration/index
packages/match/pages/check-in/index
packages/content/pages/reports/index
packages/content/pages/report-detail/index
packages/player/pages/team-detail/index
packages/player/pages/player-detail/index
packages/poster/pages/share-poster/index
```

该结构与现有 `config/routes.ts` 基本一致。实现时新增页面必须同步维护 `Routes`，页面内不手写跳转路径。

### 5.3 底部导航

建议第一阶段使用 4 栏底部导航：

```text
首页
赛程
榜单
我的
```

不采用粗门的中间发布按钮。原因：

- 高歌不是开放活动发布平台
- 当前高频动作是报名、签到和分享，不是发起活动
- 中央按钮会误导用户以为可以发布赛事

报名、签到、生成海报应放在页面内主 CTA 或详情页底部固定操作栏。

## 6. 页面模式

### 6.1 首页

首页结构：

```text
自定义导航
赛季 hero
下一场比赛卡片
快捷操作
赛程预告
积分榜预览
战报 / 动态
球队入口
```

首屏目标：

- 3 秒内知道当前是什么赛事
- 直接看到下一场比赛
- 能一键进入报名、签到或赛程

首页 hero 使用黑绿撞色，可以显示：

- 当前赛季名称
- 赛季状态
- 参赛球队数量
- 下一轮日期
- 赛事封面或球队合成图

### 6.2 赛程页

赛程页借鉴粗门的活动筛选模式，但筛选维度改成赛事场景：

```text
轮次 tabs
状态筛选：全部 / 待开始 / 报名中 / 已结束
时间筛选：本周 / 本月 / 全部
比赛卡片流
```

比赛卡片必须展示：

- 比赛标题或对阵
- 时间
- 地点
- 状态
- 报名人数或队伍信息
- 主操作按钮

状态到按钮映射：

```text
报名中 -> 立即报名
已报名且未开始 -> 查看详情 / 取消报名作为次级
可签到 -> 去签到
已结束 -> 看战报
```

### 6.3 榜单页

榜单页以积分榜为核心，不做复杂数据大屏。

结构：

```text
赛季选择
积分榜
排名变化 / 胜平负 / 净胜球
球队卡片入口
榜单说明
```

移动端优先显示：

- 排名
- 队徽 / 队名
- 积分
- 胜平负

更多字段放入球队详情或横向紧凑区，不默认制造横向滚动。

### 6.4 我的页

我的页是球员服务台：

```text
登录 / 用户信息
绑定球员状态
我的报名
我的比赛
我的签到
我的海报
设置和隐私
```

未登录时主操作是微信登录。已登录但未绑定球员时主操作是绑定球员。已绑定后优先展示球员身份和下一场相关状态。

### 6.5 比赛详情页

详情页结构：

```text
顶部封面 / 对阵区
比赛状态
时间地点
报名和签到状态
参赛信息
赛事说明
风险或注意事项
底部固定操作栏
```

底部固定操作栏只放一个主按钮和最多一个次按钮。主按钮文案随状态变化：

```text
立即报名
已报名
去签到
已签到
看战报
```

### 6.6 报名和签到

报名流程应尽量短：

```text
确认比赛信息
确认球员身份
选择或填写必要字段
提交
结果反馈
```

签到流程：

```text
扫码 / 手动入口
识别比赛
确认身份
签到成功
引导返回比赛详情或生成海报
```

错误反馈必须靠近问题本身，不能只给 toast。网络错误、未登录、未绑定球员、报名截止、重复签到都需要明确可恢复动作。

## 7. 公共组件架构

### 7.1 base 组件

`components/base` 只放无业务含义的基础组件：

```text
gg-button
gg-icon-button
gg-tag
gg-tabs
gg-filter-bar
gg-card
gg-empty
gg-skeleton
gg-avatar
gg-avatar-group
gg-state-badge
```

要求：

- 不直接调用 service
- 不写业务路由
- 不依赖赛事 DTO
- 用 properties 和 events 对外通信
- 支持 loading、disabled、pressed 等状态

### 7.2 shell 组件

`components/shell` 放应用框架组件：

```text
app-page
app-nav
app-tabbar
app-action-bar
app-sticky-filter
```

`app-page` 继续作为统一页面滚动容器。后续扩展时应支持：

- 自定义页面标题
- 是否展示返回
- 是否展示底部 tabbar padding
- 是否启用下拉刷新
- 页面 loading / error / empty 插槽

### 7.3 event 组件

`components/event` 放赛事业务展示组件：

```text
event-hero
match-card
schedule-card
standings-row
team-card
player-card
registration-status
check-in-panel
report-card
share-poster-preview
```

这些组件可以依赖 miniapp 本地展示模型，但不直接发请求。页面负责请求和状态管理，组件负责展示与事件上抛。

## 8. 交互状态

### 8.1 Loading

列表和首页聚合数据使用 skeleton，不使用大面积居中 spinner。按钮提交时按钮自身进入 loading，避免重复提交。

### 8.2 Empty

空状态文案可以更轻松，但必须与高歌语气一致：

```text
还没有上场记录
下一场等你来

暂无报名
有比赛时这里会显示你的报名状态
```

空状态组件应支持：

- 标题
- 描述
- 主操作
- 可选插画

### 8.3 Error

错误分三类：

- 页面级错误：接口不可用、数据加载失败
- 表单级错误：报名字段、手机号、身份绑定问题
- 操作级错误：报名截止、重复签到、权限不足

页面级错误使用错误状态页或卡片。操作级错误优先用 toast 加可见状态更新；重要失败需要保留可重试按钮。

### 8.4 Motion

动效保持轻量：

- 点击反馈：`opacity` 或轻微 `scale`
- 页面进入：不做复杂动画
- tab 切换：选中态滑块或颜色过渡
- 底部操作栏：随页面进入轻微上浮

动画时长控制在 `120ms ~ 240ms`，只使用 `opacity` 和 `transform`。

## 9. 实现落点

本设计实现时主要影响：

```text
apps/miniapp/miniprogram/styles/tokens.wxss
apps/miniapp/miniprogram/styles/spacing.wxss
apps/miniapp/miniprogram/styles/typography.wxss
apps/miniapp/miniprogram/styles/layout.wxss
apps/miniapp/miniprogram/styles/motion.wxss
apps/miniapp/miniprogram/components/base/*
apps/miniapp/miniprogram/components/shell/*
apps/miniapp/miniprogram/components/event/*
apps/miniapp/miniprogram/pages/*
apps/miniapp/miniprogram/packages/*
apps/miniapp/miniprogram/config/routes.ts
apps/miniapp/miniprogram/app.json
```

不应修改：

- `apps/admin`
- `apps/api`，除非后续页面真实联调发现 mini/v1 DTO 缺字段
- `packages/*`，除非需要补充共享契约类型
- 旧的 `apps/uniapp` 视觉实现

## 10. 验收标准

设计落地后至少验证：

- `pnpm --filter @gaoge/app-miniapp typecheck`
- `pnpm ci:miniapp:quality`
- 微信开发者工具模拟器打开首页无运行时报错
- 首页、赛程、榜单、我的 4 个主入口可跳转
- iPhone 常见宽度下无横向滚动和文字重叠
- 主按钮点击区域不小于 `88rpx`
- 空状态、加载状态、错误状态至少有组件级示例

若涉及接口 DTO 或数据库变更，再按 `docs/conventions/testing-and-verification.md` 补充 API smoke test。

## 11. 非目标

本设计不包含：

- 粗门界面逐像素复刻
- 视觉稿生成
- Figma 组件库
- 真实 API 字段补充
- 报名规则和签到规则的业务重写
- 微信支付
- IM 或群聊
- 活动发布后台
- 跨端 `apps/uniapp` 同步改造

## 12. 待实现建议

实现建议拆成 4 个阶段：

1. 扩展 tokens、基础样式和 base 组件。
2. 升级 `app-page`、`app-nav`，新增底部 `app-tabbar` 和底部操作栏。
3. 落地首页、赛程、榜单、我的四个主入口静态或 mock 数据 UI。
4. 接入真实 mini/v1 数据，补齐比赛详情、报名、签到和分享海报。

每阶段都应保持可运行和可 typecheck，不一次性重写所有页面。
