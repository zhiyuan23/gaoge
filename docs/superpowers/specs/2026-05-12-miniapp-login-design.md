# 小程序静默登录与足球球员绑定方案

> 适用范围：`apps/miniapp`、`apps/api`

## 1. 背景与目标

当前仓库里，小程序端仍保留旧的 `thirdSessionKey` 登录思路，后端已经具备基于微信 `code` 的登录骨架和 JWT 体系，但前后端协议、状态管理、绑定关系并未收敛成一套完整闭环。

本方案目标是完成一套面向真实业务的小程序静默登录设计，满足以下要求：

- 小程序使用 `uni.login` 静默登录
- 所有小程序登录用户统一落在一张登录主表中
- 足球业务资料继续保留在 `FootballPlayer`
- 小程序用户可在后续流程中手动选择号码完成首次绑定
- 小程序端不支持解绑和改绑
- 后台管理员可以修改绑定关系
- 当前登录方案要为后续更多业务绑定能力预留扩展空间

## 2. 范围与非目标

### 2.1 本次范围

- 重做 `apps/miniapp` 的鉴权存储、请求鉴权和静默登录流程
- 调整 `apps/api` 小程序登录协议与会话返回结构
- 收敛小程序当前用户接口
- 新增足球球员可绑定号码列表接口
- 新增足球球员首次绑定接口
- 调整 `User` 与 `FootballPlayer` 的绑定关系
- 迁移旧的 `FootballPlayer.openid` 绑定语义

### 2.2 非目标

- 本期不实现小程序端解绑或改绑
- 本期不实现绑定动作入口页面和完整交互流程，只预留接口和状态能力
- 本期不处理篮球球员绑定
- 本期不改造后台账号密码登录主流程
- 本期不引入统一会员、支付或其他业务能力

## 3. 核心设计决策

### 3.1 登录主表与业务表分离

小程序登录用户统一存放在 `User` 表中，`User` 是小程序身份主表，不论是否已经绑定业务身份，都先存在于这张表。

`FootballPlayer` 保持足球业务资料主表身份，不再承担登录主表职责。

这样拆分后：

- 已登录未绑定用户有稳定的数据落点
- 足球业务绑定关系清晰
- 后续可以继续基于 `User` 绑定更多业务对象，而不需要改登录主干

### 3.2 绑定关系使用 `userId`

`FootballPlayer` 与 `User` 的关系统一使用 `userId` 建立。

- `FootballPlayer.userId -> User.id`
- `FootballPlayer.userId` 保持唯一

这表示：

- 一名足球球员最多绑定一个小程序登录用户
- 一个小程序登录用户最多绑定一个足球球员

现有 `FootballPlayer.openid` 不再作为主绑定字段使用。后续业务逻辑统一基于 `userId` 判断绑定关系。

### 3.3 登录与绑定分离

静默登录只做身份建立，不自动触发号码绑定。

登录成功后，系统只返回当前会话是否已绑定。号码列表加载和绑定提交由后续明确的前端动作触发，本期只预留后端能力和前端状态支持，不在登录成功后自动跳转或自动绑定。

### 3.4 小程序限制与后台权限

- 小程序端不提供解绑能力
- 小程序端不提供改绑能力
- 后台管理员可以修改 `FootballPlayer.userId`

## 4. 数据模型设计

### 4.1 `User` 表职责

`User` 作为统一登录主表，承载小程序登录身份和会话相关资料。

建议保留和使用以下字段：

- `id`
- `openid`：微信小程序身份唯一标识，唯一索引
- `unionid`：可空，后续跨应用身份整合预留
- `nickname`：可空，后续补资料时可写入
- `avatarUrl`：可空，后续补资料时可写入
- `phone`：可空，后续补手机号时可写入
- `role`：保留现有字段，后台继续使用；小程序默认 `user`
- `status`：`active` / `inactive`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

### 4.2 `FootballPlayer` 表职责

