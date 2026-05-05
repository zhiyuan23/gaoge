# Football API 路由与鉴权规划

日期：2026-05-05

## 目标

对当前 `apps/api` 的接口路径和登录入口进行正式规划与收敛，解决以下问题：

- 生产环境地址 `https://api.gaoge.cc/api/...` 中出现双重 `api` 语义，去掉后端全局 `/api` 前缀
- 当前 `players`、`teams`、`match-rounds` 属于足球业务，统一迁入 `/football/*`
- 球队资金接口也并入足球业务域，统一迁入 `/football/fund*`
- 后续需要同时服务 `admin`、`web`、`miniapp`，明确“同资源路径，不同权限模型”的原则
- 保留后台账号密码登录，同时新增并规范化小程序登录入口

本次设计只处理接口路径、模块归属、鉴权边界和迁移方式，不扩展新的业务功能。

## 背景

当前后端现状：

- Nest 全局前缀为 `/api`
- 已有资源接口：
  - `/players`
  - `/teams`
  - `/match-rounds`
  - `/team/fund*`
- 已有认证接口：
  - `/auth/admin-login`
  - `/auth/wechat-login`
  - `/auth/phone-login`
  - `/auth/refresh-token`
  - `/auth/logout`
- 服务端已经具备微信 `code -> openid/session_key` 的登录基础能力，不需要从零设计微信登录链路

当前问题：

- `/api` 同时出现在域名和路径中，地址冗余
- 足球领域资源散落在顶层和旧 `team` 语义下，不利于后续扩展篮球等项目
- 小程序和 admin 会消费同一批足球资源，但当前路径层级没有明确体现运动域边界
- 登录接口命名偏实现导向，例如 `wechat-login`，不利于长期演进

## 范围

包含：

- 重新规划 API 对外路径
- 重新规划足球领域模块归属
- 重新规划 admin 与 miniapp 的登录路径
- 明确匿名访问、miniapp 登录态、admin 登录态三类访问者的权限边界
- 明确迁移顺序、风险点和验证要求

不包含：

- 新增篮球业务实体或接口实现
- 拆分 `User` 为两张独立用户表
- 新增小程序用户态业务，例如报名、个人资料、历史记录
- 重构或扩展手机号登录流程
- 抽象通用多运动插件式架构
- 保留旧路径兼容层

## 设计原则

### 同一资源只保留一套路径

`players`、`teams`、`match-rounds`、`fund` 是同一足球领域资源，不因为调用方是 `admin`、`web` 或 `miniapp` 就复制成多套路由。

客户端差异应通过以下方式表达：

- 登录入口区分身份场景
- JWT 身份字段区分角色和来源
- 接口 Guard 区分匿名可读、登录可读、admin 可写

而不是通过 `/admin/*`、`/miniapp/*`、`/public/*` 拆出多套资源 URL。

### 先按足球领域完成正式模块收敛

本次不是仅修改 controller 前缀，而是正式完成足球领域的模块规划。

原因：

- 当前项目仍在架构期，适合直接做合理拆分
- 未来已明确存在篮球等平行项目扩展可能
- 趁业务规模仍可控时完成目录边界重组，成本低于后续再迁移

### 客户端差异放在权限层，不放在资源层

本次明确采用：

- 同一资源路径
- 不同身份登录入口
- 不同 Guard/Role 策略

这样资源语义稳定，后续可同时支撑：

- admin 管理端 CRUD
- web 公开只读页面
- miniapp 公开只读页面
- miniapp 后续用户态扩展

### 不保留旧路径兼容层

本次切换为一次性迁移：

- 旧路径直接下线
- 不做 alias controller
- 不做 redirect
- admin 与 API 同一轮切换

原因：

- 已明确选择直接切换
- 当前仍处于架构收敛期，保留兼容只会增加重复维护成本

## 路由结构

### 地址基线

生产环境基线地址调整为：

```text
https://api.gaoge.cc/
```

不再保留全局 `/api` 前缀。

### 足球领域接口

足球资源统一放入 `/football/*`。

#### 球员

- `GET /football/players`
- `GET /football/players/:id`
- `POST /football/players`
- `PATCH /football/players/:id`
- `DELETE /football/players/:id`

#### 球队

- `GET /football/teams`
- `GET /football/teams/:id`
- `POST /football/teams`
- `PATCH /football/teams/:id`
- `DELETE /football/teams/:id`

#### 比赛

- `GET /football/match-rounds`
- `GET /football/match-rounds/:id`
- `POST /football/match-rounds`
- `PATCH /football/match-rounds/:id`
- `DELETE /football/match-rounds/:id`

#### 球队资金

