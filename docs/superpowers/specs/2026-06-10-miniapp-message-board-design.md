# miniapp 留言板方案

> 适用范围：`apps/api`、`apps/admin`、`apps/miniapp`、`packages/shared/types`

## 1. 背景与目标

当前 `apps/miniapp/src/pages/message` 只是原消息页改名后的占位页面，仓库里也没有与“留言板”对应的正式内容资源。

本次要落地的是一个跨后台与小程序的“最新消息流”能力：

- 管理员可在后台发布留言板消息
- 小程序以“混合流 + 顶部筛选”方式展示已发布消息
- 视觉节奏参考 X 的高密度时间线，而不是公告列表或专题卡片
- 目录结构从第一版开始就保持清晰，避免把内容资源散落到 `miniapp` 聚合模块或某个球类业务域里

## 2. 范围与非目标

### 2.1 本次范围

- 将 `apps/miniapp/src/pages/message` 正式改名为 `message-board`
- 新增独立内容资源：留言板消息
- 新增后台 CRUD 页面，支持草稿与发布
- 新增小程序留言板公开读接口
- 新增共享类型，统一 admin、api、miniapp 协议
- 为小程序留言板完成首版现代化信息流样式

### 2.2 非目标

- 不做评论、点赞、转发、收藏
- 不做图片流、视频流、富文本编辑器
- 不做定时发布
- 不做消息详情页
- 不做足球/篮球两套独立留言板资源

## 3. 核心设计决策

### 3.1 留言板资源独立为 `content/message-board-post`

留言板本质是跨运动项目的内容流，不属于 `football/*`、`basketball/*`，也不应该先挂在 `miniapp` 模块里。

因此第一版就建立独立资源域：

```text
apps/api/src/modules/content/message-board-post/
apps/admin/src/views/content/message-board-post/
apps/admin/src/api/content/message-board-post/
packages/shared/types/src/message-board-post.ts
```

这样做的好处：

- `api` 的写模型和业务规则集中在一个资源模块
- `admin` 的页面与表单结构可以复用标准 CRUD 约定
- `miniapp` 只消费公开读接口，不承担资源定义职责
- 后续若新增“快讯”“公告”“专题”“横幅内容”，都可以继续放进 `content/*`

### 3.2 采用“后台资源模块 + 小程序读投影”双层结构

后台与数据写入统一落在 `content/message-board-post` 资源模块。

小程序公开读取保留一个轻量投影入口：

- 后台 CRUD 接口：`/content/message-board-posts`
- 小程序公开流接口：`/miniapp/message-board-posts`

其中：

- `content/message-board-post` 负责资源定义、校验、持久化、状态流转
- `miniapp` 侧只暴露面向小程序的只读查询入口，内部复用 `MessageBoardPostService`

这样既避免把内容资源混进 `miniapp` 模块，又能让小程序接口保持清晰、稳定、可裁剪。

### 3.3 消息形态采用“标准动态”

每条留言板消息包含：

- `title`
- `content`
- `tags`
- `sourceName`
- `sourceUrl`
- `status`
- `isPinned`
- `publishedAt`

其中：

- `tags` 用于转会、伤病、签约、比赛日等主题筛选
- `sourceName` / `sourceUrl` 对应罗马诺、Shams 这类来源信息
- 不引入封面图，保证录入成本和信息流密度

### 3.4 发布流程采用“草稿 + 发布”

消息状态只保留两种：

- `draft`
- `published`

约束：

- 草稿消息不在小程序暴露
- 首次发布时写入 `publishedAt`
- 已发布消息允许后台继续编辑，并保持 `published` 状态
- 第一版不支持定时发布，也不引入“撤回发布”以外的复杂状态

### 3.5 小程序采用“高密度信息流 + 顶部筛选”

视觉方向选用已确认的 A 方案：

- 顶部轻量标题区
- 横向筛选 chips
- 纵向连续卡片流
- 卡片正文优先，标题次优先
- 来源、标签、发布时间保持高信息密度

这会比公告式大卡片更接近 X 的阅读节奏，也更适合持续追加新消息。

## 4. 数据模型设计

### 4.1 Prisma 模型

新增 `MessageBoardPost`：

