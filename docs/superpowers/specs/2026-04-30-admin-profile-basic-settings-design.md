# Admin 个人设置-基本设置设计

## 背景

当前后台右上角用户下拉菜单中的“个人设置”入口，会打开一个本地弹窗组件 [apps/admin/src/slots/ToolbarEnd/profile.vue](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/slots/ToolbarEnd/profile.vue)。弹窗内已存在两个 tab：

- 基本设置
- 安全设置

其中“安全设置”已接入 [apps/admin/src/components/business/AccountForm/EditPasswordForm.vue](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/components/business/AccountForm/EditPasswordForm.vue)，“基本设置”仍是占位文案。

本次目标是在不引入新路由、不扩展到完整个人中心页面的前提下，补齐“基本设置”首版能力。

## 目标

- 在现有“个人设置”弹窗内实现“基本设置”表单
- 支持当前登录用户编辑昵称和头像 URL
- 保持登录账号、角色为只读展示
- 保存成功后同步刷新 admin 端用户状态，保证右上角头像和后续读取一致

## 非目标

- 不新增独立的个人中心路由页
- 不支持头像上传、裁剪、素材库选择
- 不支持修改登录账号
- 不支持手机号、微信信息等额外资料编辑
- 不处理多端资料同步策略，只面向当前 admin 端

## 方案对比

### 方案一：保留弹窗容器，新增基本设置表单组件

做法：

- 保留 [apps/admin/src/slots/ToolbarEnd/profile.vue](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/slots/ToolbarEnd/profile.vue) 作为 tab 容器
- 新增独立的 `EditProfileForm.vue` 组件承载“基本设置”表单
- 后端补一个“更新当前用户资料”接口

优点：

- 结构与现有“安全设置”一致
- 改动范围小，不引入菜单、路由、权限等额外调整
- 后续如果升级为独立个人中心，表单组件可以复用

缺点：

- 个人设置仍然停留在弹窗层级，承载复杂资料场景的空间有限

### 方案二：重构为独立路由页

做法：

- 新建 `views/system/profile` 或类似目录
- 当前弹窗入口改为跳转页面

优点：

- 扩展空间更大
- 适合后续演进为完整个人中心

缺点：

- 超出本次首版范围
- 当前 admin 仓库尚未建立对应的信息架构和菜单语义

### 方案三：直接把基本设置写进 profile.vue

做法：

- 不拆组件，直接在 `active === 0` 分支中实现全部表单

优点：

- 编码路径最短

缺点：

- 容器和表单耦合，后续继续加 tab 或字段时会迅速变乱

## 结论

采用方案一：

- 继续使用当前弹窗式“个人设置”
- 将“基本设置”和“安全设置”都收敛为独立表单组件
- `profile.vue` 只负责布局和 tab 切换

## 页面与文件放置

### 前端

- 保留 [apps/admin/src/slots/ToolbarEnd/profile.vue](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/slots/ToolbarEnd/profile.vue)
  - 负责左侧 tab、右侧内容区和弹窗内布局
  - 将 `v-if="active === 0"` 的占位文案替换为 `EditProfileForm`

- 新增 [apps/admin/src/components/business/AccountForm/EditProfileForm.vue](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/components/business/AccountForm/EditProfileForm.vue)
  - 负责“基本设置”表单渲染、校验、提交
  - 与现有 `EditPasswordForm.vue` 同层，保持账号相关表单的组织一致性

- 修改 [apps/admin/src/api/user/index.ts](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/api/user/index.ts)
  - 新增更新当前用户资料的接口方法

- 修改 [apps/admin/src/store/user/index.ts](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/store/user/index.ts)
  - 补齐 `nickname`
  - 统一维护个人资料更新后的 store 与本地缓存同步

- 视需要调整 [apps/admin/src/slots/ToolbarEnd/index.vue](/Users/snow/Documents/Gaoge/gaoge/apps/admin/src/slots/ToolbarEnd/index.vue)
  - 优化头像 fallback 的显示逻辑

### 后端

- 新增 `apps/api/src/modules/auth/dto/update-profile.dto.ts`
  - 定义“更新当前用户资料”入参校验

- 修改 [apps/api/src/modules/auth/controllers/auth.controller.ts](/Users/snow/Documents/Gaoge/gaoge/apps/api/src/modules/auth/controllers/auth.controller.ts)
  - 新增 `PATCH /auth/profile`