`FootballPlayer` 继续作为足球业务资料表，保留现有球员资料字段，如号码、昵称、头像、分队、状态等。

本方案要求显式使用：

- `id`
- `playerNumber`
- `nickname`
- `avatarUrl`
- `subTeam`
- `status`
- `userId`

建议继续保留历史 `openid` 字段用于迁移过渡，但不再作为运行时主字段引用。

### 4.3 绑定状态语义

系统运行时只存在两种小程序用户状态：

- 已登录未绑定：`User` 存在，且不存在 `FootballPlayer.userId = user.id`
- 已登录已绑定：`User` 存在，且唯一一条 `FootballPlayer.userId = user.id`

## 5. 后端接口设计

### 5.1 `POST /auth/miniapp/login`

用途：小程序静默登录。

请求：

```json
{
  "code": "wx-login-code"
}
```

处理流程：

1. 后端使用 `code` 调用微信 `jscode2session`
2. 通过 `openid` 查询 `User`
3. 若不存在则创建 `User`
4. 若存在则更新 `lastLoginAt`
5. 查询当前用户是否已绑定 `FootballPlayer`
6. 签发 `accessToken` 与 `refreshToken`
7. 返回登录态和绑定态

响应结构建议：

```json
{
  "accessToken": "token",
  "refreshToken": "token",
  "expiresIn": 7200,
  "user": {
    "id": 1,
    "openid": "openid",
    "nickname": null,
    "avatarUrl": null,
    "phone": null,
    "status": "active",
    "isBound": false
  },
  "binding": null
}
```

已绑定时，`binding` 返回当前球员摘要：

```json
{
  "playerId": 12,
  "playerNumber": 7,
  "nickname": "齐达内",
  "avatarUrl": null,
  "subTeam": "real",
  "status": "active"
}
```

约束：

- 登录接口只接收 `code`
- 不在登录接口内写入昵称、头像等资料

### 5.2 `GET /miniapp/me`

用途：获取当前小程序会话用户和绑定状态。

返回结构与登录接口中的 `user + binding` 保持一致，用于前端恢复和刷新当前登录态。

约束：

- 这是前端唯一可信的“当前用户”来源
- 前端不得通过本地缓存自行推断绑定状态

### 5.3 `GET /miniapp/football-player/bind-options`

用途：获取当前可绑定号码列表。

返回内容为“`FootballPlayer` 中已存在且尚未绑定用户”的球员列表，而不是 `0~100` 全量号码。

响应结构建议：

```json
{
  "list": [
    {
      "playerId": 15,
      "playerNumber": 8,
      "nickname": "劳塔罗",
      "subTeam": "inter"
    }
  ]
}
```

约束：

- 仅返回未绑定号码
- 不返回已被绑定的球员
- 不返回不存在的号码

### 5.4 `POST /miniapp/football-player/bind`

用途：提交号码完成首次绑定。

请求：

```json
{
  "playerNumber": 7
}
```

处理流程：

1. 校验当前登录用户是否已绑定
2. 查询目标 `playerNumber` 是否存在
3. 校验目标球员是否未绑定
4. 以事务方式写入 `FootballPlayer.userId = currentUser.id`
5. 返回最新 `me` 结果

约束：

- 只允许首次绑定
- 不支持小程序端改绑
- 必须保证并发场景下不会抢号成功

## 6. 认证与 Token 设计

### 6.1 鉴权协议

小程序端请求鉴权统一使用：

```text
Authorization: Bearer <accessToken>
```

不再沿用旧的 `thirdSessionKey` 请求头。

### 6.2 Token 策略

- `accessToken`：短期有效，用于接口访问
- `refreshToken`：用于刷新 `accessToken`
- 继续复用当前后端 refresh token 机制

JWT 主体指向统一登录主表 `User`。

### 6.3 401 处理

前端收到 `401` 时：

