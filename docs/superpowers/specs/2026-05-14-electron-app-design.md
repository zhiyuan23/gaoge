# Electron 独立桌面应用接入方案

日期：2026-05-14

## 目标

在 `apps/` 下新增一个独立的 Electron 桌面应用，为高歌体系提供新的桌面端入口，并满足以下前提：

- 应用目录位于 `apps/electron`
- 应用本身独立运行、独立构建、独立发布
- 渲染层使用 `React`
- 首发平台为 macOS 与 Windows
- 面向普通用户，而不是仅面向内部后台场景
- 默认在线工作，但具备正式本地持久化能力，后续可逐步增强离线能力

本次设计的重点不是实现具体业务，而是先把 Electron 应用在当前 monorepo 中的职责边界、目录结构、依赖方向、构建方式和演进路径一次定清楚。

## 背景

当前仓库已经具备以下基础：

- `apps/admin`、`apps/web`、`apps/miniapp`、`apps/api` 已在 monorepo 内稳定存在
- 根目录通过 `pnpm-workspace.yaml` 与 `turbo.json` 管理 `apps/*` 与 `packages/*`
- 共享层目前已有 `@gaoge/shared-*`、`@gaoge/sdk-*`、`@gaoge/config-*` 等基础包
- 根目录已经提供统一的 `lint`、`typecheck`、`build` 聚合命令
- 当前 `apps/*` 明确禁止横向依赖，真实应用应通过 `packages/*` 共享稳定能力

这意味着 `apps/electron` 应当被视为新的真实应用，而不是从 `apps/web` 上临时套一个桌面壳，也不适合在首版就把大量 Electron 细节沉到 `packages/*`。

## 范围

包含：

- 在 `apps/` 下定义 Electron 独立应用的架构
- 确定 `main`、`preload`、`renderer` 与本地存储的职责边界
- 给出适合面向普通用户桌面产品的默认技术栈
- 约束目录组织、依赖方向、开发脚本、打包方式与测试策略
- 预留后续离线增强、自动更新和系统集成的演进空间

不包含：

- 现在就实现具体业务模块
- 首版就做多窗口体系
- 首版就做复杂离线冲突自动合并
- 现在就接入签名、公证、崩溃上报和更新服务端
- 从 `apps/web` 或 `apps/admin` 迁移现成页面
- 为 Electron 提前新增新的共享包

## 方案选择

本次评估过三种路线：

### 方案 A：在线优先 Web 壳

路线：

- Electron 主要承载窗口与壳层
- 业务几乎都放在 renderer
- 本地只做少量设置与缓存

优点：

- 起步最快
- 与普通 Web SPA 的心智接近

缺点：

- 后续补本地存储、草稿、同步恢复、导入导出时改造成本高
- 容易把桌面产品做成“浏览器套壳”

### 方案 B：平衡型桌面应用

路线：

- Electron 负责桌面运行时、本地持久化和系统能力
- renderer 负责页面与业务流
- 默认在线同步，但本地已经有正式存储层

优点：

- 对普通用户产品更稳妥
- 后续向更强离线能力演进时不用推翻架构
- 同时兼顾开发效率与桌面特性

缺点：

- 首版复杂度高于纯 Web 壳
- 需要明确 IPC 和本地数据边界

### 方案 C：强本地优先产品

路线：

- 本地数据库为主存储
- 网络主要承担同步

优点：

- 离线体验最好
- 适合文档、笔记、剪藏等重本地产品

缺点：

- 需求未明确时过重
- 会过早引入冲突合并、迁移、修复工具等复杂度

### 最终结论

确认采用方案 B，也就是：

- `apps/electron` 作为独立桌面应用接入 monorepo
- 产品形态采用“在线优先 + 本地正式持久化 + 离线能力可渐进增强”
- 架构采用 Electron 经典三层：
  - `main` 处理桌面与系统能力
  - `preload` 负责安全桥接
  - `renderer` 处理页面、交互、状态和业务流

这是当前阶段最通用、最不容易返工的路线。

## 技术栈

确认采用以下技术栈：

- Electron 运行时：`electron`
- 开发与构建：`electron-vite`
- 渲染层：`React + TypeScript`
- 路由：`react-router-dom`
- 组件样式：`Tailwind CSS`
- 组件体系：`shadcn/ui`
- 远端数据：`@tanstack/react-query`
- 本地交互状态：`zustand`
- 输入与边界校验：`zod`
- 本地数据库：`better-sqlite3`
- 打包与分发：`electron-builder`
- 自动更新客户端：`electron-updater`
- 单元与组件测试：`Vitest + Testing Library`
- 桌面冒烟测试：`Playwright`

