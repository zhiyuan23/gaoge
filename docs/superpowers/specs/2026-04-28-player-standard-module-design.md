# 球员标准模块示例页设计

日期：2026-04-28

## 目标

在 `apps/admin` 的 `高歌FC` 菜单下新增一个与 `球员信息` 同级的页面 `球员标准模块`，页面形态参考同级目录外 `basic-main` 项目的 `standard_module_example/list.vue`，用于展示后台标准 CRUD 模块的典型交互骨架。

该页面当前临时使用球员数据接口与球员表单作为占位，但它的定位是“标准模块示例页”，不是正式业务页。后续可整体替换为其他业务数据，不在本轮为可替换数据源提前增加抽象层。

## 背景

当前仓库内已经有一个正式的 `球员信息` 页面，它采用了收敛后的 admin CRUD 目录结构：

- `index.vue`
- `auth.ts`
- `model/*`
- `schemas/*`
- `components/*`

同级目录外的 `basic-main/apps/example/src/views/standard_module_example/list.vue` 则提供了另一种价值：它集中展示了“标准模块”通常需要具备的交互形态，例如：

- 列表高度模式切换
- 表单展示模式切换（router / modal / drawer）
- 搜索、分页、排序、增删改
- 说明区与示例性批量操作区

本次需求不是把 `basic-main` 的整套模块结构迁入当前仓库，而是在现有 `apps/admin` 规范下，创建一个新的演示页，复用现有球员模块的数据与表单能力，体现标准模块交互。

## 范围

包含：

- 新增 `球员标准模块` 菜单与页面。
- 页面顶部保留标准模块说明区。
- 保留“列表高度模式切换”。
- 保留“表单展示模式切换”。
- 搜索、分页、新增、编辑、删除使用当前球员数据能力。
- `modal` 与 `drawer` 两种表单模式真实可用。
- `router` 模式保留切换 UI，但暂不实现真实跳转。
- 保留选择态与批量操作骨架，但不实现真实批量业务动作。

不包含：

- 新增真实的 router 详情页。
- 为该示例页复制一整套 `player` 的 `model/schemas/components`。
- 为未来可替换数据源提前抽象通用 CRUD 引擎。
- 从 `basic-main` 直接复制 `api/modules/*`、`detail.vue` 或其技能产物结构。

## 设计原则

### 演示页与业务页分离

现有 `球员信息` 仍是正式业务页，新建的 `球员标准模块` 是示例页。两者并存，互不替代。

这样做的原因是：

- 正式业务页应保持聚焦，不混入过多演示开关。
- 示例页可以自由展示标准模块的典型形态，而不污染真实业务页。
- 后续如果要替换示例页的数据或整体下线示例页，不会影响正式页面。

### 复用现有业务能力，不复制业务定义

当前示例页使用球员数据只是占位，因此不值得再复制一份球员 schema、表单和映射逻辑。

应复用：

- `@/api/players`
- `@/views/gaoge/player/model/*`
- `@/views/gaoge/player/schemas/*`
- `@/views/gaoge/player/components/PlayerForm.vue`
- `@/views/gaoge/player/auth.ts`
- `@/composables/useListPage`
- `@/composables/useCrudDialog`

这样能保证当前示例页尽快落地，同时避免字段和校验逻辑在两个页面中漂移。

### 借鉴 `fa-crud-page-generator`，但不直接套模板

`basic-main/skills/fa-crud-page-generator/SKILL.md` 的价值在于：

- 它完整列出了 CRUD 标准模块通常需要的文件与功能。
- 它明确区分了 router / modal / drawer 三种详情展示模式。
- 它适合作为“标准模块要包含什么能力”的 checklist。

但它不能在当前仓库里直接照搬，原因是当前仓库的 admin 结构已经收敛到：

- `index.vue`
- `auth.ts`
- `model/*`
- `schemas/*`
- `components/*`
- `composables/*`

因此，这次应当借用它的页面交互思路，而不是采用它输出的 `list.vue + detail.vue + api/modules/*.ts` 结构。

## 页面结构

新页面目录建议为：

```text
apps/admin/src/views/gaoge/player_standard_module/
  index.vue
  components/
    PlayerStandardFormDialog.vue
    PlayerStandardFormDrawer.vue
```

页面入口为：

- 路径：`/gaoge/player-standard`
- 路由名：`playerStandardModule`
- 菜单标题：`球员标准模块`

## 页面职责

### `index.vue`

主页面负责：

- 顶部说明区展示
- 列表高度模式切换
- 表单展示模式切换
- 搜索条件与搜索触发
- 列表数据请求与分页
- 多选状态与批量操作骨架
- 新增、编辑、删除入口
- 根据当前模式打开 dialog 或 drawer
- 在 `router` 模式下给出未启用提示

它不负责：

- 重写球员表单字段
- 重写表单校验
- 重写 payload 映射

### `PlayerStandardFormDialog.vue`

职责：

- 用对话框承载现有 `PlayerForm`
- 根据 `create` / `edit` 初始化表单数据
- 暴露提交事件给页面