1. 优先尝试调用刷新 token 接口
2. 刷新成功后重放原请求
3. 刷新失败则清空本地登录态
4. 重新执行 `uni.login` 静默登录

## 7. 错误处理规则

后端错误应返回明确语义，不使用笼统的“登录失败”覆盖全部场景。

建议约定：

- 微信 `code` 无效或过期：`401` 或 `400`
- 用户状态为 `inactive`：`403`
- 当前用户已绑定过号码：`409`
- 号码不存在：`404`
- 号码已被其他用户绑定：`409`

前端展示策略：

- 网络失败：提示通用网络错误
- 登录失败：重新拉起静默登录
- 绑定冲突：提示号码已被绑定
- 用户不可用：提示联系管理员

## 8. 小程序端实现设计

### 8.1 状态管理

小程序端重建 `auth store`，职责只保留：

- 持久化 `accessToken`
- 持久化 `refreshToken`
- 缓存 `me` 结果
- 暴露 `silentLogin`
- 暴露 `fetchMe`
- 暴露 `refreshToken`
- 暴露 `logout`

### 8.2 应用启动流程

应用启动或进入受保护流程时：

1. 检查本地是否已有 token
2. 若有 token，调用 `GET /miniapp/me`
3. 若 token 失效，尝试 refresh
4. 若 refresh 失败，重新走 `uni.login`
5. 静默登录成功后拉取最新 `me`

### 8.3 未绑定状态

若当前用户未绑定：

- 允许保留登录态
- 前端只展示“未绑定”状态
- 不自动进入绑定流程
- 不自动请求号码列表

后续新增绑定入口时，再调用：

- `GET /miniapp/football-player/bind-options`
- `POST /miniapp/football-player/bind`

### 8.4 已绑定状态

若当前用户已绑定：

- 前端直接显示当前绑定的球员信息
- 页面以 `me.binding` 为准，不再自行拼接用户与球员数据

## 9. 数据迁移策略

### 9.1 目标

将旧的 `FootballPlayer.openid` 绑定语义迁移为新的 `FootballPlayer.userId` 关系。

### 9.2 迁移原则

- 若 `FootballPlayer.openid` 有值，则按 `openid` 查找 `User`
- 找到对应 `User` 后，写入 `FootballPlayer.userId`
- 迁移完成后，运行时逻辑不再依赖 `FootballPlayer.openid`

### 9.3 迁移后要求

- 新登录流程只使用 `User.openid`
- 新绑定流程只写 `FootballPlayer.userId`
- 历史 `openid` 字段只保留兼容意义，不再参与运行时绑定判断

## 10. 测试与验收

### 10.1 后端测试

至少覆盖以下场景：

- 首次静默登录创建 `User`
- 重复静默登录复用已有 `User`
- 已绑定用户登录返回 `binding`
- 未绑定用户登录返回 `binding = null`
- `GET /miniapp/me` 正确返回当前绑定状态
- `GET /miniapp/football-player/bind-options` 只返回未绑定球员
- 首次绑定成功
- 已绑定用户重复绑定失败
- 目标号码不存在失败
- 目标号码已被占用失败

### 10.2 小程序侧验证

至少验证以下场景：

- 冷启动静默登录成功
- token 过期后自动 refresh
- refresh 失败后重新静默登录
- 未绑定状态展示正确
- 已绑定状态展示正确

## 11. 实施边界

本方案只定义登录与首次绑定闭环，不扩展到以下能力：

- 绑定入口页面细节
- 手机号补录
- 头像昵称补录
- 篮球球员绑定
- 小程序端解绑改绑
- 统一业务账户中心

## 12. 推荐实施顺序

1. 调整 Prisma 数据结构和迁移方案
2. 收敛后端小程序登录返回结构
3. 新增 `me`、绑定选项、首次绑定接口
4. 重做小程序端 auth store 与请求鉴权
5. 验证静默登录和已绑定/未绑定状态
6. 清理旧 `thirdSessionKey` 方案残留代码