不采用以下路线：

- 首版不使用 `Vue`
- 首版不使用 `IndexedDB` 作为业务主存储
- 首版不引入 `Prisma`
- 首版不引入 `Redux`、`MobX` 等重状态管理方案
- 首版不复用 `apps/admin` 的现成 UI 技术体系

原因如下：

- `electron-vite` 能同时覆盖 `main + preload + renderer` 的开发体验，减少三套构建链维护成本
- `React + Tailwind CSS + shadcn/ui` 更适合面向普通用户的桌面产品，界面上限更高，组件二次定制成本更低
- `TanStack Query + Zustand` 的职责边界清晰，适合长期维护
- `better-sqlite3` 比 `IndexedDB` 更符合桌面产品正式本地存储的预期，也比首版直接上 `Prisma` 更轻
- `electron-builder + electron-updater` 能覆盖 macOS 与 Windows 的安装包和后续自动更新接入

## 应用定位

`apps/electron` 是高歌体系中的独立桌面客户端。

它的职责是：

- 作为新的桌面端应用入口
- 提供面向普通用户的桌面交互体验
- 复用现有 `apps/api` 提供的远端服务能力
- 提供本地持久化、设置管理、基础缓存和后续离线增强能力
- 收敛深链、外部链接、文件系统、系统通知等桌面能力

它不承担以下职责：

- 不作为 `apps/web` 的包装器
- 不作为 `apps/admin` 的桌面外壳
- 不作为新的共享能力沉淀容器
- 不在首版内构建复杂本地后端平台

## 目录设计

建议 `apps/electron` 采用如下目录：

```text
apps/electron/
  package.json
  tsconfig.json
  tsconfig.node.json
  tsconfig.web.json
  electron.vite.config.ts
  builder.config.ts
  index.html

  electron/
    main/
      index.ts
      window.ts
      menu.ts
      updater.ts
      ipc/
        index.ts
        app.ts
        dialog.ts
        shell.ts
        file.ts
        db.ts
        auth.ts
    preload/
      index.ts
      types.d.ts

  src/
    main.tsx
    App.tsx

    app/
      router/
      providers/
      layouts/
      bootstrap/

    pages/
      home/
      login/
      settings/

    features/
      account/
      onboarding/
      sync/

    entities/
      user/
      profile/

    shared/
      ui/
      lib/
      hooks/
      styles/
      config/

    state/
      app-store.ts
      session-store.ts
      ui-store.ts

    services/
      api/
        client.ts
        interceptors.ts
      queries/
      commands/

    bridges/
      electron.ts

  database/
    migrations/
    seeds/

  resources/
    icon.icns
    icon.ico
    entitlements.mac.plist
```

该目录结构的核心约束如下：

- `electron/main` 只承载 Electron 与系统能力，不承载页面业务
- `electron/preload` 只负责安全白名单桥接，不直接写业务规则
- `src/bridges/electron.ts` 是 renderer 接触桌面能力的统一入口
- `pages` 放页面级入口，`features` 放用户可感知功能，`entities` 放稳定领域模型
- `database/` 负责本地数据库迁移与种子，不与远端 API 层混放

## 运行时职责边界

### Main 进程

`electron/main` 的职责限定为：

- 应用生命周期管理
- 创建与恢复主窗口
- 菜单、托盘、深链和外部链接处理
- 文件系统、系统对话框、通知等桌面能力
- 本地数据库初始化与访问入口
- 注册 IPC 处理器
- 自动更新接入

`main` 不负责：

- 不直接承载页面业务流程
- 不维护页面状态树
- 不对 renderer 暴露任意 Node 能力

### Preload 层

`electron/preload` 的职责限定为：

- 使用 `contextBridge` 暴露白名单 API
- 为 renderer 提供稳定、可类型化的桌面 API
- 屏蔽 Electron 原生对象细节

例如只暴露如下形式的入口：

- `window.gaoge.app.getVersion()`
- `window.gaoge.shell.openExternal(url)`
- `window.gaoge.file.pickFile()`
- `window.gaoge.db.invoke(...)`

`preload` 不负责：

- 不写业务判断
- 不直接拼装复杂领域对象
- 不把 Electron 全量对象泄漏到 `window`

### Renderer 层

`src/` 下的渲染层职责为：

- 渲染页面
- 组织路由与全局 provider
- 处理用户交互与业务流程
- 调用远端 API 与本地桌面桥接
- 呈现同步状态、错误状态和空状态

