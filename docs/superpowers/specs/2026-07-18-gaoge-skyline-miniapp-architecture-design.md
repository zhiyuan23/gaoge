---
title: 高歌 Skyline 赛事小程序技术架构设计
status: draft
date: 2026-07-18
owner: shared
scope: gaoge monorepo 内 apps/miniapp 微信原生 Skyline 小程序及 apps/api mini/v1 后端接口契约。
sources:
  - 02-Projects/高歌数字/overview/消费者端产品矩阵与高歌赛事小程序规划.md
  - 03-Topics/高歌超级联赛/concepts/联赛基础信息.md
  - 03-Topics/高歌超级联赛/concepts/球队信息.md
---

# 高歌 Skyline 赛事小程序技术架构设计

## 1. 背景与目标

高歌赛事小程序是 `gaoge` 项目内的微信小程序应用，第一版服务高歌超级联赛，同时按通用赛事活动模板设计，后续可以复制到其他赛事、训练营、团建和本地生活活动场景。

本设计只覆盖技术架构，不展开具体功能页面设计。功能设计在本架构确认后另行细化。

核心目标：

- 追求微信小程序内最佳性能体验和页面友好性。
- 使用微信原生小程序语法、Skyline 渲染引擎和 glass-easel 组件框架。
- 小程序作为 `gaoge` monorepo 内独立 app 开发，但保留未来独立抽离能力。
- 后端统一使用现有 `apps/api` 服务，不新起小程序后端服务。
- `apps/api` 同时服务 `apps/admin` 的赛事管理和 `apps/miniapp` 的前台展示，但接口层、DTO、权限和错误码分离。

## 2. 已确认架构决策

### 2.1 小程序位置

小程序放在 `gaoge` monorepo 内：

```text
gaoge/
  apps/
    api/
    admin/
    miniapp/
```

`apps/miniapp` 是高歌项目内应用，但按可抽离边界设计：

- 不直接引用 `apps/api/src`。
- 不直接引用 `apps/admin/src`。
- 只依赖 HTTP API、契约包、配置和静态资源。
- 高歌专属内容通过后端赛事配置和本地兜底配置提供，不写死在页面逻辑里。

### 2.2 后端位置

小程序后端直接使用现有 `apps/api`。不新起后端服务。

`apps/api` 内新增赛事域模块与 mini-facing routes：

```text
apps/api
  modules/event/
    event-series
    venue
    team
    participant
    schedule
    registration
    check-in
    match-result
    standing
    content-post
    share-asset

  routes/admin/
    管理端接口

  routes/mini/
    小程序前台接口
```

admin 和 miniapp 共享领域服务，但 controller、DTO、权限和响应结构分开。

## 3. 技术栈

运行时技术栈：

```text
微信原生小程序
+ Skyline
+ glass-easel
+ TypeScript
+ WXSS
+ 原生 Page / Component
+ 原生 wx API
```

工程层依赖：

```text
miniprogram-api-typings
miniprogram-ci
ESLint
Prettier
packages/miniapp-api-contract
轻量性能日志
自研基础 UI 组件和设计 tokens
```

不引入：

- uni-app、Taro、Vue、React 等跨端或 Web 框架。
- TDesign、Vant、WeUI 等重 UI 组件库。
- Redux、MobX 等复杂状态库。
- 运行时 CSS 框架。
- 复杂动画库。

理由：本项目优先性能上限和 Skyline 原生能力，新增运行时抽象会增加包体积、兼容成本和性能不可控因素。

## 4. Monorepo 与契约包

建议新增契约包：

```text
packages/
  miniapp-api-contract/
    src/
      index.ts
      response.ts
      errors.ts
      routes.ts
      version.ts
      pagination.ts
      dto/
        auth.dto.ts
        event-series.dto.ts
        team.dto.ts
        participant.dto.ts
        schedule.dto.ts
        registration.dto.ts
        check-in.dto.ts
        report.dto.ts
        standing.dto.ts
        share-asset.dto.ts
        home.dto.ts
```

契约包只放：

- DTO 类型。
- 接口路径常量。
- 错误码枚举。
- 分页结构。
- 通用响应结构。
- API 版本号。

契约包不放：

- Prisma 模型。
- 后端 service。
- controller。
- Node 专属逻辑。
- 微信小程序运行时逻辑。

以后小程序独立出仓库时，可以把 `packages/miniapp-api-contract` 发布成 npm 包，或复制到独立仓库的 `contracts/` 目录。

## 5. API 契约

### 5.1 版本与路径

