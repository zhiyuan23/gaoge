# Desktop 前端目录结构说明

本文约束 `apps/desktop/src` 内部的前端目录职责，避免页面、应用外壳和功能模块继续混放。

## 核心原则

- `pages` 只放路由级页面
- `features` 放可独立理解的业务功能模块
- `app` 放应用装配、路由、全局 provider 和桌面壳
- `shared` 放应用内部稳定共享能力
- 不把临时占位页面伪装成长期业务结构

## 推荐结构

```text
apps/desktop/src/
  app/
    layout/
      app-shell.tsx
    providers/
      app-providers.tsx
    router/
      index.tsx
    shell/
      sidebar.tsx
      workspace-placeholder.tsx
  features/
    settings/
      settings-options.ts
      settings-dialog.tsx
      settings-dialog.test.tsx
  pages/
    home/
      page.tsx
      page.test.tsx
  shared/
    config/
      preferences.ts
      shell.ts
    i18n/
    styles/
  state/
```

## `app` 职责

`app` 是桌面应用的装配层。

适合放入：

- 应用级布局，例如 `app/layout/app-shell.tsx`
- 路由注册，例如 `app/router/index.tsx`
- 全局 provider，例如 `app/providers/app-providers.tsx`
- 应用外壳组件，例如左侧栏、顶部拖拽区、shell 菜单配置

不适合放入：

- 具体业务表单
- 业务数据请求逻辑
- 某个页面私有的展示组件

`app/shell` 是桌面壳边界。它负责渲染左侧栏、顶部拖拽区和当前静态占位区，但不承载真实业务页面。顶层菜单数据放在 `shared/config/shell.ts`，避免设置功能反向依赖 `app` 层。

## `pages` 职责

`pages` 只放路由级页面。一个目录对应一个可导航页面或主视图。

推荐：

```text
pages/
  home/
    page.tsx
  chats/
    page.tsx
  tasks/
    page.tsx
  code-review/
    page.tsx
  environments/
    page.tsx
```

页面文件负责组合布局和功能模块，不应沉淀大量业务实现。页面内部如果出现复杂表单、列表、状态机或数据交互，应下沉到对应 `features/*`。

## `features` 职责

`features` 放业务功能模块，不放路由页面本身。

适合放入：

- `features/settings`：设置弹窗、设置表单、设置相关测试
- `features/chat`：对话列表、对话输入、对话状态
- `features/task`：任务列表、任务详情、任务操作
- `features/code-review`：评审工作流组件
- `features/environment`：环境管理组件

不适合放入：

- `features/codex-shell` 这类应用外壳目录
- 只负责路由占位的页面
- 单纯为了分层而创建的空功能模块

功能模块可以被 `pages` 或 `app` 组合使用，但不应反向依赖某个页面目录。

## `shared` 职责

`shared` 放 desktop 应用内部的稳定共享能力。

适合放入：

- 偏好设置类型和校验
- i18n 文案和 hook
- 全局样式
- 与 UI 框架无关的小工具

不适合放入：

- 页面私有状态
- 具体功能模块的表单项
- Electron 主进程代码

跨应用共享能力必须进入 `packages/*`，不能从 `apps/desktop/src/shared` 被其他应用直接引用。

## 依赖方向

推荐依赖方向：

```text
app -> pages -> features -> shared
app -> features -> shared
app -> shared
pages -> features -> shared
pages -> shared
features -> shared
state -> shared
```

禁止：

- `features/*` 依赖 `pages/*`
- `shared/*` 依赖 `app/*`、`pages/*` 或 `features/*`
- `apps/desktop` 直接依赖其他 `apps/*`
- 其他应用直接引用 `apps/desktop/src/*`

需要被 `app/shell` 和 `features/settings` 同时消费的稳定配置，应放入 `shared/config`。当前顶层菜单和工作区占位文案映射放在 `shared/config/shell.ts`。

## 新增页面流程

新增真实页面时按以下步骤执行：

1. 在 `pages/<page-name>/page.tsx` 创建路由页面。
2. 如果页面需要复杂交互，在 `features/<domain>` 创建功能组件。
3. 在 `app/router/index.tsx` 注册路由。
4. 在 `shared/config/shell.ts` 增加顶层菜单入口。
5. 为页面或功能模块增加邻近测试。

不要把新页面放到 `features` 目录；`features` 只承接页面内部可复用或可独立理解的功能块。

## 当前静态 shell 的处理原则

当前 Codex 风格页面仍是静态 shell，因此：

- 左侧栏、顶部拖拽区和占位工作区组件放在 `app/shell`
- 设置弹窗放在 `features/settings`
- 顶层菜单和占位文案映射放在 `shared/config/shell.ts`
- `pages/home` 保留为真实路由页面入口
- 后续对话、任务、代码评审和环境页面成熟后，再逐步新增 `pages/*`

占位内容可以短期保留在 `app/shell/workspace-placeholder.tsx`。一旦某个入口接入真实页面，应删除对应占位分支，改为路由页面承载。

## 命名约定

- 路由页面目录使用 kebab-case，例如 `code-review`
- 功能目录使用业务名词，例如 `settings`、`task`、`environment`
- 组件文件使用 kebab-case，例如 `settings-dialog.tsx`
- 测试文件与被测文件邻近，例如 `settings-dialog.test.tsx`
- 应用内部引用继续使用 `@/`

## 校验建议

修改 desktop 前端结构后至少运行：

```bash
pnpm --filter @gaoge/app-desktop typecheck
pnpm --filter @gaoge/app-desktop build
```

涉及组件行为时补充运行对应 Vitest 文件。
