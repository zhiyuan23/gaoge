# Electron 独立桌面应用接入方案

日期：2026-05-14

## 目标

在 `apps/` 下新增一个独立的 Electron 桌面应用，为高歌体系提供新的桌面端入口，并满足以下前提：

- 应用目录位于 `apps/electron`
- 应用本身独立运行、独立构建、独立发布
- 渲染层使用 `Vue 3 + Vite`
- 首发平台为 macOS 与 Windows
- 数据模式为“部分离线可用 + 与现有 `apps/api` 同步”

本次设计的重点不是立刻做复杂桌面能力，而是先把 Electron 在当前 monorepo 中的职责边界、目录结构、构建方式、同步策略和后续演进空间一次定清楚。

## 背景

当前仓库已经具备以下基础：

- `apps/admin`、`apps/web`、`apps/miniapp`、`apps/api` 已在 monorepo 内稳定存在
- 根目录通过 `pnpm-workspace.yaml` 与 `turbo.json` 管理 `apps/*` 与 `packages/*`
- 共享层目前已有 `@gaoge/shared-*`、`@gaoge/sdk-*`、`@gaoge/config-*` 等基础包
- `@gaoge/sdk-api-client` 目前仍较薄，只定义了基础请求契约，并没有成熟的桌面端同步抽象
- 仓库已有统一的 `lint`、`typecheck`、`build` 聚合命令

这意味着 `apps/electron` 应该被视为新的真实应用，而不是从 `apps/web` 或 `apps/admin` 上临时套一个桌面壳，也不适合在首版就把大量 Electron 细节沉到 `packages/*`。

## 范围

包含：

- 在 `apps/` 下定义 Electron 独立应用的架构
- 约束 Electron 的目录组织、依赖方向、构建与发布方式
- 定义渲染层、主进程、预加载层、离线存储与同步引擎之间的职责边界
- 为未来接入 SQLite 预留演进空间
- 明确代码规范、样式策略与测试策略

不包含：

- 首版就实现 SQLite 真正落地
- 自动更新、公证、签名、崩溃上报等发布后能力
- 复杂离线冲突自动合并
- 多窗口体系
- 迁移 `apps/web` 或 `apps/admin` 的现有页面到 Electron
- 为 Electron 预先新增新的共享包

## 设计结论

### 方案选择

确认采用“独立桌面应用 + 薄主进程 + Vue 渲染层承载业务 + 独立同步模块”的方案。

具体取舍如下：

- 不采用“复用 `apps/web` 或 `apps/admin` 作为 Electron 壳”的方案
- 不采用“主进程承担本地后端与绝大多数业务编排”的方案
- 采用 Electron 经典三层结构：
  - `main` 处理桌面与系统能力
  - `preload` 暴露安全桥接
  - `renderer` 处理页面、状态与领域流程

原因：

- 当前仓库已经明确 `apps/*` 之间不能互相直接依赖，Electron 作为独立应用必须自洽
- 若直接复用 `web/admin`，会破坏应用边界，也会让后续桌面专属能力难以收敛
- 若在首版把复杂业务上提到主进程，会过早制造第二套“本地后端”，增加 IPC 与测试成本
- 将业务和同步逻辑放在渲染层下的独立模块内，更符合当前仓库对前端应用的组织习惯，也更利于首版快速落地

### 技术路线

Electron 应用采用以下技术路线：

- Electron 运行时：`electron`
- 开发与构建：`electron-vite`
- 打包与分发：`electron-builder`
- 渲染层：`Vue 3 + Vite`
- 组件与页面测试：`Vitest + Vue Test Utils`
- 桌面端冒烟测试：`Playwright` 的 Electron 模式
- 样式：`SCSS + CSS variables`

不采用以下路线：

- 首版不上 TailwindCSS
- 首版不直接复制 `apps/admin` 的 UnoCSS 体系
- 首版不上 SQLite 作为正式业务主存储
- 首版不引入复杂的桌面状态管理框架

原因：