```text
id            Int        @id @default(autoincrement())
title         String
content       String
tags          String[]
sourceName    String
sourceUrl     String?
status        String     @default("draft")
isPinned      Boolean    @default(false)
publishedAt   DateTime?
createdAt     DateTime   @default(now())
updatedAt     DateTime   @updatedAt
```

补充索引：

- `@@index([status])`
- `@@index([isPinned])`
- `@@index([publishedAt])`

第一版不加 `authorId`、`deletedAt`、`coverImageUrl`、`sort`。

原因：

- 当前目标是小而稳的消息资源
- 已有后台登录与 RBAC 足以控制编辑权限
- 排序规则由 `isPinned + publishedAt desc + id desc` 决定即可

### 4.2 字段语义

- `tags`：自由文本数组，但后台提供推荐选项
- `status`：`draft` / `published`
- `publishedAt`：首次发布写入；草稿保持 `null`

## 5. 共享类型设计

新增 `packages/shared/types/src/message-board-post.ts`，并在 `index.ts` 导出。

建议包含：

- `MessageBoardPostStatus`
- `MessageBoardPost`
- `MessageBoardPostPayload`
- `MessageBoardPostListParams`
- `MessageBoardPostListResponse`
- `MiniappMessageBoardListParams`
- `MiniappMessageBoardListResponse`
- `MessageBoardTagOption`

类型边界：

- admin 与 api 使用同一份资源 DTO 形态
- miniapp 单独有一个只读列表响应类型，避免把后台字段原样下发给小程序

## 6. API 结构设计

### 6.1 目录结构

```text
apps/api/src/modules/content/message-board-post/
  message-board-post.module.ts
  message-board-post.controller.ts
  message-board-post.service.ts
  message-board-post.service.spec.ts
  dto/
    create-message-board-post.dto.ts
    update-message-board-post.dto.ts
    message-board-post-list.dto.ts
```

### 6.2 后台资源接口

资源路由：

```text
/content/message-board-posts
```

接口：

- `GET /content/message-board-posts`
  - 后台列表查询
  - 支持 `page`、`pageSize`、`keyword`、`status`、`tag`
- `GET /content/message-board-posts/:id`
  - 后台详情
- `POST /content/message-board-posts`
  - 新增草稿或直接发布
- `PATCH /content/message-board-posts/:id`
  - 更新消息
- `DELETE /content/message-board-posts/:id`
  - 删除消息
- `POST /content/message-board-posts/:id/publish`
  - 将草稿发布

权限命名：

- `content.messageBoardPost.view`
- `content.messageBoardPost.create`
- `content.messageBoardPost.update`
- `content.messageBoardPost.delete`
- `content.messageBoardPost.publish`

### 6.3 小程序公开读接口

考虑到当前 `MiniappController` 已在类级别挂载 `JwtAuthGuard`，公开读接口不直接加在现有控制器上，而是新增一个不挂 JWT 的公开控制器，例如：

```text
apps/api/src/modules/miniapp/miniapp-public.controller.ts
```

在该控制器中新增：

- `GET /miniapp/message-board-posts`

支持：

- `page`
- `pageSize`
- `tag`

返回约束：

- 只返回 `published` 数据
- 排序：`isPinned desc, publishedAt desc, id desc`
- 只返回小程序需要的字段

### 6.4 查询与排序规则

后台列表：

- 默认按 `updatedAt desc`
- 可查看草稿与已发布数据

小程序列表：

- 置顶优先
- 其次按发布时间倒序
- `tag` 为可选筛选

## 7. RBAC 与后台路由设计

### 7.1 RBAC 内置数据

需要同步修改：

- `apps/api/src/modules/system/rbac/builtins.ts`

新增：

- `moduleLabels.content = '内容'`
- `resourceLabels.messageBoardPost = '留言板消息'`
- 新权限码
- 新内置菜单定义

建议新增后台主目录：

```text
/content
  /content/message-board-post
```

对应菜单：

- 主目录：`内容管理`
- 子菜单：`留言板`

### 7.2 admin 路由结构

新增：

```text
apps/admin/src/router/modules/content/index.ts
apps/admin/src/views/content/message-board-post/
```

这样后续如果有 banner、公告、专题内容，不需要继续往 `system`、`wechat` 或球类目录里塞。

## 8. Admin 页面设计

### 8.1 目录结构

