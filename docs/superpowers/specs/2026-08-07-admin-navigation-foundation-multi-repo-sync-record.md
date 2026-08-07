# Admin 导航工程底座多仓同步记录

> **状态：已完成。** 三个目标仓保持未提交、未推送，等待独立审查和提交。

## 源信息

- 源仓库：`gaoge`。
- 源修订：`d9567ea0845965b08e36519129b2941dd23358d4`。
- 导航实现提交：`ed172ab`。
- AppSetting 实现提交：`d9567ea`。
- 同步规范：由本记录所在的 `docs(admin): record foundation sync workflow` 提交维护。
- 成员事实源：知识库主题 `kb:topic:gaoge-admin-foundation-sync`。

长期同步方法见 [Admin 工程底座同步约定](../../conventions/admin-foundation-sync.md)。本文件只记录 2026-08-07 这一次实际执行结果。

## 同步目标

- `/Users/snow/Documents/Gaoge/gaoge-club`
- `/Users/snow/Documents/Gaoge/gaoge-compass`
- `/Users/snow/Documents/Gaoge/gaoge-crm`

`gaoge-erp` 当时为空目录且未进入 active 同步组，不在本次范围内。

## 同步范围

共迁移 16 个通用实现或测试文件：

- AppSetting、Header、MainSidebar、SubSidebar、Topbar、Toolbar 和布局入口。
- `MenuModeSwitch` 与 SubSidebar 过渡纯函数。
- 菜单 Store、`resolveSidebarMenus`、默认设置和 Settings 类型。
- 两个聚焦 Node 测试。

每个目标仓另增加一份目标侧同步记录，因此最终各有 17 个未提交文件。

明确排除：业务路由、业务菜单常量、RBAC seed、品牌、端口、API 地址、包名和部署配置，以及未实施的 Motion/Masonry 方案。

## 基线方法

每个目标路径比较源修改前 blob、源当前 blob 和目标当前 blob：

- `BASE`：目标仍等于源修改前内容，可迁移当前源内容。
- `MISSING`：目标不存在，可新增通用文件。
- `DIVERGED`：目标已经具有项目差异，必须语义合并。

同步过程中不使用 reset、checkout、整目录覆盖或跨仓 cherry-pick。

## 目标结果

| 仓库          | 基线结果                                      | 公共文件一致性           | Git 状态                |
| ------------- | --------------------------------------------- | ------------------------ | ----------------------- |
| gaoge-compass | 11 个 `BASE`，5 个 `MISSING`                  | 16/16 与源一致           | 17 个文件未提交、未推送 |
| gaoge-crm     | 11 个 `BASE`，5 个 `MISSING`                  | 16/16 与源一致           | 17 个文件未提交、未推送 |
| gaoge-club    | 10 个 `BASE`，5 个 `MISSING`，1 个 `DIVERGED` | 15/15 非菜单文件与源一致 | 17 个文件未提交、未推送 |

目标侧记录位于各仓库的：

```text
docs/superpowers/specs/2026-08-07-admin-navigation-foundation-sync.md
```

## gaoge-club 语义合并

`apps/admin/src/store/menu/index.ts` 没有直接覆盖，而是在 Club 当前文件上合入 canonical menu tree 和 `resolveSidebarMenus`，同时保留：

- `meta?.menu === false` 父路由的子菜单展开。
- `mainMenuTargetPaths` 的主菜单目标路径记录。
- `getMainMenuTargetPath` 对外接口。

合并后 Club 继续保有项目特化，同时获得与源一致的 `single` 菜单投影和过渡行为。

## 验证结果

| 仓库          | 聚焦测试 | ESLint | Stylelint | Typecheck | Production build | Diff check |
| ------------- | -------- | ------ | --------- | --------- | ---------------- | ---------- |
| gaoge         | 9/9      | 通过   | 通过      | 通过      | 通过             | 通过       |
| gaoge-compass | 9/9      | 通过   | 通过      | 通过      | 通过             | 通过       |
| gaoge-crm     | 9/9      | 通过   | 通过      | 通过      | 通过             | 通过       |
| gaoge-club    | 9/9      | 通过   | 通过      | 通过      | 通过             | 通过       |

Club 另通过静态断言确认四类新旧菜单标记均存在。构建输出中的 chunk-size、动态导入和第三方直接 `eval` 提示均为信息性警告。

## 知识库影响

同步组关联已经写入知识库并通过索引验证。代码影响查询同时暴露以下治理缺口：

- `gaoge`、`gaoge-club`、`gaoge-crm` 缺少可用的仓库 source map，建议后续完整灌库或重扫。
- gaoge-compass 已有 source map，但本次 Admin 路径没有匹配可靠映射行，建议增量更新。

这些缺口不影响本次代码同步结果，但会影响未来按源码路径自动定位知识页面的精度。

## 后续约定

- 新项目先加入知识库 active 同步组，再参与 fan-out。
- 未来 Skill 动态查询知识库成员，不硬编码仓库名单。
- Skill 可以自动迁移 `BASE` 和 `MISSING`，但不能自动覆盖 `DIVERGED`。
- 每个目标仓必须独立验证，并由用户决定目标仓提交和推送时机。