所有小程序接口使用 `/mini/v1` 前缀：

```text
GET    /mini/v1/event-series/current/home
GET    /mini/v1/event-series/current/schedules
GET    /mini/v1/schedules/:scheduleId
GET    /mini/v1/event-series/current/teams
GET    /mini/v1/teams/:teamId
GET    /mini/v1/event-series/current/standings
GET    /mini/v1/reports
GET    /mini/v1/reports/:reportId
POST   /mini/v1/auth/wechat-login
POST   /mini/v1/auth/bind-phone
GET    /mini/v1/auth/profile
POST   /mini/v1/auth/logout
POST   /mini/v1/auth/privacy-consent
POST   /mini/v1/registrations
DELETE /mini/v1/registrations/:registrationId
POST   /mini/v1/check-ins/scan
POST   /mini/v1/client-events
```

路由常量由契约包导出，前后端测试和小程序请求都使用同一份路径常量，避免手写路径漂移。

### 5.2 响应格式

所有 mini API 使用统一响应：

```ts
export type MiniApiResult<T> = MiniApiSuccess<T> | MiniApiFailure

export interface MiniApiSuccess<T> {
  success: true
  data: T
  meta: MiniApiMeta
}

export interface MiniApiFailure {
  success: false
  error: MiniApiError
  meta: MiniApiMeta
}

export interface MiniApiMeta {
  requestId: string
  serverTime: string
  apiVersion: 'mini-v1'
}

export interface MiniApiError {
  code: MiniErrorCode
  message: string
  traceId?: string
}
```

小程序 `core/http.ts` 只处理 `MiniApiResult<T>`。

### 5.3 DTO 规则

后端内部模型、admin DTO 和 miniapp DTO 分开。

miniapp DTO 只返回前台展示需要的字段，不返回：

- openid。
- session_key。
- 完整手机号。
- 后台备注。
- 内部审核字段。
- 删除时间。
- 管理端权限字段。

后端通过 presenter/mapper 把领域对象转换为 mini DTO：

```text
Controller
  -> Domain Service
  -> Presenter
  -> MiniApiSuccess<T>
```

DTO 兼容规则：

- `v1` DTO 只能新增可选字段。
- 不能删除字段。
- 不能改变字段含义。
- 枚举新增值时，小程序必须有 fallback。
- 破坏性变更开 `/mini/v2`。

### 5.4 错误码

错误码由契约包统一导出：

```text
UNAUTHORIZED
PHONE_REQUIRED
FORBIDDEN
EVENT_SERIES_NOT_FOUND
SCHEDULE_NOT_FOUND
REGISTRATION_CLOSED
REGISTRATION_FULL
ALREADY_REGISTERED
REGISTRATION_NOT_FOUND
REGISTRATION_CANCEL_CLOSED
CHECK_IN_NOT_OPEN
CHECK_IN_QR_INVALID
CHECK_IN_EXPIRED
ALREADY_CHECKED_IN
REGISTRATION_REQUIRED
RATE_LIMITED
INTERNAL_ERROR
NETWORK_UNSTABLE
```

后端内部业务异常映射为 `MiniErrorCode`。业务服务不关心小程序文案，小程序 API 层负责转换成稳定错误码和用户可读 message。

## 6. 鉴权与身份

身份分三层：

```text
MiniOpenIdentity -> User -> Participant
```

- `MiniOpenIdentity`：微信 openid/unionid/session 绑定。
- `User`：高歌系统用户主体。
- `Participant`：赛事参与者或球员身份。

打开小程序不强制登录。浏览首页、赛程、球队、榜单、战报等公共内容不强制登录。

鉴权分三类：

```text
Public
  公共内容，不带 token

Optional Auth
  有 token 就返回用户态，没有 token 也返回公共数据

Required Auth
  报名、取消报名、签到、绑定手机号、我的页面
```

登录流程：

```text
ensureLogin()
  -> wx.login()
  -> POST /mini/v1/auth/wechat-login
  -> apps/api 用 code 换 openid
  -> 查找或创建 MiniOpenIdentity / User
  -> 返回 accessToken + profileSummary
```

手机号只在业务需要时触发，例如报名或需要联系时。拒绝手机号授权时，用户留在当前操作页，并可重试。

隐私协议在手机号、报名、签到、保存头像昵称等敏感能力前确认。后端记录隐私协议版本和同意时间。

## 7. 小程序目录结构