### `PlayerStandardFormDrawer.vue`

职责：

- 用抽屉承载现有 `PlayerForm`
- 初始化逻辑与 dialog 保持一致
- 暴露提交事件给页面

## 交互设计

### 顶部说明区

说明区保留标准模块示例页语义，但内容需贴合当前仓库：

- 说明这是一个后台标准 CRUD 模块演示页
- 说明当前数据临时复用球员信息，仅用于页面结构展示
- 说明 `router` 模式当前未启用

### 列表展示模式

保留两个模式：

- 默认模式
- 列表高度自适应模式

该能力只影响页面外层容器与 `FaPageMain` 的布局 class，不改变业务逻辑。

### 表单展示模式

保留三个切换项：

- `router`
- `modal`
- `drawer`

真实行为：

- `modal`：新增/编辑时打开对话框
- `drawer`：新增/编辑时打开抽屉
- `router`：允许切换，但点击新增/编辑时只提示“当前未启用，请切换到对话框或抽屉模式”

这样既保留标准模块的模式演示，又避免为了示例页继续扩展一条真实 router 详情链路。

### 搜索区

搜索区直接复用球员搜索条件：

- 关键词
- 分队
- 位置
- 状态

当前示例页不新增专属搜索条件，避免它开始偏离“临时占位数据”的前提。

### 列表区

列表区复用球员列表字段和格式化逻辑，同时启用多选列。

保留：

- 分页
- loading
- 行级编辑
- 行级删除
- 选择态统计

不保留：

- 为示例页单独设计新的球员字段

### 批量操作区

保留以下骨架：

- 展示当前已勾选数量
- 展示批量按钮，例如“批量删除”“批量导出”

当前按钮可先禁用或只弹出提示，不实现真实批量业务。原因是当前数据只是占位，批量操作语义并不稳定。

## 数据与复用策略

当前示例页临时复用球员能力，但不重新组织一套球员模块副本。

直接复用的内容包括：

- 请求：`playersApi.list/create/update/remove`
- 搜索默认值：`PLAYER_DEFAULT_SEARCH`
- 搜索参数映射：`buildPlayerListParams`
- 表单默认值：`createEmptyPlayerForm`
- 行转表单：`createPlayerFormFromRow`
- 提交参数映射：`buildPlayerPayload`
- 搜索字段：`createPlayerSearchFields`
- 列定义与展示格式化：`PLAYER_TABLE_COLUMNS`、相关格式化函数
- 表单体：`PlayerForm.vue`

## 与 `fa-crud-page-generator` 的关系

该 skill 在本次可用作两个层面的参考：

### 可直接借鉴的部分

- 标准模块应包含搜索、列表、分页、增删改
- 详情展示模式应区分 router / modal / drawer
- 页面应有清晰的列表页与表单承载方式

### 不直接采用的部分

- `list.vue` / `detail.vue` 文件模板
- `api/modules/*.ts` 产物结构
- 为当前仓库新增一套不同于现有 admin 规范的页面目录结构

因此，本次实现不是“调用 skill 生成页面”，而是“按当前仓库结构手工落地一个参考 skill 思路的页面”。

## 文件清单

新增：

```text
apps/admin/src/views/gaoge/player_standard_module/index.vue
apps/admin/src/views/gaoge/player_standard_module/components/PlayerStandardFormDialog.vue
apps/admin/src/views/gaoge/player_standard_module/components/PlayerStandardFormDrawer.vue
```

修改：

```text
apps/admin/src/router/modules/gaoge/index.ts
```

复用但不重建：

```text
apps/admin/src/views/gaoge/player/auth.ts
apps/admin/src/views/gaoge/player/model/*
apps/admin/src/views/gaoge/player/schemas/*
apps/admin/src/views/gaoge/player/components/PlayerForm.vue
apps/admin/src/api/players/index.ts
apps/admin/src/composables/useListPage.ts
apps/admin/src/composables/useCrudDialog.ts
```

## 风险与边界

### 风险 1：示例页和正式业务页过度耦合

由于当前直接复用球员 schema 和表单，后续如果球员字段大改，示例页也会跟着变化。

这是当前可接受的，因为用户已经明确球员数据只是占位，示例页未来会整体替换，不值得为此提前抽象。

### 风险 2：用户误以为 router 模式可用

为避免误解，页面文案和操作提示必须明确写出 router 模式未启用。

### 风险 3：批量操作被误认为真实能力

批量按钮如果仅做骨架，必须使用禁用态或明确提示，避免造成“功能损坏”的误解。

## 最终结论

本次应新增一个 `球员标准模块` 演示页，复用球员数据和表单作为临时占位，在当前 admin 目录规范内实现标准模块示例交互。

`fa-crud-page-generator` 可以作为功能 checklist 和交互参考，但不应作为当前仓库的直接生成模板。当前仓库应继续坚持既有的 admin CRUD 目录结构，由新页面只承接“标准模块演示”这一层职责。
