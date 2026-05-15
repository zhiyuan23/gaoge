# Desktop Codex Shell 静态页面设计

日期：2026-05-15

## 目标

在 `apps/desktop` 内把当前桌面端体验替换为一个参考 Codex CLI / Codex app 的静态双栏页面：

- 左侧为 Codex 工具型导航栏
- 右侧为留白工作区
- 左侧上部菜单只做占位切换
- 底部保留设置入口
- 设置入口打开弹窗
- 设置弹窗内控件都可以点击
- 依赖真实账号、模型、远端服务或系统授权的数据使用假数据占位
- `General` 与 `Appearance` 中能本地实现的偏好全部保留并本地持久化

当前 `apps/desktop` 内已有的业务展示、首页工作台和独立设置页体验都可以放弃。Electron、React、Tailwind、preload bridge、本地 SQLite 设置存储和现有偏好运行时继续保留。

## 当前上下文

`apps/desktop` 当前是一个 Electron / React 应用：

- `electron/` 下已有 main、preload、窗口、菜单、IPC 和 SQLite 设置仓库
- `src/app/providers/app-providers.tsx` 已负责偏好 hydrate、主题写入和系统主题监听
- `src/state/preferences-store.ts` 已支持语言和主题模式本地持久化
- `src/app/layout/app-shell.tsx` 目前是高歌桌面壳层
- `src/pages/home/page.tsx` 和 `src/pages/settings/page.tsx` 是现有页面
- 测试覆盖了应用壳、首页占位和设置页偏好保存

本次设计应复用现有技术基座，但替换渲染层产品形态。

## 方案选择

本次评估了三种方向：

### 方案 A：Codex-like shell replacement

直接把当前 desktop UI 替换成 Codex 工具型双栏壳层。左侧为静态导航，右侧为空白工作区，设置改为弹窗。

优点：

- 最贴近用户要求的 Codex 页面布局
- 不需要保留当前业务页面
- 改动范围集中在渲染层
- 后续可以逐步把占位页替换成真实能力

缺点：

- 右侧在真实功能接入前会明显留白

### 方案 B：Branded desktop redesign

保留 Codex 信息架构，但用更强的高歌品牌视觉、卡片和渐变重新包装。

优点：

- 视觉完成度更高
- 更像独立产品界面

缺点：

- 容易偏离 Codex 参考
- 会引入当前阶段不必要的视觉复杂度

### 方案 C：Minimal prototype

只实现最小双栏骨架和设置弹窗，几乎不做视觉细节。

优点：

- 实现最快
- 变更最小

缺点：

- 不足以验证 Codex 风格桌面壳的体验
- 后续还需要补一轮基础视觉和交互整理

最终采用方案 A。

## 页面结构

应用首屏为单屏双栏布局：

```text
apps/desktop renderer
  └─ AppShell
      ├─ Sidebar
      │   ├─ brand / app title
      │   ├─ primary menu
      │   │   ├─ Chats
      │   │   ├─ Tasks
      │   │   ├─ Code Review
      │   │   └─ Environments
      │   └─ footer
      │       └─ Settings
      ├─ WorkspacePlaceholder
      └─ SettingsDialog
```

左侧 sidebar：

- 固定宽度，桌面端常驻
- 视觉参考 Codex 工具型应用，使用安静、密集、可长期使用的样式
- 顶部显示 Codex 风格应用标识
- 中部菜单包括 `Chats`、`Tasks`、`Code Review`、`Environments`
- 不包含项目模块
- 底部固定 `Settings` 按钮

右侧 workspace：

- 默认留白
- 当前不实现任何真实功能
- 点击左侧菜单时只切换轻量占位内容，包括标题、简短说明和空状态
- 不发起 API 请求
- 不接入当前项目已有业务数据

## 路由策略

首页承载完整 shell，设置不再作为独立页面。

- `/` 显示 Codex-style shell
- 左侧上部菜单不映射成多个真实路由，使用本地状态切换
- `Settings` 不再作为主要页面入口，而是 modal
- 移除当前独立 `/settings` 页面；如果路由文件需要兼容该路径，则让 `/settings` 重定向到 `/`

设计目标不是维护旧设置页。

## 设置弹窗

设置使用居中 modal。

弹窗内部为双栏结构：

- 左侧为设置分组列表
- 右侧为当前分组表单和状态区

分组包括：

- `General`
- `Appearance`
- `Account`
- `Model`
- `Integrations`
- `Advanced`

所有分组都可以点击切换。

### General

保留能本地实现的功能：

- Interface language：`简体中文` / `English`
- Startup view：`Chats` / `Tasks` / `Code Review` / `Environments`
- Enable notifications：本地布尔值
- Check for updates automatically：本地布尔值
- Confirm before running actions：本地布尔值

语言继续使用现有 `desktop-language` 偏好。

其他选项新增本地设置 key，写入现有 SQLite 设置仓库。它们只影响当前界面或保存状态，不需要接入系统通知、真实更新服务或命令执行能力。

### Appearance

保留能本地实现的功能：

- Theme：`Light` / `Dark` / `System`
- Density：`Comfortable` / `Compact`
- Sidebar labels：`Show` / `Hide`
- Font size：`Small` / `Default` / `Large`
- Reduce motion：本地布尔值

主题继续使用现有 `desktop-theme-mode` 偏好，并沿用 `resolvedTheme` 与系统主题监听。

新增外观选项写入本地 SQLite，并即时影响可本地体现的界面：