- `GET /football/fund`
- `GET /football/fund/summary`
- `GET /football/fund/:id`
- `POST /football/fund`
- `PATCH /football/fund/:id`
- `DELETE /football/fund/:id`

### 认证接口

认证接口继续放在 `/auth` 下，但按身份场景命名：

- `POST /auth/admin/login`
- `POST /auth/miniapp/login`
- `POST /auth/refresh-token`
- `POST /auth/logout`

当前已有的 `/auth/profile`、`/auth/permission` 可以继续保留原语义，作为后台身份相关接口，不纳入本次路径重命名范围。

当前已有的 `/auth/phone-login` 不属于本次接口规划范围：

- 本次不要求同步重命名
- 不作为新客户端的推荐登录入口
- 若现网仍有依赖，可暂时保留，但视为后续单独收敛对象

### 本次不继续沿用的旧路径

以下旧路径本次不保留兼容：

- `/players`
- `/teams`
- `/match-rounds`
- `/team/fund`
- `/team/fund/summary`
- `/auth/admin-login`
- `/auth/wechat-login`

## 权限与鉴权模型

本次明确 3 类访问者：

### 1. 匿名访问者

- 不带 token
- 可访问公开读取接口

### 2. 小程序用户

- 通过 `POST /auth/miniapp/login`
- 服务端基于 `wx.login` 获取的 `code` 换取 `openid`
- 登录成功后拿到 miniapp 用户 token

当前阶段，小程序用户身份主要用于后续扩展预留，不作为查看足球公开信息的前置条件。

### 3. Admin 用户

- 通过 `POST /auth/admin/login`
- 使用账号密码登录
- 获取 admin token
- 可访问后台管理写接口和后台身份接口

### 公开读取范围

以下接口允许未登录访问，同时也可被 `web`、`miniapp`、`admin` 调用：

- `GET /football/players`
- `GET /football/players/:id`
- `GET /football/teams`
- `GET /football/teams/:id`
- `GET /football/match-rounds`
- `GET /football/match-rounds/:id`
- `GET /football/fund`
- `GET /football/fund/:id`
- `GET /football/fund/summary`

### Admin 写权限范围

以下接口仅允许 admin 身份调用：

- `POST /football/players`
- `PATCH /football/players/:id`
- `DELETE /football/players/:id`
- `POST /football/teams`
- `PATCH /football/teams/:id`
- `DELETE /football/teams/:id`
- `POST /football/match-rounds`
- `PATCH /football/match-rounds/:id`
- `DELETE /football/match-rounds/:id`
- `POST /football/fund`
- `PATCH /football/fund/:id`
- `DELETE /football/fund/:id`

### Token 语义要求

JWT 需要明确区分身份，而不是只表示“是否登录”。

推荐至少具备以下语义字段：

- `role`
  - `admin`
  - `user`
- 可选补充 `clientType`
  - `admin`
  - `miniapp`

要求：

- admin token 不能因为“已登录”而自动拥有 miniapp 语义
- miniapp token 不能因为“已登录”而访问后台写接口
- 公开读取接口不依赖 token 存在

## 登录接口设计

### Admin 登录

接口：

- `POST /auth/admin/login`

请求参数：

- `account`
- `password`

约束：

- 用户必须存在
- 必须具备 `admin` 角色
- 账号必须有效且未删除
- 校验密码哈希后发放 admin token

### 小程序登录

接口：

- `POST /auth/miniapp/login`

第一版请求参数建议只保留：

- `code`

服务端流程：

1. 接收小程序 `wx.login` 返回的 `code`
2. 调用微信 `jscode2session`
3. 获取 `openid`，若有则同时获取 `unionid`
4. 按 `openid` 查找用户
5. 若不存在则创建普通用户
6. 若已存在则更新最近登录时间
7. 返回 miniapp token

说明：

- 当前 `nickname`、`avatarUrl` 不作为第一版登录成功的必要条件
- 它们可以保留为可选补充资料，或在后续单独设计资料同步流程

### 用户模型约束

当前阶段继续使用单一 `User` 表，不拆成两张表。

表意规则：

- `account/passwordHash` 用于 admin 登录
- `openid` 用于 miniapp 登录
- `role` 明确身份
- `status` 控制是否可用

字段约束方向：

- `openid` 允许为空
- `account` 允许为空，但 admin 用户必须有 `account`
- `passwordHash` 允许为空，但 admin 用户必须有密码哈希

本次不引入：

- `AdminUser` / `MiniappUser` 双表模型
- 多套独立 token 系统

## 服务端模块规划

### 目标目录

推荐将足球领域正式收敛为：

```text
apps/api/src/modules/football/
  football.module.ts
  players/
  teams/
  match-rounds/
  fund/
```

### 模块职责