- 修改 `apps/api/src/modules/auth/services/auth.service.ts`
  - 新增 `updateProfile(userId, dto)` 方法
  - 复用现有用户序列化逻辑返回 `AuthUser`

- 修改 [packages/shared/types/src/auth.ts](/Users/snow/Documents/Gaoge/gaoge/packages/shared/types/src/auth.ts)
  - 补齐本次更新接口需要的共享类型

## 表单设计

“基本设置”首版只包含 4 个字段：

- `账号`：只读，展示 `account`
- `角色`：只读，展示 `role`
- `昵称`：可编辑，必填
- `头像 URL`：可编辑，非必填

### 展示方式

- 右侧内容区继续沿用当前“安全设置”的大标题 + 描述 + 表单布局
- 顶部增加一个头像预览区，使用 `FaAvatar`
- 有 `avatarUrl` 时展示头像
- 无 `avatarUrl` 时优先回退到 `nickname` 首字，再回退到 `account` 首字
- 头像预览下方使用普通输入框维护头像 URL，不引入上传组件

### 校验规则

- `nickname`
  - 必填
  - 提交前做 `trim`
  - `trim` 后不能为空
  - 长度限制 `1-20`

- `avatarUrl`
  - 非必填
  - 空字符串允许提交，并在服务端归一化为 `null`
  - 有值时做基础 URL 格式校验

### 提交行为

- 点击“保存”后提交表单
- 请求进行中按钮进入 loading 状态，避免重复提交
- 成功后弹成功提示
- 不自动关闭弹窗，用户留在当前 tab 查看结果
- 成功响应用于直接刷新前端 store，不额外再请求一次 `profile`

## 接口设计

### 查询接口

保留现有：

- `GET /auth/profile`

### 更新接口

新增：

- `PATCH /auth/profile`

入参：

```ts
interface UpdateProfilePayload {
  nickname: string
  avatarUrl?: string | null
}
```

返回：

```ts
type UpdateProfileResponse = AuthUser
```

### 后端处理规则

- 使用当前登录态中的 `userId`
- 校验用户存在、未删除、状态有效
- `nickname` 先 `trim` 再入库
- `avatarUrl` 为空串时转为 `null`
- 返回更新后的完整 `AuthUser`

## 前端数据流

### Store 调整

`useUserStore` 增加：

- `nickname`
- `updateProfile(data)` action

### 资料同步时机

- 登录成功时，同步 `nickname`
- `getPermissions()` 并行获取资料后，同步 `nickname`
- 个人资料更新成功后，同步 `nickname/avatar/account/role` 中服务端返回的最新值

### 本地缓存

为避免刷新后显示不一致，`localStorage` 同步维护：

- `account`
- `avatar`
- `role`
- `nickname`

## 组件职责边界

- `profile.vue`
  - 只负责 tab 容器和布局

- `EditProfileForm.vue`
  - 只负责“基本设置”的表单交互

- `useUserStore`
  - 作为当前登录用户资料的单一数据源

- `api/user/index.ts`
  - 只承载接口请求，不做本地状态拼装

## 错误处理

- 表单校验失败时，阻止提交并展示字段级错误
- 接口失败时，保留当前输入内容，不清空表单
- 不在首版增加复杂错误码分支；沿用项目当前统一请求提示能力

## 测试与验收

### 前端验收

- 打开“个人设置”后可见“基本设置”表单，而不是占位文案
- 初次打开时字段能正确回填当前账号资料
- 修改昵称后保存成功，右上角展示同步更新
- 修改头像 URL 后保存成功，右上角头像同步更新
- 清空头像 URL 后保存成功，头像回退逻辑正常
- 切换到“安全设置”不受影响

### 后端验收

- 已登录用户可成功调用 `PATCH /auth/profile`
- 未登录用户访问时被鉴权拦截
- 空白昵称被校验拒绝
- 空字符串头像可被归一化为 `null`

## 后续可扩展方向

以下能力不纳入本次实现，但本次结构应允许后续平滑扩展：

- 头像上传
- 独立个人中心路由页
- 更多资料字段，例如手机号、展示名、个性签名
- 审计日志或资料修改历史