渲染层不应直接：

- 访问 Node.js API
- 直接操作 SQLite 连接
- 散落调用原始 IPC 名称

## 数据与状态设计

### 总体策略

首版确认采用“在线优先 + 本地正式持久化 + 可渐进增强离线”的策略。

具体行为：

- 读：
  - 首选远端接口数据
  - 在合适场景下读取本地持久化内容做恢复、缓存和最近状态展示
- 写：
  - 正常写操作优先通过 API 提交
  - 本地保存设置、会话辅助信息、草稿、最近记录和必要缓存
- 恢复：
  - 应用重启后可恢复用户偏好、窗口状态、最近上下文和未提交草稿
- 离线增强：
  - 后续如果业务明确需要，可逐步增加本地草稿队列、后台同步和冲突提示

不采用以下策略：

- 不把首版直接做成强本地优先产品
- 不把页面写成完全依赖网络才能启动
- 不让本地存储策略散在页面组件中

### 状态分工

状态职责明确拆分为两类：

- `TanStack Query`
  - 管理远端数据获取、缓存、失效与重试
  - 适合用户资料、列表数据、详情数据等来源于 API 的内容
- `Zustand`
  - 管理本地交互状态和会话级状态
  - 适合 UI 开关、窗口内流程状态、临时草稿引用、当前上下文等

不建议：

- 用 `Zustand` 重写一套远端数据缓存体系
- 用 `TanStack Query` 承担复杂 UI 流程状态

### 本地数据库

首版本地正式存储采用 `better-sqlite3`。

建议本地数据库优先承担以下内容：

- 用户设置与偏好
- 最近使用记录
- 本地草稿
- 轻量缓存
- 后续离线增强所需的同步元数据

原因：

- SQLite 更符合桌面产品的数据持久化预期
- `better-sqlite3` API 简单、稳定、性能足够
- 调试、备份、迁移和问题排查都比 `IndexedDB` 更直接

不采用：

- 不用 `IndexedDB` 作为业务主存储
- 不用 JSON 文件拼装临时本地存储层
- 不在首版引入 `Prisma`

不引入 `Prisma` 的原因：

- 当前阶段模型尚未明确，首版没必要增加 ORM 生成与打包复杂度
- Electron 本地数据库场景下，直接使用 `better-sqlite3` 更可控
- 等本地模型明显增大后，再单独评估 ORM 是否值得引入

## IPC 与桥接策略

确认采用“主进程持有能力，renderer 通过白名单桥接访问”的策略。

具体约束：

- IPC 名称在 `electron/main/ipc/*` 中集中注册
- `preload` 暴露类型安全的桥接方法
- renderer 只依赖 `src/bridges/electron.ts`
- 页面与组件不直接调用 `window.gaoge` 以外的全局对象

这能避免：

- 桌面能力在 renderer 中四处散落
- 后续重命名 IPC 通道时大面积改动
- 安全边界失控

## 依赖与共享边界

`apps/electron` 遵循当前仓库既有单向依赖规则：

```text
apps/electron -> sdk/ui/server/shared/configs
```

因此：

- 可以依赖 `@gaoge/shared-*`
- 可以依赖 `@gaoge/sdk-*`
- 可以依赖 `@gaoge/config-*`
- 不可以依赖 `apps/web`
- 不可以依赖 `apps/admin`
- 不可以依赖 `apps/miniapp`

对于共享沉淀，采用以下原则：

- 稳定 DTO、通用 schema、纯函数工具，后续可沉到 `packages/shared/*`
- 远端 API 客户端能力稳定后，可沉到 `packages/sdk/*`
- Electron 专属能力始终留在 `apps/electron`
- 没有至少两个应用稳定复用之前，不新增新的共享包

## 构建与发布设计

### 应用内脚本

`apps/electron/package.json` 至少维护以下脚本：

- `dev`
- `build`
- `build:dir`
- `dist`
- `test`
- `test:e2e`
- `typecheck`
- `clean`

脚本含义如下：

- `dev`：启动 Electron 本地开发环境
- `build`：执行 `electron-vite` 构建
- `build:dir`：生成未打包目录产物，用于本地验证
- `dist`：产出正式安装包
- `test`：执行单元与组件测试
- `test:e2e`：执行桌面冒烟测试
- `typecheck`：同时覆盖 `renderer` 与 `main/preload`
- `clean`：清理构建产物

### 根级接入

根目录建议补充以下命令：