- `football.module.ts`
  - 聚合足球领域子模块
  - 不承载具体业务逻辑

- `players`
  - 只负责足球球员

- `teams`
  - 只负责足球球队

- `match-rounds`
  - 只负责足球比赛

- `fund`
  - 只负责足球球队资金

### 控制器路由归属

推荐控制器前缀直接对齐目录职责：

- `@Controller('football/players')`
- `@Controller('football/teams')`
- `@Controller('football/match-rounds')`
- `@Controller('football/fund')`

认证仍保持独立：

- `src/modules/auth/*`
- `@Controller('auth')`

### 应用模块接入

`AppModule` 不再并列引入旧的：

- `PlayersModule`
- `TeamsModule`
- `MatchRoundsModule`
- 旧 `TeamModule`

而改为引入新的：

- `FootballModule`

说明：

- `banner`、`health`、`wechat` 不纳入本次足球领域收编范围
- 本次只做足球相关模块重组，不顺手扩大到无关模块

## 前端与调用方影响面

### Admin

`apps/admin` 需要与后端同一轮切换：

- 球员接口切到 `/football/players`
- 球队接口切到 `/football/teams`
- 比赛接口切到 `/football/match-rounds`
- 资金接口切到 `/football/fund`
- 登录接口切到 `/auth/admin/login`

`/auth/profile`、`/auth/permission` 继续保留后台语义。

### Web

`apps/web` 后续若接真实数据，直接消费公开足球查询接口：

- `/football/players`
- `/football/teams`
- `/football/match-rounds`
- `/football/fund`

由于这些查询接口允许匿名访问，`web` 不需要以登录作为读取前置条件。

### Miniapp

`apps/miniapp` 的查看型页面直接消费公开足球查询接口，不要求先登录。

同时保留：

- `POST /auth/miniapp/login`

作为后续用户态能力的认证入口。

### 调用层组织原则

各应用保留各自的 API 包装层：

- `admin` 处理后台 token、权限失败跳转
- `web` 处理公开只读请求
- `miniapp` 处理微信环境登录与请求封装

本次不强行抽统一总 SDK，只要求契约和路径收敛一致。

## 迁移顺序

推荐按以下顺序落地：

1. 后端完成足球领域目录重组
2. 后端去掉全局 `/api` 前缀
3. 后端切换认证子路径为 `/auth/admin/login`、`/auth/miniapp/login`
4. 后端确认公开接口与 admin 写接口的 Guard 边界
5. `apps/admin` 同步切换到新路径
6. 预留 `miniapp` 接入新公开接口与新登录接口

## 风险点

### 1. 旧 `team` 模块语义残留

当前 `team` 实际承载的是资金，而不是球队。迁移到 `football/fund` 后，旧命名如果残留在模块名、service、注释或导出入口中，后续容易继续误解。

### 2. Guard 配置错误

公开读取与 admin 写入共享同一资源域，必须逐个确认：

- 所有公开 `GET` 确实可匿名访问
- 所有写接口确实只允许 admin

### 3. 联动切换窗口

由于不保留旧路径兼容层，后端和 admin 必须同一轮发布，否则会出现批量 404 或登录失败。

### 4. `/api` 残留配置

需要同步检查：

- Nest `setGlobalPrefix`
- Swagger `addServer`
- 前端 baseURL
- 文档示例
- 部署配置和反向代理规则

## 验证要求

### 后端接口验证

需要至少验证：

- 匿名访问以下接口成功：
  - `GET /football/players`
  - `GET /football/teams`
  - `GET /football/match-rounds`
  - `GET /football/fund`
  - `GET /football/fund/summary`
- 匿名调用写接口失败
- admin 登录后写接口成功
- `/auth/miniapp/login` 能正确完成 `code -> openid`

### Admin 联调验证

需要验证：

- admin 登录成功
- 球员 CRUD 正常
- 球队 CRUD 正常
- 比赛 CRUD 正常
- 资金 CRUD 正常
- `profile/permission` 不受本次重构影响

### 文档与配置验证

需要验证：

- Swagger 文档展示的新路径正确
- 对外文档不再出现 `/api/...`
- 前端环境配置指向新地址

## 决策结论

本次接口规划的最终结论如下：

- 去掉后端全局 `/api` 前缀
- 足球资源统一迁移到 `/football/*`
- 球队资金也并入 `/football/fund*`
- 采用同一资源路径，不按客户端拆多套路由
- 公开查询接口允许匿名访问
- 写接口仅允许 admin
- 登录接口按身份场景收敛为 `/auth/admin/login` 和 `/auth/miniapp/login`
- 小程序登录第一版以 `code` 为唯一必填参数
- 用户表继续单表承载，不拆双表
- 本次直接切换，不保留旧路径兼容层