```text
apps/miniapp/
  package.json
  project.config.json
  project.private.config.json
  tsconfig.json
  miniprogram/
    app.ts
    app.json
    app.wxss
    sitemap.json

    core/
      runtime.ts
      http.ts
      auth.ts
      cache.ts
      error.ts
      performance.ts
      event-bus.ts
      router.ts
      lifecycle.ts

    config/
      env.ts
      brand.ts
      routes.ts
      version.ts

    domain/
      event.ts
      team.ts
      participant.ts
      schedule.ts
      registration.ts
      check-in.ts
      report.ts
      standing.ts

    services/
      auth/
        auth.service.ts
      event/
        event.service.ts
      match/
        schedule.service.ts
        registration.service.ts
        check-in.service.ts
      content/
        report.service.ts
      player/
        team.service.ts
        standing.service.ts
      telemetry/
        client-event.service.ts

    stores/
      app.store.ts
      auth.store.ts
      event.store.ts
      network.store.ts
      cache.store.ts

    components/
      base/
      shell/
      event/

    pages/
      home/
      schedule/
      teams/
      standings/
      profile/
      launch/

    packages/
      match/
      content/
      player/
      poster/

    styles/
      tokens.wxss
      typography.wxss
      spacing.wxss
      layout.wxss
      motion.wxss

    assets/
      icons/
      images/
```

目录演进规则：

- 当前骨架中 `services/` 已按 `auth`、`event`、`match`、`content`、`player`、`telemetry` 等业务域分组，后续新增服务默认进入对应业务域。
- `stores/` 当前允许使用少量平铺文件，保持启动阶段简单；当某个业务域出现多个 store 辅助文件时再按域拆分。
- `domain/` 不提前创建空目录；只有出现 DTO 展示转换、枚举 fallback、多页面复用纯业务计算时再引入。
- 原生微信小程序 TS 代码当前使用相对路径导入，不使用 `@/`；`tsconfig paths` 只保证类型解析，不会被微信开发者工具重写为运行时路径。
- 原生微信小程序运行代码不直接 value import workspace 契约包；运行时路由和错误码常量放在 `miniprogram/contracts/*`，共享契约包只用于类型导入。
- 长期实现约定维护在 `docs/conventions/miniapp-architecture.md`，本架构文档只保留高层方向。

## 8. Skyline 配置基线

`app.json`：

```json
{
  "renderer": "skyline",
  "componentFramework": "glass-easel",
  "lazyCodeLoading": "requiredComponents",
  "rendererOptions": {
    "skyline": {
      "defaultDisplayBlock": true,
      "defaultContentBox": true,
      "disableABTest": true
    }
  }
}
```

页面统一：

```json
{
  "navigationStyle": "custom",
  "disableScroll": true,
  "renderer": "skyline"
}
```

所有页面统一使用：

```text
page
  app-page
    app-nav
    scroll-view type="custom"
      page-content
```

不使用页面全局滚动。滚动区域统一交给 `app-page` 的 `scroll-view` 管理。

## 9. 分包与路由

主包：

```text
pages/
  home/
  schedule/
  teams/
  standings/
  profile/
  launch/
```

分包：

```text
packages/match/
  pages/match-detail/
  pages/registration/
  pages/check-in/

packages/content/
  pages/reports/
  pages/report-detail/

packages/player/
  pages/team-detail/
  pages/player-detail/

packages/poster/
  pages/share-poster/
```

主包只放首屏和高频入口。海报、签到、报名表单、详情大图、球员详情等低频能力进入分包。

页面路径由 `config/routes.ts` 管理。页面内不手写路径。

入口解析支持：

```text
type=home
type=match&id=<scheduleId>
type=registration&scheduleId=<scheduleId>
type=checkin&token=<checkInToken>
type=report&id=<reportId>
type=team&id=<teamId>
type=player&id=<playerId>
```

扫码签到二维码只放短时效 `checkInToken`，不放 openid、手机号等敏感数据。

## 10. 前端核心运行层

核心链路：

```text
Page
  -> service function
  -> core/http
  -> core/auth optional/required
  -> core/cache
  -> wx.request
  -> MiniApiResult<T>
  -> normalize data/error
  -> page setData 精准更新
  -> performance mark
```

`core/http.ts` 支持：

- baseURL。
- token 注入。
- `public` / `optional` / `required` 鉴权。
- timeout。
- requestId。
- GET 轻量重试。
- 统一错误归一化。
- API 耗时记录。

`core/auth.ts` 支持：

- `silentLogin()`。
- `ensureLogin()`。
- `ensurePhoneBound()`。
- `ensurePrivacyAccepted()`。
- `refreshProfile()`。
- `logout()`。