- `electron-vite` 能同时覆盖 `main + preload + renderer` 的开发体验，减少三套构建链维护成本
- `electron-builder` 足够支撑 macOS 与 Windows 首发产物
- 样式体系优先保持轻量，避免在 Electron 首版同时解决“桌面架构”和“原子化 CSS 规范”两类问题
- IndexedDB 对渲染层离线缓存更直接，首版无需把本地数据库访问全部上提到主进程

## 应用定位

`apps/electron` 是高歌体系中的独立桌面客户端。

它的职责是：

- 作为新的桌面端应用入口
- 提供离线可读、在线可同步的桌面端体验
- 复用现有 `apps/api` 提供的后端服务能力
- 在本地缓存、待同步队列和桌面系统能力之间建立稳定边界

它不承担以下职责：

- 不作为 `apps/web` 的包装器
- 不作为 `apps/admin` 的桌面外壳
- 不作为新的共享能力沉淀容器
- 不承担复杂本地数据库平台建设

## 目录设计

建议 `apps/electron` 采用如下目录：

```text
apps/electron/
  package.json
  tsconfig.json
  tsconfig.node.json
  tsconfig.web.json
  electron.vite.config.ts
  index.html

  electron/
    main/
      index.ts
      window.ts
      ipc/
        index.ts
        app.ts
        shell.ts
        storage.ts
    preload/
      index.ts
      types.d.ts

  src/
    main.ts
    App.vue

    app/
      router/
      providers/
      bootstrap/

    modules/
      football/
        player/
          pages/
          components/
          repository.ts
          mapper.ts
          types.ts
        team/

    stores/
      app/
      auth/

    services/
      api/
        client.ts
        football/
      storage/
        contracts/
          snapshot-store.ts
          draft-store.ts
          sync-queue-store.ts
          settings-store.ts
        indexeddb/
          snapshot-store.ts
          draft-store.ts
          sync-queue-store.ts
          settings-store.ts
        sqlite/
        factory.ts
      sync/
        engine.ts
        scheduler.ts
        conflict.ts
        types.ts

    shared/
      components/
      composables/
      utils/
      styles/
        tokens.css
        base.scss

  resources/
    icon.icns
    icon.ico
    entitlements.mac.plist
```

该目录结构的核心约束如下：

- `electron/main` 只承载 Electron 与系统能力，不承载复杂领域流程
- `electron/preload` 只负责安全白名单桥接，不直接写业务规则
- `src/modules/*` 按业务域组织，保持与仓库现有 `领域/资源` 的命名思路一致
- `src/services/storage/contracts` 先于具体实现存在，用于隔离首版 IndexedDB 与未来 SQLite
- `src/services/sync` 独立于页面与 store，作为可测试的同步模块存在

## 运行时职责边界

### Main 进程

`electron/main` 的职责限定为：

- 应用生命周期管理
- 创建与恢复主窗口
- 注册菜单、托盘、打开外链等桌面能力
- 注册 IPC 入口
- 挂载未来可能上移到主进程的本地存储桥接入口

`main` 不负责：

- 不直接承载领域同步流程
- 不直接维护业务状态树
- 不对页面暴露任意 Node 能力

### Preload 层

`electron/preload` 的职责限定为：

- 使用 `contextBridge` 暴露白名单 API
- 收敛桌面能力入口，例如：
  - `window.gaoge.app.getVersion()`
  - `window.gaoge.shell.openExternal(url)`
  - `window.gaoge.storage.*` 的桥接入口

`preload` 不负责：

- 不写业务判断
- 不拼接复杂领域对象
- 不把 Electron 全量对象泄漏到 `window`

### Renderer 层

`src/` 下的渲染层职责为：

- 渲染页面
- 组织路由与状态
- 调用 repository 获取与修改业务数据
- 响应同步状态变化
- 显示离线状态、同步状态、冲突提示

渲染层不应直接：

- 调 IndexedDB 原生 API
- 直连 Electron 主进程细节
- 在页面组件内散落同步状态机逻辑

## 数据与同步设计

确认采用以下访问链路：

`页面 / store -> repository -> (local store + remote api + sync engine)`

各层职责如下：

- `repository`
  - 为页面与 store 暴露稳定业务接口
  - 统一决定数据读写顺序
  - 隔离本地存储与远端请求细节
- `local store`
  - 维护快照、草稿、待同步队列、同步游标、最后同步时间
