# Admin CRUD 页面结构设计

日期：2026-04-27

## 目标

为 `apps/admin` 内的增删改查页面定义一套统一的前端结构，并以 `player` 页面作为第一个具体落地样例。

本设计只面向 admin 项目，不尝试抽象为 `web` 或 `miniapp` 可共用的跨应用方案。

## 为什么要做这件事

当前 `player` 页面已经开始把页面编排和部分业务细节拆开，但仍有两个明显问题：

- 页面级职责拆分还不稳定。搜索配置、表格配置、表单默认值工厂、行数据到表单数据的映射仍混在 `constants.ts` 里。
- 新增/编辑弹窗仍是一个混合型业务组件，同时承担弹窗壳、表单渲染、校验和 payload 组装。

如果后续其他模块照着现在的写法继续复制，admin 项目会逐渐出现一批结构相似但边界不一致的 CRUD 页面。那样后面再抽象，只会更难，不会更容易。

## 范围

包含：

- 定义 admin CRUD 页面的标准目录结构。
- 定义业务表单组件和弹窗组件的命名规则。
- 定义哪些职责应放入 `schemas`、`model`、`components` 和页面编排层。
- 定义一个轻量级、可复用的 CRUD 页面行为层。
- 定义哪些通用组件现在应该做，哪些现在不应该做。

不包含：

- 构建一个完全 schema 驱动的 `CrudPage` 渲染器。
- 构建一个与 `EsSearch` 对应的通用表单渲染器。
- 定义 `web` 或 `miniapp` 的跨端抽象。
- 在这一轮里重构所有 admin 页面。

## 设计原则

### 复用行为，不复用业务形状

admin 后台的 CRUD 页面，共性更稳定的是行为，而不是字段结构。搜索、分页、弹窗开关、提交 loading、提交后刷新，这些是稳定模式；表格列、表单布局、校验规则、字段交互，则更偏业务差异。

因此，本设计优先标准化页面编排方式和目录边界，同时把业务 schema 和业务表单 UI 继续保留在各自模块内部。

### 优先保证边界清晰，而不是最大可配置

目标不是做一个低代码引擎，而是让下一个 admin CRUD 页面更容易新增、更容易理解、更容易演进。

这意味着：

- `index.vue` 负责组装页面，而不是把所有细节都写在里面。
- 配置文件保持声明式。
- 映射逻辑单独隔离，而不是藏在常量文件里。
- 通用组件保持轻、薄、可预测。

### 只为 admin 项目优化

这套结构可以直接贴着 `apps/admin` 现有约定、Vue 3 和 Element Plus 来做，不需要为了兼容其他前端运行时而保留额外抽象层。

## 标准模块结构

每个 admin CRUD 模块应采用如下结构：

```text
views/<domain>/<module>/
  index.vue
  components/
    <Entity>Form.vue
    <Entity>FormDialog.vue
  schemas/
    search.ts
    table.ts
    form.ts
  model/
    types.ts
    mapper.ts
  services/
    options.ts
  auth.ts
  formatters.ts
```

以 `player` 为例：

```text
views/gaoge/player/
  index.vue
  components/
    PlayerForm.vue
    PlayerFormDialog.vue
  schemas/
    search.ts
    table.ts
    form.ts
  model/
    types.ts
    mapper.ts
  services/
    options.ts
  auth.ts
  formatters.ts
```

## 目录职责

### `index.vue`

`index.vue` 是页面装配层，负责协调页面状态、串联 API 调用、连接通用组件，并渲染页面级插槽。

它应该持有：

- `search`
- `page`
- `pageSize`
- `tableData`
- `total`
- `loading`
- `submitLoading`
- `dialogVisible`
- `dialogMode`
- `currentRow`

它应该负责：

- 列表请求
- 删除动作
- 创建或更新提交
- 权限拦截

它不应该直接定义：

- 大段字段 schema
- 表格列数组
- 表单默认值工厂
- 行数据到表单数据或表单数据到 payload 的转换逻辑

### `components/`

`<Entity>Form.vue` 是业务表单体。

职责：

- 渲染表单项
- 持有与字段强耦合的校验规则
- 对外暴露或发出校验后的表单数据
- 接收业务选项数据作为 props

`<Entity>FormDialog.vue` 是业务弹窗容器。

职责：

- 维护弹窗标题
- 连接打开/关闭状态
- 承接提交按钮区域
- 连接 loading 状态
- 组合通用弹窗壳与 `<Entity>Form.vue`

