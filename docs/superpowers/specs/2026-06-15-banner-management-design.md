# Banner 管理功能设计

日期：2026-06-15

## 1. 目标

为仓库补齐一套可实际使用的 banner 管理能力，覆盖以下三端：

- `apps/api` 提供后台管理、公开列表与图片上传接口
- `apps/admin` 提供标准 CRUD 管理页，支持上传图片或填写图片链接
- `apps/miniapp` 在首页展示 banner，并按配置执行可选跳转

本次目标是让 banner 从“数据库和基础接口已存在，但前后端未接通”的状态，收敛为一套可维护、可扩展、可验证的完整功能。

## 2. 背景

当前仓库已经存在以下基础：

- `apps/api/prisma/schema.prisma` 中已有 `Banner` 表
- `apps/api/src/modules/banner/*` 中已有一组基础接口
- `packages/shared/types/src/banner.ts` 中已有共享类型
- `apps/admin` 已形成标准 CRUD 页面开发模式
- `apps/miniapp` 已有通用 `webview` 页面，可承接 H5 跳转

当前存在的问题：

- 现有 `Banner` 只有 `linkUrl`，无法清晰表达“不跳转 / H5 跳转 / 小程序内部页跳转”
- API 路由与模块组织仍偏旧风格，没有对齐当前 `content/<resource>` 约定
- `admin` 没有 banner 管理页
- `miniapp` 首页仍为占位页，没有接 banner 展示
- 仓库里没有面向内容 banner 的稳定图片上传入口

因此这次需要在不引入过度抽象的前提下，对 banner 做一次小幅重构并补齐前台接入。

## 3. 范围与非目标

### 3.1 本次范围

- 调整 `Banner` 数据模型与共享类型
- 将 banner API 收敛到 `content/banners` 语义下
- 增加 banner 图片上传接口
- 新增 `apps/admin` Banner 管理页
- 将 `apps/miniapp` 首页改为展示 banner
- 支持三种点击行为：
  - 不跳转
  - 打开 H5 `webview`
  - 跳转小程序内部页面

### 3.2 非目标

- 不抽象成完整“内容投放位平台”
- 不引入开始时间、结束时间、多端投放位置等高级能力
- 不接入云存储或对象存储，先沿用本地上传目录
- 不把首页一次扩展成完整内容流产品页
- 不改 `packages/*` 的更大共享边界，只补本次所需类型

## 4. 设计结论

### 4.1 数据模型采用“小幅重构”

保留 `Banner` 资源名，不另起新的内容实体。

但将当前单一 `linkUrl` 扩展为显式跳转语义：

- `jumpType: none | webview | miniapp`
- `jumpUrl: string | null`

这样可以明确区分：

- 纯展示 banner
- H5 链接 banner
- 小程序站内跳转 banner

而不是继续把所有行为混在 `linkUrl` 一个字段里。

### 4.2 后端接口采用“内容域收敛”

banner 归入 `content` 域，使用复数路由：

- `GET /content/banners`
- `GET /content/banners/admin`
- `POST /content/banners`
- `PATCH /content/banners/:id`
- `DELETE /content/banners/:id`
- `POST /content/banners/upload-image`

不继续保留旧的 `@Controller('banner')` 风格作为长期主路径。

### 4.3 Admin 采用标准 CRUD 页面

后台页面沿用仓库既有模式：

- `EsSearch`
- `EsTable`
- `EsListToolbar`
- `<Banner>Form.vue`
- `<Banner>FormDialog.vue`

不为 banner 单独发明特殊管理框架。

### 4.4 Miniapp 首页保持轻量接入

首页只增加 banner 展示区，不一次扩展成完整内容首页。

banner 区职责仅为：

- 获取并展示轮播图片
- 根据 `jumpType` 处理点击动作
- 在接口失败或无数据时自动降级隐藏

## 5. 数据结构

### 5.1 Banner 字段

`Banner` 调整后的核心字段如下：