- `remote api`
  - 只负责与 `apps/api` 通信
  - 不掺杂缓存与同步状态机
- `sync engine`
  - 负责增量拉取、上推待同步记录、失败重试和冲突判定

### 首版同步策略

首版确认采用“本地优先读取 + 后台同步刷新 + 显式冲突提示”的策略。

具体行为：

- 读：
  - 优先读取本地快照
  - 即使 API 不可用，也允许从本地启动和浏览
- 拉：
  - 应用启动后后台请求 `apps/api`
  - 成功后更新本地快照并刷新界面
- 写：
  - 先落本地草稿或本地状态
  - 将待上推记录写入同步队列并标记 `pending`
- 同步：
  - 由应用启动、网络恢复、用户手动点击“重新同步”等事件触发
  - 成功后移除队列项并更新快照
- 冲突：
  - 首版不做自动合并
  - 保留本地草稿与远端快照，提示用户后续处理

不采用以下策略：

- 不要求每次页面进入都强依赖远端成功
- 不做复杂双向自动合并
- 不把同步逻辑散在页面和 store 中

## 本地存储设计

### 首版存储选型

首版采用“双层存储”：

- 业务数据存储：`IndexedDB`
- 应用设置存储：轻量 settings store，例如 `electron-store`

职责划分如下：

- `IndexedDB`
  - 存储业务快照
  - 存储用户草稿
  - 存储待同步队列
  - 存储同步游标与最后同步时间
- settings store
  - 存储窗口状态
  - 存储最近服务器地址
  - 存储用户偏好与桌面级开关

不采用以下做法：

- 不把业务主数据放到 settings store
- 不让页面和 Pinia store 直接操作 `IndexedDB`
- 不把 SQLite 作为首版业务主存储

### SQLite 预留策略

虽然首版不上 SQLite，但必须为后续接入预留稳定迁移空间。

因此要求：

- 业务层只依赖 `storage/contracts/*` 中定义的接口
- 具体实现通过 `storage/factory.ts` 统一选择
- `storage/sqlite/` 目录提前预留，用于后续放置主进程侧实现
- 本地业务数据模型统一带以下元信息：
  - `schemaVersion`
  - `updatedAt`
  - `syncStatus`
  - `remoteId`

后续若接入 SQLite，采用以下方向：

- SQLite 运行在主进程侧，而不是渲染层
- 渲染层通过 `preload` 暴露的桥接 API 访问 SQLite 能力
- 页面、store 与 repository 不因存储实现替换而改变接口

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

对于共享沉淀，明确采用以下原则：

- 稳定的 DTO 类型、通用请求封装、数据转换规则，后续可沉到 `packages/shared/*` 或 `packages/sdk/*`
- Electron 专属能力始终留在 `apps/electron`
- 没有至少两个应用稳定复用之前，不新增新的共享包

## 构建与发布设计

### 应用内脚本

`apps/electron/package.json` 至少维护以下脚本：

- `dev`
- `build`
- `build:mac`
- `build:win`
- `typecheck`
- `test`
- `clean`

脚本含义如下：

- `dev`：启动 Electron 本地开发环境
- `build`：产出默认桌面构建结果
- `build:mac`：产出 macOS 安装包
- `build:win`：产出 Windows 安装包
- `typecheck`：同时覆盖 `renderer` 与 `main/preload`
- `test`：执行单元测试与组件测试
- `clean`：清理构建产物

### 根级接入

根目录后续补充以下命令：

- `pnpm dev:electron`
- `pnpm dev:electron-api`

接入原则如下：

- Electron 继续作为新的 `apps/*` 应用参与 `pnpm-workspace`
- `turbo` 聚合它的 `dev/build/typecheck/clean`
- 不为 Electron 单独建立与其他应用平级的新工作流体系

### 打包平台

首发平台明确为：

- macOS
- Windows

首版要求能稳定产出：

- macOS `dmg`
- Windows `nsis`

首版不包含：

- Linux 发布产物
- 自动更新服务
- 签名、公证、上报链路的正式接入

## 配置与规范策略

### TypeScript

Electron 应用的 TypeScript 配置拆分为两类：

