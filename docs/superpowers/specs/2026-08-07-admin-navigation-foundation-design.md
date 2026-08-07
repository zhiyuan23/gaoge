# Admin 导航工程底座设计

> **状态：已确认设计。** 本文定义导航工程底座的目标行为；实现状态与提交信息将在同步记录中补充。

## 背景

`apps/admin` 支持 `side`、`head`、`single` 三种桌面导航模式。原实现同时按导航模式切换顶部壳层、右侧工具区和菜单层级，导致 Header、Tabbar、Toolbar 与侧边栏职责交叉；`single` 还会在菜单转换阶段丢弃一级分组。

本设计把设备模式、导航位置和菜单投影拆成三个独立判断，使三种模式共享稳定的桌面壳层，并允许项目明确控制 `single` 是否隐藏一级菜单。

## 目标

- 三种 PC 导航模式统一使用固定 Header 和 Tabbar 层级。
- 导航模式只决定主导航位于 Header、主侧栏或不单独显示。
- 菜单 Store 保存与布局模式无关的 canonical menu tree。
- `single` 是否隐藏一级菜单完全由项目设置控制。
- 提供可选的 PC 工具栏按钮，在 `head` 与 `single` 之间直接切换。
- 保留移动端抽屉导航、业务路由、权限和项目特化。

## 布局模式矩阵

PC 统一采用：

```text
Header
Tabbar（启用时）
Breadcrumb Toolbar（启用且路由模式支持时）
Page Content
```

| 模式     | Header | Header 主导航 | 侧边主导航 | 次导航                     |
| -------- | ------ | ------------- | ---------- | -------------------------- |
| `head`   | 显示   | 显示          | 不显示     | 显示当前主导航后代         |
| `side`   | 显示   | 不显示        | 显示       | 显示当前主导航后代         |
| `single` | 显示   | 不显示        | 不显示     | 显示完整树或隐藏一级后的树 |

移动端保持原有结构：Header 高度为 `0`，Toolbar 承载侧栏开关和右侧工具，侧栏保留 Logo、遮罩及抽屉交互。

## 组件职责

### `layouts/index.vue`

- `headerActualHeight` 只由 PC/移动设备模式决定。
- `enableToolbar` 在移动端恒为真；PC 仅在面包屑开启且 `routeBaseOn !== 'filesystem'` 时为真。
- Topbar 实际高度严格等于已显示的 Tabbar 和 Toolbar 高度之和。
- 把 `enableToolbar` 作为显式 prop 传给 Topbar。

### `Header`

- PC 三种模式均渲染品牌区和右侧工具区。
- 仅 `head` 渲染横向主导航。
- 不重复实现另一套导航状态或工具区。

### `Topbar` 与 `Toolbar`

- Tabbar 始终位于可选 Toolbar 之前。
- PC Toolbar 只承担面包屑；右侧工具由 Header 承载。
- 移动端 Toolbar 继续承载右侧工具和侧栏开关。

### `MainSidebar` 与 `SubSidebar`

- PC 侧栏不显示重复 Logo，移动端保留。
- SubSidebar 只消费 `menuStore.sidebarMenus`，不自行推导菜单层级。
- keyed `TransitionGroup` 同时响应导航模式和主菜单索引变化。

### `MenuModeSwitch`

- 仅在 PC 且 `toolbar.menuModeSwitch` 开启时渲染。
- 位于 Fullscreen 之后、PageReload 之前。
- `head → single`，`single → head`，`side` 首次点击进入 `head`。
- 切入 `single` 时激活索引设为 `0`；进入 `head` 时按当前路由恢复激活主导航。
- 当前 `head` 使用 `i-gala:sidebar-left`，其他兼容状态使用 `i-codicon:layout-sidebar-left-off`。
- 不显示可见 Tooltip；动态 `aria-label` 描述下一次点击的目标模式。

## 菜单数据流

```text
路由或后端菜单
  → convertRouteToMenu（保留一级分组）
  → 权限过滤
  → allMenus（canonical menu tree）
  → resolveSidebarMenus（布局投影）
  → SubSidebar
```

`convertRouteToMenu` 不读取导航模式，也不为 `single` 制造合成根节点。

`resolveSidebarMenus(allMenus, mode, activeIndex, hideFirstLevel)` 是纯函数：

- `single + false`：返回完整可见菜单树。
- `single + true`：移除且只移除一级；没有子项的一级叶节点继续保留。
- `side/head`：返回当前激活一级分组的后代。
- 空数据或无效激活项：返回空数组。

## 配置契约

### `menu.singleMenuHideFirstLevel`

- 类型：可选布尔值。
- 默认值：`false`。
- 只影响 `single`。
- AppSetting 中始终显示该项，但非 `single` 模式下禁用开关。
- 不保留旧字段兼容别名，也不做自动深度推断。

### `toolbar.menuModeSwitch`

- 类型：可选布尔值。
- 默认值：`false`。
- AppSetting 仅在 PC 显示设置入口。
- 项目可在 `settings.ts` 中显式覆盖，不强制改变现有项目默认配置。

## 过渡规则

`resolveSubSidebarTransitionName(mode, activeIndex, previousActiveIndex, isMobile)` 统一产生过渡名：

- 移动端、`side`、`single` 使用纵向 `y` 过渡族。
- `head` 使用横向 `x` 过渡族。
- 激活索引增大使用 `start`，否则使用 `end`。

监听同时覆盖菜单模式和激活索引，因此即使索引保持 `0`，切入 `single` 仍会更新过渡。

## 项目边界

- 不改变业务路由、菜单标题、图标、权限、侧栏宽度、折叠逻辑和 Tabbar 行为。
- 不增加依赖、第二份导航状态、下拉菜单或快捷键。
- 不把应用内部实现抽成跨应用依赖。
- gaoge-club 的隐藏父菜单展开、主菜单目标路径记录和 `getMainMenuTargetPath` 属于目标项目特化，跨仓同步时必须语义合并保留。

## 验证契约

- `sidebar-menu-levels.test.ts` 覆盖完整树、显式隐藏一级、深层后代、`side/head` 和空激活项。
- `sidebar-transition.test.ts` 覆盖 `single` 模式变化和 `head/side` 方向族。
- 每次底座调整至少运行聚焦测试、ESLint、Stylelint、Admin typecheck、production build 和 `git diff --check`。

## 决策记录

- 使用统一 PC Header，不用 CSS 调序模拟壳层。
- canonical menu tree 与布局投影分离。
- `single` 层级由显式配置决定，不自动分析菜单深度。
- Toolbar 快捷切换只覆盖 `head` 与 `single`；`side` 是兼容入口状态。
- 移动端行为保持不变。