```text
apps/admin/src/views/content/message-board-post/
  index.vue
  auth.ts
  components/
    MessageBoardPostForm.vue
    MessageBoardPostFormDialog.vue
  model/
    defaults.ts
    mapper.ts
    types.ts
  schemas/
    form.ts
    search.ts
    table.ts
```

以及：

```text
apps/admin/src/api/content/message-board-post/index.ts
```

### 8.2 页面行为

页面骨架继续沿用：

- `useListPage`
- `EsSearch`
- `EsTable`
- `EsListToolbar`
- `useCrudDialog`

搜索项：

- 关键词
- 状态
- 标签

表格列：

- 标题
- 标签
- 来源
- 状态
- 置顶
- 发布时间
- 更新时间
- 操作

### 8.3 表单字段

表单字段：

- 标题
- 正文
- 标签
- 来源名称
- 来源链接
- 是否置顶
- 状态

交互约束：

- `destroy-on-close`
- 草稿与发布使用明确按钮文案
- 来源链接为空时允许提交
- 标签先用可输入多值或多选推荐项，不上复杂标签管理系统

### 8.4 后台按钮语义

建议保持两条明确路径：

- `保存草稿`
- `发布`

已发布消息编辑时：

- `保存` 默认保持已发布状态

这样能避免第一版就引入多状态下的复杂确认逻辑。

## 9. miniapp 页面设计

### 9.1 页面与文件改名

将：

```text
apps/miniapp/src/pages/message/
```

改为：

```text
apps/miniapp/src/pages/message-board/
```

并同步修改：

- `pages.json`
- tabbar pagePath
- 页面标题
- 页面内部 class / `defineOptions` 命名

如果对应图标资源需要语义一致，也同步从 `message` 改为 `message-board`。

### 9.2 miniapp 目录结构

建议新增：

```text
apps/miniapp/src/api/message-board-post/index.ts
apps/miniapp/src/pages/message-board/index.vue
```

如页面状态增长明显，再补：

```text
apps/miniapp/src/pages/message-board/model.ts
```

第一版先不拆过多私有文件，保持单页可读。

### 9.3 页面布局

页面结构：

1. 顶部标题区
   - 标题：`留言板`
   - 副标题：强调“最新转会、伤病、签约、比赛日更新”
2. 筛选区
   - 默认项：`全部`
   - 动态标签：来自服务端聚合出的常用标签或前端首版固定推荐项
3. 消息流
   - 置顶消息带轻强调边框或标识
   - 每条卡片展示来源、标签、标题、正文摘要、发布时间
4. 底部状态
   - 加载中
   - 空列表
   - 触底提示

### 9.4 视觉语言

沿用 `UnoCSS`，但样式目标不是普通白卡列表，而是：

- 更高信息密度
- 更轻的卡片阴影
- 更清晰的时间线节奏
- 更克制的主色强调

可采用：

- 浅灰蓝背景
- 白色卡片
- 深色主文案
- 蓝色来源链接点缀
- 黄色或琥珀色作为置顶轻提示

### 9.5 交互行为

- 页面进入自动拉取首屏
- 切换 `tag` 时重置为第一页并刷新
- 支持分页加载更多
- 筛选切换不跳新页
- 来源链接若存在，后续可复用现有 webview 页面打开；第一版可先只展示文字，不强制跳转

## 10. 测试与验证

### 10.1 API

至少补：

- `message-board-post.service.spec.ts`

覆盖：

- 草稿创建
- 发布写入 `publishedAt`
- 小程序列表只返回已发布数据
- `tag` 筛选
- `isPinned + publishedAt` 排序

### 10.2 Admin

最低验证：

- `pnpm lint`
- `pnpm typecheck`

如仓库现状不适合跑全量，则至少定向跑 admin 相关检查。

### 10.3 miniapp

最低验证：

- `pnpm --filter @gaoge/app-miniapp typecheck`

如有可用页面手工联调，再补小程序真机或开发者工具验证。

## 11. 验收标准

完成后应满足：

- 后台存在独立“留言板”管理页面
- 管理员可新增草稿、发布消息、编辑已发布消息、删除消息
- 小程序 tabbar 页面已从 `message` 语义迁移为 `message-board`
- 小程序留言板可按 `tag` 筛选
- 小程序只显示已发布消息
- 置顶消息优先展示
- 整体目录结构清晰，没有把留言板资源塞进 `football/*`、`basketball/*` 或 `miniapp` 聚合业务实现中