- `id`
- `title`
- `imageUrl`
- `jumpType`
- `jumpUrl`
- `sort`
- `status`
- `createdAt`
- `updatedAt`

### 5.2 字段语义

- `title`
  - 后台识别与管理使用
  - 暂不直接渲染到小程序 banner 视觉层
- `imageUrl`
  - banner 图片完整地址
  - 允许来自上传接口，也允许管理员手填图片 URL
- `jumpType`
  - `none`：仅展示，不跳转
  - `webview`：点击后进入小程序 `webview`
  - `miniapp`：点击后跳转到小程序内部页面
- `jumpUrl`
  - 当 `jumpType = none` 时为空
  - 当 `jumpType = webview` 时为 H5 链接
  - 当 `jumpType = miniapp` 时为小程序页面路径
- `sort`
  - 数值越大越靠前
- `status`
  - `active | inactive`

### 5.3 兼容与迁移

本次会新增 `jumpType`，并把原有 `linkUrl` 迁移为 `jumpUrl`。

迁移策略：

- 新字段 `jumpType` 默认使用 `none`
- 将历史 `linkUrl` 迁移到 `jumpUrl`
- 对已有 `linkUrl` 非空记录：
  - 若是 `http://` 或 `https://` 开头，则 `jumpType = webview`
  - 其他值先按 `miniapp` 处理
- 迁移完成后移除 `linkUrl`

这样可以尽量保留历史数据，同时将模型语义收敛到新结构。

## 6. 后端接口与校验

### 6.1 DTO 校验规则

创建与更新时统一校验：

- `title` 必填
- `imageUrl` 必填
- `sort` 为非负整数
- `status` 只能是 `active | inactive`
- `jumpType` 只能是 `none | webview | miniapp`
- `jumpType = none` 时，`jumpUrl` 允许为空
- `jumpType = webview` 时，`jumpUrl` 必须为 `http://` 或 `https://` 开头
- `jumpType = miniapp` 时，`jumpUrl` 必须为 `/pages/` 开头的小程序页面路径

后端应作为最终校验边界，不能只依赖前端表单约束。

### 6.2 公开列表接口

`GET /content/banners` 用于小程序首页读取。

返回规则：

- 只返回 `status = active`
- 按 `sort desc, id desc` 排序
- 返回完整 banner 展示与跳转字段

### 6.3 管理列表接口

`GET /content/banners/admin` 用于后台管理页读取。

本次支持基础查询条件：

- `keyword`
- `status`
- `jumpType`

查询实现保持轻量即可，由 service 内部拼装基础 `where` 条件，不为本次需求提前抽象复杂列表框架。

### 6.4 图片上传接口

`POST /content/banners/upload-image`

职责：

- 接收单张图片文件
- 校验大小与文件类型
- 写入本地上传目录
- 返回完整可访问 `imageUrl`

约束：

- 只支持图片 MIME 类型
- 文件大小上限与现有头像上传保持同量级即可
- 存储目录独立于小程序头像，例如 `uploads/content-banner`

## 7. Admin 页面设计

### 7.1 页面位置

页面新增到：

- `apps/admin/src/views/content/banner/`

并挂到内容管理菜单下。

### 7.2 页面结构

沿用现有标准 CRUD 结构：

```text
views/content/banner/
  index.vue
  auth.ts
  components/
    BannerForm.vue
    BannerFormDialog.vue
  model/
    types.ts
    mapper.ts
    defaults.ts
  schemas/
    search.ts
    table.ts
    form.ts
```

### 7.3 列表页能力

列表字段：

- 图片预览
- 标题
- 跳转类型
- 跳转地址
- 排序
- 状态
- 更新时间

查询项：

- 标题关键字
- 状态
- 跳转类型

操作：

- 新增
- 编辑
- 删除

本次不做：

- 批量操作
- 拖拽排序
- 上下线快捷切换

### 7.4 表单交互

表单字段：

- `title`
- `imageUrl`
- `sort`
- `status`
- `jumpType`
- `jumpUrl`

