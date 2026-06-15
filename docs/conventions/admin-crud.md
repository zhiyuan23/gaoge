# Admin CRUD 开发规范

本规范只面向 `apps/admin`，用于统一后台 CRUD 页面实现方式。

同时，它也是 AI 在 `apps/admin` 下处理标准增删改查需求时的默认执行约束。除非需求明确要求例外，否则新增页面、迁移页面和结构整理都应优先遵循本规范。

## 适用范围

适用于后台通用列表页与增删改查页面，例如：

- 球员信息
- 球队信息
- 资产信息
- 比赛信息
- 系统管理下的标准列表页

不适用于：

- 强交互仪表盘
- 高度定制的可视化页面
- 与标准筛选列表结构明显不同的流程页

## 默认组件约定

对标准 CRUD 列表页，默认优先使用以下组件和模式：

- 查询区域：`EsSearch`
- 表格与分页区域：`EsTable`
- 页面工具栏：`EsListToolbar`
- 新增/编辑行为：现有 `useCrudDialog`、业务表单组件和弹窗组件拆分模式

没有明确理由时，不要绕开这些组件重新手写一套筛选区和表格骨架。

## AI 默认执行策略

当需求属于标准后台 CRUD 页面时，AI 应默认做出以下判断，而不是重新发明页面结构：

- 列表页骨架优先使用 `useListPage + EsSearch + EsTable + EsListToolbar`
- 新增/编辑交互优先使用 `useCrudDialog + <Entity>Form.vue + <Entity>FormDialog.vue`
- 查询项、表格列、表单 schema、类型与 mapper 优先拆到模块内独立文件
- 权限常量优先集中放在 `auth.ts`，不要在 `index.vue` 或模板里散落硬编码权限字符串
- 新模块优先对齐同类已有页面，例如 `sports/football/player`、`sports/football/team`、`sports/football/asset-record`、`system/user`

如果只是补一个标准筛选项、列、表单字段或批量动作，优先在现有模块结构内增量修改，不把简单需求扩写成新的页面框架。

## 使用原则

### `EsSearch`

- 作为 admin CRUD 页面的标准查询区域渲染组件
- 页面负责提供字段配置、默认值、查询触发和参数归一化
- `EsSearch` 只负责表单渲染、交互和事件发出，不承担列表请求职责

### `EsTable`

- 作为 admin CRUD 页面的标准表格与分页渲染组件
- 页面负责提供列配置、数据源、分页状态、loading 和事件处理
- 展示差异优先通过列配置和插槽解决，不先复制新的表格壳组件

## 页面结构约定

标准 CRUD 模块优先采用既有结构：

```text
views/<aggregate>/<domain>/<module>/
  index.vue
  auth.ts
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
  formatters.ts
```

默认要求：

- 当页面要先归到聚合业务菜单下时，先落一层 `<aggregate>`，例如 `views/sports/football/player`、`views/sports/content/banner`
- `index.vue` 必须保留为页面装配层，负责拼接列表请求、搜索状态、表格交互、弹窗开关和权限
- `components/` 放表单体、表单弹窗和页面私有子组件，不把复杂表单直接堆回 `index.vue`
- `schemas/` 放 `search.ts`、`table.ts`、`form.ts` 这类声明式配置
- `model/` 放 `types.ts`、`mapper.ts`、`defaults.ts` 等页面模型代码
- `auth.ts` 放页面权限点常量和局部权限辅助
- `services/` 与 `formatters.ts` 按需保留，只有页面确实存在远程 options、格式转换或局部服务逻辑时再增加

如现阶段模块足够简单，可少量裁剪可选文件，但不要省掉 `index.vue / auth.ts / components / model / schemas` 这一层基本分工，更不要把页面编排、schema、mapper 和表单细节重新混回一个大文件。

## 页面职责拆分

### `index.vue`

- 负责页面装配，不负责承载大段字段配置和 mapper 细节
- 负责调用列表 API、维护分页、处理搜索提交和重置
- 负责打开新增/编辑弹窗，处理提交成功后的刷新

### `schemas/*`

- `search.ts` 负责 `EsSearch` 字段声明
- `table.ts` 负责 `EsTable` 列声明
- `form.ts` 负责表单字段声明、下拉选项辅助或表单项工厂

### `model/*`

- `types.ts` 放页面内部类型、表单模型、搜索模型
- `mapper.ts` 放接口数据与页面模型之间的转换
- `defaults.ts` 放默认值、枚举选项或局部初始状态

### `components/*`

- `<Entity>Form.vue` 负责表单内容与校验
- `<Entity>FormDialog.vue` 负责对话框容器、标题、提交按钮和 loading

## 禁止行为

对标准 CRUD 页面，没有明确理由时不要这样做：

- 不使用 `EsSearch`，转而在页面里手写一套查询表单
- 不使用 `EsTable`，转而复制或拼装另一套列表与分页骨架
- 把查询 schema、表格列、表单 schema、mapper、权限判断全部塞进 `index.vue`
- 在模板或脚本中硬编码权限字符串，而不是通过 `auth.ts` 统一导出
- 为单个页面临时创造一套与现有模块不兼容的目录结构

## 新增页面落地顺序

当 AI 需要新增一个标准 CRUD 页面时，默认按以下顺序组织实现：

1. 先参考同业务域下最接近的现有模块目录
2. 创建 `index.vue`、`auth.ts`、`components/`、`model/`、`schemas/`
3. 先接好 `EsSearch`、`EsTable`、`EsListToolbar` 和 `useListPage`
4. 再补 `Form`、`FormDialog` 和 `useCrudDialog`
5. 最后按业务复杂度决定是否增加 `services/`、`formatters.ts`、`constants.ts`

如果需求只是补充标准 CRUD 能力，不要跳过前面的页面骨架约定，直接从零散文件拼装。

## 例外条件

只有在以下场景之一成立时，才考虑不使用 `EsSearch` 或 `EsTable`：

- 页面不是标准 CRUD 列表形态
- 现有组件能力确实无法承载，并且扩展成本高于替换成本
- 产品交互明确要求与 admin 标准列表模式不同

做例外时，应在实现说明或设计文档中写清原因，避免后续页面继续无序分叉。

## 参考

- [docs/superpowers/specs/2026-04-25-es-search-player-list-design.md](../superpowers/specs/2026-04-25-es-search-player-list-design.md)
- [docs/superpowers/specs/2026-04-27-admin-crud-page-structure-design.md](../superpowers/specs/2026-04-27-admin-crud-page-structure-design.md)