这样拆分后，业务表单不再绑定到某一种承载形式。如果后续要从弹窗切成抽屉或整页编辑，表单体可以直接复用。

### `schemas/`

这个目录只放声明式配置。

`search.ts`：

- 搜索默认值
- 搜索字段配置工厂

`table.ts`：

- 表格列配置

`form.ts`：

- 表单默认值
- 静态字段选项常量
- 必要时放表单自己的声明式元数据

`schemas/*` 不应包含 API 调用、可变页面状态，或行数据到 payload 的转换逻辑。

### `model/`

这个目录用于隔离页面级业务数据转换。

`types.ts`：

- 不适合放入共享包的页面内部类型

`mapper.ts`：

- `createEmptyForm()`
- `createFormFromRow()`
- `buildPayload()`
- 字段归一化辅助函数

如果某个模块暂时不需要单独的 `types.ts`，可以省略；但只要映射逻辑不再是非常简单的直传，`mapper.ts` 就应该存在。

### `services/`

这个目录放页面局部服务辅助逻辑，而不是主 REST API 客户端。

典型场景包括：

- 下拉选项准备
- 字典归一化
- 远程选项加载

`services/options.ts` 是 CRUD 页面对动态选项数据的默认起点。如果某个模块暂时没有这类逻辑，这个目录可以先不创建。

### `auth.ts`

这个文件用于定义模块内的权限常量和辅助函数，例如 `usePlayerAuth()`。

权限命名和可见性判断应尽量贴近业务模块，而不是继续堆进通用的用户 store API 里。

### `formatters.ts`

这个文件只放展示逻辑：

- 标签文案映射
- tag type 映射
- 日期格式化
- 其他展示辅助函数

它不应承载表单归一化或 API payload 拼装逻辑。

## 命名规则

### 业务组件

业务组件采用显式业务命名：

- `PlayerForm.vue`
- `PlayerFormDialog.vue`

这比继续把所有内容都塞进一个 `PlayerFormDialog.vue` 更合适。

原因是：

- `PlayerForm.vue` 表达的是业务内容。
- `PlayerFormDialog.vue` 表达的是业务内容加具体承载方式。

这样后续如果承载方式变化，命名和结构都还能成立。

### 通用组件

现有通用组件在当前阶段可以暂时保留现名：

- `EsSearch`
- `EsTable`

它们已经有足够多的引用，现阶段立刻全局改名，只会增加迁移成本，但不会带来足够大的架构收益。

不过在设计层面，应正式把它们视为 admin CRUD 的基础组件，而不是临时工具组件。未来如果要统一更名，方向应收敛到“角色命名”，例如：

- `CrudSearch` 或 `AdminSearchForm`
- `CrudTable` 或 `AdminDataTable`

这个重命名动作暂时延后，等 CRUD 模式在多个模块上稳定后再统一处理。

## 通用组件策略

### 保留 `EsSearch`

`EsSearch` 继续作为 admin CRUD 页面的标准查询区域渲染组件。

它适合作为通用组件的原因：

- 搜索字段相对扁平
- 交互模式统一
- 布局相对稳定
- 字段差异可以通过 schema 承载

### 保留 `EsTable`

`EsTable` 继续作为 admin CRUD 页面的标准表格与分页渲染组件。

它适合作为通用组件的原因：

- 列渲染和分页是稳定职责
- 业务差异自然可以落在插槽中处理

### 增加一个很薄的弹窗表单壳

增加一个轻量的通用弹窗壳，命名可选：

- `EsFormDialogShell`
- 或 `EsDialogForm`

推荐职责：

- 统一标题区
- 统一 footer 按钮
- 统一确认/取消交互
- 统一 loading 绑定
- 统一 `modelValue` 绑定
- 提供表单内容插槽

这个组件不应知道业务字段、校验规则或 payload 结构。

### 暂不增加通用 `EsForm`

这一阶段不应直接构建一个完整的 schema 驱动表单渲染器。

原因是：

- 业务编辑表单的差异远大于搜索表单
- 校验和字段耦合更强
- 字段联动更多
- 自定义布局需求更高

现在如果直接做一个通用 admin 表单渲染器，很容易过拟合 `player` 页面，并拖慢后续真正有特例的业务模块。

因此当前最合适的边界是：

- 通用查询渲染器
- 通用表格渲染器
- 通用弹窗壳
- 每个模块自己的业务表单体

## 轻量 CRUD 行为层

admin CRUD 页面应共享一层很薄的行为抽象，优先以 composable 形式存在，例如 `useCrudPage` 或 `useCrudListPage`。