- `pnpm dev:electron`
- `pnpm dev:electron-api`
- `pnpm build:electron`

接入原则如下：

- Electron 继续作为新的 `apps/*` 应用参与 `pnpm-workspace`
- `turbo` 聚合它的 `dev/build/typecheck/clean`
- 不为 Electron 单独建立与其他应用平级的新工作流体系

### 打包与更新

首发平台明确为：

- macOS
- Windows

首版要求能稳定产出：

- macOS `dmg`
- Windows `nsis`

自动更新策略为：

- 客户端能力预留 `electron-updater`
- 首版可先不接入正式更新服务端
- 等发布流程稳定后再补更新源、公证、签名和回滚策略

## 配置与规范策略

### TypeScript

Electron 应用的 TypeScript 配置拆分为两类：

- `renderer` 使用 web 向配置
- `main/preload` 使用 node 向配置

原因：

- 渲染层依赖 DOM、React 与 Vite
- 主进程与预加载层依赖 Node/Electron 运行时

### ESLint / Prettier / Stylelint

Electron 应用必须接入仓库现有根规范。

具体约束：

- 遵循 monorepo 现有工作区命名与脚本命名
- 接入根级 `pnpm lint`、`pnpm typecheck`
- 使用仓库现有的 Prettier、ESLint、Stylelint 体系
- 不为 Electron 单独创建另一套格式风格

这里明确采用“服从当前仓库真实可执行配置”的策略，而不是机械复制 `apps/admin` 的全部本地规则。

### 样式策略

Electron 首版样式采用：

- `Tailwind CSS`
- `shadcn/ui`
- 少量应用级 CSS variables

原因：

- 它更适合面向普通用户的桌面产品
- 组件搭建速度快，同时保留足够的视觉定制空间
- 比后台型 UI 套件更容易做出完整的产品感

约束：

- 保持设计 token 集中，不在组件里随意堆砌零散值
- 不让 `shadcn/ui` 成为无约束复制模板的入口
- 如果后续形成稳定视觉语言，再评估是否上沉部分 token 到 `packages/ui/*`

## 测试策略

Electron 首版测试分三层：

### 单元测试

重点覆盖：

- 桌面桥接封装
- API 请求封装
- 状态切换逻辑
- 本地数据库访问层
- 数据映射与校验逻辑

### 组件测试

重点覆盖：

- 核心页面组件
- 登录与设置等关键交互
- 错误状态、空状态和加载状态

不追求：

- 首版即为每个纯展示组件单独建测试
- 全量视觉快照覆盖

### Electron 冒烟测试

重点覆盖：

- 应用启动
- 主窗口加载
- 基础登录或启动流程
- 本地设置持久化
- 关键用户路径可用性

冒烟测试只覆盖关键链路，不扩展成完整桌面回归平台。

## 第一阶段交付边界

第一阶段包含：

- `apps/electron` 基础工程骨架
- `main + preload + renderer` 三层跑通
- `React + TypeScript` 渲染层接入
- 基础路由、Provider 和应用启动框架
- 本地 SQLite 初始化与最小访问层
- 对接现有 `apps/api`
- 基础设置页与示例用户流
- macOS / Windows 打包产物
- 基础测试链路

第一阶段明确不做：

- 多窗口
- 复杂离线同步
- 自动更新服务端接入
- 签名、公证、崩溃上报
- 深度系统集成
- 从 `web/admin` 抽大规模 UI 共享

## 实施约束

后续实现阶段必须坚持以下约束：

- 不因 Electron 引入而破坏 `apps -> packages` 的单向依赖
- 不把 Electron 专属能力提前下沉到 `packages/*`
- 不把桌面能力直接暴露给页面组件
- 不让 renderer 直接持有数据库连接
- 不为未来“可能需要”的复杂桌面能力提前预埋过度抽象

## 结论

本方案确认：

- `apps/electron` 作为独立桌面应用接入 monorepo
- 使用 `React + TypeScript` 作为渲染层
- 使用 `electron-vite + electron-builder` 作为开发与打包基础
- 使用 `Tailwind CSS + shadcn/ui` 作为首版 UI 路线
- 使用 `TanStack Query + Zustand + Zod` 组织数据与状态边界
- 使用 `better-sqlite3` 作为首版本地正式存储
- 使用 `electron-updater` 作为后续自动更新预留能力
- 代码规范服从仓库现有可执行配置，不机械复制其他应用

该设计满足当前 monorepo 阶段下“新增真实应用”的接入要求，也为后续逐步扩展成完整桌面产品保留了清晰边界。
