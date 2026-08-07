# Admin 导航工程底座实施记录

> **状态：已完成。** 本文件记录最终结果，不再作为待执行计划使用。

## 对应设计

- [Admin 导航工程底座设计](../specs/2026-08-07-admin-navigation-foundation-design.md)
- [Admin 工程底座同步约定](../../conventions/admin-foundation-sync.md)

## 提交记录

| 提交/记录                                      | 内容                                       |
| ---------------------------------------------- | ------------------------------------------ |
| `ed172ab`                                      | 统一导航壳层、菜单投影、侧栏过渡和聚焦测试 |
| `d9567ea`                                      | 重构 AppSetting，并接入导航相关设置入口    |
| `docs(admin): record foundation sync workflow` | 增加长期多仓同步约定和最终记录             |

最终用于跨仓同步的源修订为 `d9567ea0845965b08e36519129b2941dd23358d4`。

## 实施范围

### 布局与组件

- `apps/admin/src/layouts/index.vue`
- `apps/admin/src/layouts/components/Header/index.vue`
- `apps/admin/src/layouts/components/MainSidebar/index.vue`
- `apps/admin/src/layouts/components/SubSidebar/index.vue`
- `apps/admin/src/layouts/components/SubSidebar/transition.ts`
- `apps/admin/src/layouts/components/Topbar/index.vue`
- `apps/admin/src/layouts/components/Topbar/Toolbar/index.vue`
- `apps/admin/src/layouts/components/Topbar/Toolbar/rightSide.vue`
- `apps/admin/src/layouts/components/Topbar/Toolbar/MenuModeSwitch/index.vue`

### 菜单与配置

- `apps/admin/src/store/menu/index.ts`
- `apps/admin/src/store/menu/resolve-sidebar-menus.ts`
- `apps/admin/src/settings.default.ts`
- `apps/admin/src/types/global.d.ts`
- `apps/admin/src/layouts/components/AppSetting/index.vue`

### 测试

- `apps/admin/tests/sidebar-menu-levels.test.ts`
- `apps/admin/tests/sidebar-transition.test.ts`

## 关键实施结论

- PC 三种导航模式统一渲染 Header；横向菜单仅属于 `head`。
- PC 侧栏移除重复 Logo，移动端侧栏 Logo 保留。
- Topbar 的 Toolbar 可见性由布局统一计算并通过 prop 传递。
- `allMenus` 不再随布局模式改变，`sidebarMenus` 由纯函数投影。
- `singleMenuHideFirstLevel` 默认关闭，只按显式配置隐藏一级。
- SubSidebar 过渡同时观察导航模式和激活索引。
- `MenuModeSwitch` 默认关闭，启用后直接完成 `head ↔ single` 切换并同步激活菜单。
- AppSetting 中增加两个设置入口，同时保留所有既有配置绑定。

## 验证结果

源仓在提交前完成：

- 聚焦测试：9/9 通过。
- 受影响文件 ESLint：通过。
- 布局 Vue 文件 Stylelint：通过。
- `pnpm --filter @gaoge/app-admin typecheck`：通过。
- `pnpm --filter @gaoge/app-admin build`：通过。
- `git diff --check`：通过。

构建中的 chunk-size 和第三方直接 `eval` 提示为既有信息性警告，不影响本次结果。

## 后续同步

本次向 gaoge-club、gaoge-compass、gaoge-crm 的实际同步结果见 [多仓同步记录](../specs/2026-08-07-admin-navigation-foundation-multi-repo-sync-record.md)。未来重复同步应使用长期约定中的 BASE、MISSING、DIVERGED 分类，不直接复制历史提交。