这个 composable 只复用列表页流程，不接管完整业务定义。

推荐职责：

- 持有 `page`、`pageSize`、`loading`、`submitLoading`
- 持有 `dialogVisible`、`dialogMode`、`currentRow`
- 暴露 `handleSearch`
- 暴露 `handlePaginationChange`
- 暴露 `openCreate`
- 暴露 `openEdit`
- 暴露提交成功后的刷新流程
- 必要时暴露删除后空页自动回退逻辑

它不应负责：

- 搜索 schema
- 表格列定义
- 业务表单 schema
- API payload 结构
- 权限规则

这样可以把抽象稳定在“页面工作流”这一层，而不是过早把业务细节也推进通用层。

## Player 页面重构方向

`player` 页面应从：

- 一个大而杂的 `constants.ts`
- 一个混合型的 `PlayerFormDialog.vue`

演进为：

- `schemas/search.ts`
- `schemas/table.ts`
- `schemas/form.ts`
- `model/mapper.ts`
- `components/PlayerForm.vue`
- `components/PlayerFormDialog.vue`

具体迁移建议如下。

### 拆分搜索定义

把以下内容移入 `schemas/search.ts`：

- `PlayerSearch`
- `PLAYER_DEFAULT_SEARCH`
- `createPlayerSearchFields()`

### 拆分表格定义

把以下内容移入 `schemas/table.ts`：

- `PLAYER_TABLE_COLUMNS`

### 拆分表单默认值和静态选项

把以下内容移入 `schemas/form.ts`：

- `PLAYER_STATUS_OPTIONS`
- 表单默认值

### 拆分映射逻辑

把以下内容移入 `model/mapper.ts`：

- `createEmptyPlayerForm()`
- `createPlayerFormFromRow()`
- payload 归一化逻辑

payload 构建逻辑不应再继续留在弹窗组件中。

### 拆分表单与弹窗

新增：

- `components/PlayerForm.vue`
- `components/PlayerFormDialog.vue`

`PlayerForm.vue` 负责渲染实际表单并输出校验后的表单数据。

`PlayerFormDialog.vue` 负责承接弹窗壳相关职责，并把最终 `submit` 事件抛给页面。

## 预期收益

对开发者来说：

- 更快理解每个 CRUD 模块结构
- 降低页面逻辑重新塌回 `index.vue` 的概率
- 更清晰地划分 search、table、form 的职责
- 为后续抽取共享 CRUD 行为 composable 打下稳定基础

对代码库来说：

- 降低随手式 CRUD 结构复制
- 避免过早引入过重的 schema 引擎
- 为 admin 后台形成可扩展的一致模式

## 取舍说明

### 为什么不直接做完整 `CrudPage`

因为那会把尚未稳定的业务差异硬塞进统一接口，表面上提升生成速度，实际上会损害可读性和可维护性。

### 为什么要增加文件数

当前问题不是文件太多，而是单个文件承担了过多职责。拆分后的收益来自“每个文件只有更明确的变化原因”，而不是“文件越少越好”。

### 为什么暂缓重命名 `EsSearch` 和 `EsTable`

因为改名带来的主要收益是语义清晰，而不是行为改进。这个收益存在，但还不足以支撑当前阶段做一次全局迁移。

## 实施建议

后续 implementation plan 应以 `player` 页面为第一落地点，把它作为 admin CRUD 的参考模块。

推荐顺序：

1. 把 `player/constants.ts` 拆分到 `schemas/*` 和 `model/mapper.ts`。
2. 从 `PlayerFormDialog.vue` 中抽出 `PlayerForm.vue`。
3. 如果拆分过程中已经暴露出明显重复的标题区和 footer 区，再补一个很薄的通用弹窗壳。
4. 等结构拆稳后，再评估是否把 player 页的状态流下沉到 `useCrudPage` composable。

这一轮 implementation plan 不应试图一次性解决所有 admin CRUD 页面。

## 最终决策

为 `apps/admin` 采用一套标准 CRUD 模块结构，核心由以下部分组成：

- `index.vue` 负责页面装配
- `schemas/*` 负责声明式配置
- `model/*` 负责数据映射
- 业务表单体与业务弹窗容器分离
- 通用基础组件保持轻量
- 视情况补一层轻量 CRUD 页面行为 composable

这是当前阶段的最优解，因为它能在不提前过度抽象的前提下，提高 `apps/admin` 的一致性、扩展性和后续复用质量。