- Density 影响 shell 和设置弹窗间距
- Sidebar labels 影响侧栏菜单文字显示
- Font size 影响根字号或 app 容器字号 class
- Reduce motion 影响 CSS transition 强度

### Account / Model / Integrations / Advanced

这些分组只做静态占位和可交互假数据：

- `Account` 显示假用户、本地会话状态、可点击的 Sign out / Manage 按钮
- `Model` 显示假模型列表、默认模型选择、上下文窗口信息
- `Integrations` 显示假 GitHub / Figma / Notion 等连接项和可切换开关
- `Advanced` 显示日志级别、开发者模式、清理缓存等占位动作

按钮和开关必须有交互反馈，例如更新本地状态、显示保存文案或切换假连接状态。它们不请求后端，不读真实账户，不调用系统授权。

## 本地偏好数据

继续使用 `preferences-store` 作为渲染层偏好入口。

现有 key：

- `desktop-language`
- `desktop-theme-mode`

新增 key：

- `desktop-startup-view`
- `desktop-enable-notifications`
- `desktop-auto-check-updates`
- `desktop-confirm-actions`
- `desktop-density`
- `desktop-sidebar-labels`
- `desktop-font-size`
- `desktop-reduce-motion`

store 职责：

- 启动时读取所有本地偏好
- 缺失或非法值使用默认值
- set 方法先更新界面，再写入 Electron SQLite 设置
- 设置失败时保留界面状态并显示失败状态，后续实现可再决定是否回滚

默认值：

- language：`zh-CN`
- themeMode：`dark`
- startupView：`chats`
- enableNotifications：`true`
- autoCheckUpdates：`true`
- confirmActions：`true`
- density：`comfortable`
- sidebarLabels：`show`
- fontSize：`default`
- reduceMotion：`false`

## 组件拆分

建议在 `src/app/layout` 和 `src/features/settings` 或现有轻量目录中拆分：

- `AppShell`
  - 管理当前菜单和设置弹窗打开状态
  - 组合 sidebar、workspace 和 dialog
- `Sidebar`
  - 接收当前菜单、菜单点击回调和设置打开回调
  - 只负责导航展示
- `WorkspacePlaceholder`
  - 根据当前菜单展示空状态
  - 不包含业务数据读取
- `SettingsDialog`
  - 管理当前设置分组
  - 调用 preference store 写入本地设置
  - 管理假数据交互状态
- `settings-options`
  - 集中定义菜单、设置分组、假数据选项和展示文案

拆分目标是让 shell、导航、空状态和设置弹窗边界清晰，不引入大型抽象。

## 样式原则

视觉参考 Codex 工具型桌面应用：

- 主色使用中性灰、白、深色背景，不做高歌业务卡片式首页
- 左侧栏密度较高，适合长期工作
- 右侧工作区保持克制留白
- 不使用营销页 hero、装饰性渐变球、复杂卡片堆叠
- 按钮、菜单、开关和分段控件都使用清晰的 hover、active、focus 状态
- 保持 Electron 标题栏拖拽区域可用，交互元素使用 no-drag

当前 CSS 变量可以重写为更接近 Codex 的中性色系统。浅色和深色主题都需要可读。

## 错误与反馈

当前阶段不接真实业务 API，错误面较小：

- 本地偏好写入失败：在设置弹窗底部显示失败状态
- 非真实功能按钮：显示占位成功状态，例如 `This is placeholder data`
- 假集成开关：只切换内存状态，不持久化，避免暗示真实连接
- 外观偏好非法值：hydrate 时回退默认值

不需要新增全局 toast 系统。设置弹窗内的状态文本足够。

## 测试策略

更新现有 Vitest / Testing Library 测试：

- App 渲染后能看到 Codex-style sidebar 和空白 workspace
- 菜单包括 `Chats`、`Tasks`、`Code Review`、`Environments`
- 点击各菜单会切换右侧占位标题
- 点击 `Settings` 会打开设置弹窗
- 设置弹窗可切换 `General`、`Appearance`、`Account`、`Model`、`Integrations`、`Advanced`
- 修改语言和主题会调用本地设置写入
- 修改新增本地外观偏好会调用本地设置写入并更新界面
- 假数据按钮和开关有可见反馈

现有首页占位测试应改为新 shell 测试。现有独立设置页测试应改为设置弹窗测试。

基础校验命令：

```bash
pnpm --filter @gaoge/app-desktop test
pnpm --filter @gaoge/app-desktop typecheck
pnpm lint
```

如果全仓库 lint 受无关历史问题影响，最终说明具体失败点和已通过的 desktop 级别校验。

## 非目标

本次不做：

- 真实聊天功能
- 真实任务执行功能
- 真实代码审查功能
- 真实环境管理功能
- 真实账户登录
- 真实模型服务
- 真实集成授权
- 真实自动更新检查
- 迁移或保留当前高歌业务首页
- 新增共享包
- 调整 Electron 主进程架构

## 验收标准

实现完成后应满足：

- 启动 desktop 后首屏是 Codex 风格左右分栏
- 左侧上部菜单可点击并显示占位
- 右侧没有真实业务模块
- 左侧底部 Settings 可打开弹窗
- 设置弹窗所有分组可点击
- `General` 和 `Appearance` 中本地可实现的选项可交互并保存
- 主题、语言继续本地持久化
- 现有项目业务功能不再出现在桌面端界面中
- desktop 测试和类型检查通过，或明确列出与本任务无关的阻塞项