图片录入方式同时支持两种：

- 上传图片后回填 `imageUrl`
- 手动输入图片 URL

最终只维护一个结果字段 `imageUrl`，不额外存“上传来源”。

### 7.5 跳转字段联动

- `jumpType = none`
  - 隐藏 `jumpUrl`
- `jumpType = webview`
  - 显示“网页链接”输入框
  - 提示必须填写 H5 地址
- `jumpType = miniapp`
  - 显示“小程序页面路径”输入框
  - 提示示例为 `/pages/...`

### 7.6 图片交互要求

- 上传成功后自动写回 `imageUrl`
- 输入框变化时实时更新图片预览
- 若管理员直接手填外部图片地址，也允许保存
- 表单内始终提供图片预览，便于确认最终展示结果

## 8. Miniapp 首页展示

### 8.1 展示方式

首页顶部新增 banner 区：

- 页面加载时请求 `GET /content/banners`
- 有数据时显示轮播
- 无数据或请求失败时不显示 banner 区

图片使用圆角卡片式轮播即可，不额外叠加标题文案层。

### 8.2 点击行为

- `jumpType = none`
  - 点击无动作
- `jumpType = webview`
  - 跳转到现有 `/pages/common/webview/index`
  - 将 `jumpUrl` 作为参数传入
- `jumpType = miniapp`
  - 默认使用 `uni.navigateTo`
  - 若目标是 tabBar 页面，则改用 `uni.switchTab`

### 8.3 tabBar 页面处理

由于小程序 tabBar 页面不能使用 `navigateTo`，前端需要维护一个已知 tabBar 路径集合。

点击内部页时：

- 命中 tabBar 路径则 `switchTab`
- 否则 `navigateTo`

该逻辑只放在 miniapp 首页 banner 点击处理层，不下沉为过度通用导航框架。

### 8.4 异常兜底

- banner 接口失败时，首页正常渲染其余内容
- `jumpUrl` 缺失或非法时，点击后静默拦截并给出轻提示
- 图片加载失败时不阻断轮播容器渲染

## 9. 共享类型调整

`packages/shared/types/src/banner.ts` 需要同步新增：

- `BannerJumpType`
- `jumpType`
- `jumpUrl`

并移除旧的 `linkUrl`。

后台与小程序都通过共享类型读取 banner 契约，避免三端各自漂移。

## 10. 验证策略

### 10.1 API

- DTO 条件校验
- 公开列表只返回 `active`
- 公开列表排序为 `sort desc, id desc`
- 上传接口文件类型与大小校验

### 10.2 Admin

- 列表查询与展示正常
- 新增 banner 成功
- 编辑 banner 成功
- 删除 banner 成功
- `jumpType` 切换时表单项联动正确
- 上传成功后 `imageUrl` 能自动回填

### 10.3 Miniapp

- 首页能展示 banner
- `none / webview / miniapp` 三种点击行为正确
- tabBar 页和普通页跳转路径正确
- 接口失败时首页可正常打开

## 11. 风险与取舍

### 11.1 为什么不直接复用旧 `linkUrl`

因为本次需求已经明确包含三种跳转语义，继续使用单一链接字段会导致：

- 后端难以校验
- 后台难以引导用户正确配置
- 小程序端点击逻辑需要做不稳定猜测

因此这次应当显式拆分跳转类型。

### 11.2 为什么不直接做完整内容投放系统

因为当前需求仅针对首页 banner，若顺手引入投放位置、时间窗、多端配置，会明显放大实现范围，并增加 admin 与 API 复杂度。

本次更合适的边界是：

- 做清晰的 banner 资源
- 为未来扩展留出字段语义
- 不提前构建更大的内容平台

## 12. 实施顺序建议

建议按以下顺序落地：

1. Prisma 与共享类型调整
2. API 模块重构到 `content/banners`
3. 图片上传接口
4. Admin Banner 管理页
5. Miniapp 首页 banner 展示与跳转
6. 校验与回归测试