Store 保持轻量，不引入复杂状态库：

```text
app.store
auth.store
event.store
network.store
cache.store
```

页面私有数据留在页面 `data`。跨页面稳定状态进入 store。

## 11. 缓存与预取

缓存分三类：

```text
公共展示数据
  可缓存，可 stale-while-revalidate

用户状态数据
  短缓存或不缓存，操作后强制刷新

关键操作结果
  不缓存，以服务端返回为准
```

首页：

```text
key: home:current
ttl: 30-60 秒
storage: yes
strategy: stale-while-revalidate
```

首页流程：

```text
进入首页
  1. 读取 storage cache
  2. 有缓存立即渲染
  3. 同时请求 /mini/v1/event-series/current/home
  4. 如果返回数据变化，局部更新
  5. 如果请求失败，保留缓存并提示可重试
```

关键操作不缓存：

```text
POST /registrations
DELETE /registrations/:id
POST /check-ins/scan
POST /auth/bind-phone
```

成功后触发缓存失效和事件总线通知。

## 12. UI 基座与组件体系

组件分三层：

```text
基础组件 Base
  纯 UI，无业务含义

框架组件 Shell
  页面壳、导航、安全区、底部导航、登录门槛

业务展示组件 Event
  面向赛事展示，吃 DTO，不直接请求接口
```

基础组件：

```text
app-button
app-icon
app-card
app-tag
app-tabs
app-segmented
app-avatar
app-image
app-skeleton
app-empty
app-error
app-modal
app-toast
```

业务组件：

```text
event-header
next-match-card
match-card
team-card
player-row
report-card
standing-table
registration-status
check-in-status
scoreline
```

组件不直接调用 API，不修改全局 store。组件只展示 DTO 并通过事件向页面抛出用户动作。

球队主题色来自后端，只用于球队身份识别、标签、对阵卡片边线和榜单标识，不作为全局大面积背景或主按钮颜色。

## 13. Skyline 性能细节

列表策略：

```text
20 条以内：wx:for
20-100 条：分页 wx:for
100 条以上或高度稳定列表：list-builder
```

适用规则：

- 赛程列表：分页 `wx:for`，按轮次或月份吸顶。
- 战报列表：分页 `wx:for`，封面图懒加载。
- 球员列表：超过 100 人时使用 `list-builder`。
- 榜单：通常 `wx:for` 即可。

吸顶使用 Skyline 的 `sticky-section` / `sticky-header`，不手写兼容逻辑。

海报放 `packages/poster` 分包。优先使用 Skyline `snapshot`，canvas 作为兜底，服务端生成作为后续兜底。

严格控制 `setData`：

- 不 `setData` 大对象。
- 不在 scroll 高频事件里 `setData`。
- 不把后端原始响应整包塞进页面 data。
- 状态变化只更新对应字段或 item。

## 14. 报名、签到与一致性

报名接口：

```text
POST /mini/v1/registrations
```

请求携带 `requestId`。后端保证：

- 同一 `userId + scheduleId` 只能有一条有效报名。
- 同一 `requestId` 重复提交返回同一结果。
- 报名人数检查和创建报名在同一事务内。

取消报名：

```text
DELETE /mini/v1/registrations/:id
```

只允许取消自己的报名。重复取消建议返回成功态，提升体验稳定性。

签到接口：

```text
POST /mini/v1/check-ins/scan
```

请求只带 `token` 和 `requestId`。后端通过 token 解析 schedule、有效期和签名。前端不信任二维码里的业务身份。

签到幂等：

- 同一用户同一比赛只能有一条有效签到。
- 重复扫码返回已签到状态和签到时间。

前端不自行判断是否已报名、是否名额已满、是否可签到。关键状态由后端 DTO 返回。

## 15. 安全边界

- 小程序 token 与 admin token 隔离。
- mini token 不能访问 `/admin/*`。
- admin token 不能作为小程序用户身份。
- openid、session_key 不下发给小程序。
- 手机号脱敏展示。
- 小程序端第一版不开放用户上传图片。
- 报名、取消、签到、绑定手机号写入审计日志。
- 对登录、报名、签到等接口做基础限流。

## 16. 监控、日志与发布

小程序性能指标：

```text
app_launch_duration
home_first_data_ready
home_first_render_ready
api_duration
subpackage_load_duration
registration_action_duration
checkin_action_duration
poster_generate_duration
image_load_error_count
page_error_count
```

前端通过 `POST /mini/v1/client-events` 批量上报，性能事件采样，错误和报名/签到结果全量上报。