- `renderer` 使用 web 向配置
- `main/preload` 使用 node 向配置

原因：

- 渲染层依赖 DOM、Vue 与 Vite
- 主进程与预加载层依赖 Node/Electron 运行时

### ESLint / Prettier / Stylelint

Electron 应用必须接入仓库现有根规范。

具体约束：

- 遵循 monorepo 现有的工作区命名与脚本命名
- 接入根级 `pnpm lint`、`pnpm typecheck`
- 使用仓库现有的 Prettier、ESLint、Stylelint 体系
- 不为 Electron 单独创建另一套格式风格

这里明确采用“服从当前仓库真实可执行配置”的策略，而不是机械复制 `apps/admin` 的全部本地规则。

原因：

- 当前根级配置已是仓库实际执行入口
- `apps/admin` 具有成熟历史，不适合整体搬运到 Electron 首版
- Electron 首版的目标是接入独立桌面应用，而不是顺带统一所有前端工程基线

### 样式策略

Electron 首版样式采用：

- `SCSS`
- `CSS variables`
- 应用内局部样式与基础 token 文件

首版明确不采用：

- TailwindCSS
- `apps/admin` 的完整 UnoCSS 配置

原因：

- 当前阶段优先解决桌面架构与离线同步
- 不同时引入另一层原子化样式治理成本
- 当前仓库中 `web` 与 `admin` 的样式技术路线并不完全一致，Electron 首版不适合强行站队

后续若 Electron 页面规模扩大、样式迭代明显加速，可在第二阶段单独评估是否引入 UnoCSS，但这不属于本次接入范围。

## 测试策略

Electron 首版测试分三层：

### 单元测试

重点覆盖：

- repository
- sync engine
- storage contract
- 数据转换与冲突判定

### 组件测试

重点覆盖：

- 关键页面组件
- 离线状态展示
- 同步状态与错误提示交互

不追求：

- 全页面视觉快照覆盖
- 为首版每个基础组件都建立独立测试

### Electron 冒烟测试

重点覆盖：

- 应用启动
- 主窗口加载
- API 可用时的数据拉取
- 离线状态下从本地快照启动
- 网络恢复后的基础同步

冒烟测试只覆盖关键链路，不扩展成完整桌面回归平台。

## 第一阶段交付边界

第一阶段包含：

- `apps/electron` 基础工程骨架
- `main + preload + renderer` 三层跑通
- `Vue 3 + Vite` 渲染层接入
- 基础路由与应用启动框架
- 对接现有 `apps/api`
- 本地快照缓存
- 草稿与待同步队列
- 用户可见的手动同步入口
- 网络恢复后的基础自动同步
- macOS / Windows 打包产物
- 基础测试链路

第一阶段明确不做：

- SQLite 正式落地
- 自动更新
- 复杂冲突自动合并
- 多窗口
- 深度系统集成
- 从 `web/admin` 抽大规模 UI 共享
- 引入 TailwindCSS 或整套 UnoCSS

## 实施约束

后续实现阶段必须坚持以下约束：

- 不因 Electron 引入而破坏 `apps -> packages` 的单向依赖
- 不把 Electron 专属能力提前下沉到 `packages/*`
- 不把同步逻辑写进页面组件
- 不让页面直接操作本地存储实现
- 不为未来“可能需要”的复杂桌面能力提前预埋过度抽象

## 结论

本方案确认：

- `apps/electron` 作为独立桌面应用接入 monorepo
- 使用 `Vue 3 + Vite` 作为渲染层
- 使用 `electron-vite + electron-builder` 作为开发与打包基础
- 首版采用“本地优先读取 + 后台同步刷新 + 待同步队列”的部分离线模式
- 首版本地存储采用 `IndexedDB + settings store`
- 通过 `storage/contracts + factory` 为 SQLite 后续接入预留空间
- 代码规范服从仓库现有可执行配置，不机械复制 admin
- 样式体系首版保持轻量，不引入 TailwindCSS，也不直接复制 UnoCSS

该设计满足当前 monorepo 阶段下“新增真实应用”的接入要求，也为后续逐步扩展桌面能力保留了足够清晰的演进边界。