所有请求携带：

```text
X-Request-Id
X-Miniapp-Version
X-Miniapp-Platform
```

后端 `/mini/v1` 统一记录 requestId、route、method、userId、clientVersion、duration、status、errorCode。

发布前检查：

- typecheck。
- lint。
- miniprogram-ci quality。
- 主包和分包大小。
- Skyline 真机预览。
- 低端安卓滚动。
- iOS 安全区。
- 弱网重试。
- 登录失效。
- 报名连点。
- 签到重复扫码。
- 海报生成失败兜底。

## 17. 配置与可抽离能力

配置分四层：

```text
build config
  构建环境、appid、API baseURL

runtime config
  当前赛事 code、功能开关、客户端版本

brand config
  小程序名称、默认主题、默认图、兜底文案

server config
  赛事名称、球队、赛程、报名规则、签到规则、海报素材
```

越容易变化、越业务化的配置，越应该放后端。

本地 `config/brand.ts` 只提供兜底。正式展示优先使用后端返回的 `EventSeries`。

独立抽离时保留：

```text
miniprogram/
contracts/ 或 @gaoge/miniapp-api-contract
config/env.ts
config/brand.ts
```

替换：

```text
appid
apiBaseURL
defaultEventSeriesCode
品牌兜底图
```

只要后端继续提供 `/mini/v1` API，小程序是否在 monorepo 内不影响部署。

## 18. 开发规范

命名：

- 文件使用 `kebab-case`。
- 类型使用 `PascalCase`。
- 函数使用 `camelCase`。
- 页面和组件入口统一为 `index.ts/wxml/wxss/json`。

禁止事项：

- 页面里手写 API URL。
- 组件里调用 `wx.request`。
- 组件里调用业务 service。
- 页面 `onShow` 全量刷新所有数据。
- 大对象 `setData`。
- scroll 高频 `setData`。
- 硬编码球队名称做逻辑判断。
- 小程序代码 import `apps/api/src`。
- 小程序代码 import `apps/admin/src`。
- 主包放海报大资源。
- 引入 UI 组件库或跨端框架。

推荐事项：

- 所有 API 走 service。
- 所有接口路径走 `MiniRoutes`。
- 所有页面路径走 `Routes`。
- 所有错误走 `MiniErrorCode`。
- 所有图片使用 `app-image`。
- 所有页面使用 `app-page`。
- 所有关键操作携带 `requestId`。
- 报名和签到以后端结果为准。

## 19. 测试与验收

测试分层：

```text
类型检查
静态检查
契约检查
接口检查
真机体验检查
```

契约测试要求：

- 所有 `/mini/v1` 接口响应 `MiniApiResult<T>`。
- 所有错误 code 来自 `MiniErrorCode`。
- 所有 DTO 符合契约包。
- 所有路由路径符合 `MiniRoutes`。

真机必测：

- 首次冷启动。
- 有缓存启动。
- 无网络启动。
- 首页聚合接口失败。
- 登录态过期。
- 手机号拒绝授权。
- 报名成功。
- 重复报名。
- 报名已满。
- 取消报名。
- 扫码签到成功。
- 重复扫码。
- 二维码过期。
- 战报图片加载失败。
- 榜单切换。
- 海报生成失败兜底。

第一版技术验收标准：

- 首页首屏只依赖一个聚合接口。
- 主包尽量控制在 1MB 内。
- 页面返回不白屏。
- 赛程和战报滚动无明显卡顿。
- 报名按钮点击立即 loading。
- 签到扫码结果明确且可恢复。
- 图片加载无明显布局跳动。
- 小程序可在 monorepo 内开发，也可通过契约包独立抽离。

## 20. 实施顺序建议

```text
1. packages/miniapp-api-contract
2. apps/api mini/v1 基础响应、错误码和鉴权
3. apps/miniapp 工程骨架
4. core/http/auth/cache/router/performance
5. app-page/app-nav/app-bottom-nav
6. 首页聚合接口和首页基座
7. 赛程、球队、榜单主包页面
8. 报名、签到分包
9. 战报、球员、海报分包
10. 监控、质量门禁、真机验收
```

## 21. 仍需后续设计

本设计确认技术架构，不展开功能细节。后续还需要单独设计：

- 首页信息架构。
- 赛程、比赛详情、报名流程。
- 签到流程。
- 球队和球员档案。
- 战报和榜单。
- 分享海报模板。
- admin 端赛事管理功能。
- `apps/api` 赛事域数据库模型和迁移方案。
