# Admin CRUD 开发规范

本规范只面向 `apps/admin`，用于统一后台 CRUD 页面实现方式。

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

如现阶段模块足够简单，可少量裁剪，但不要把页面编排、schema、mapper 和表单细节重新混回一个大文件。

## 例外条件

只有在以下场景之一成立时，才考虑不使用 `EsSearch` 或 `EsTable`：

- 页面不是标准 CRUD 列表形态
- 现有组件能力确实无法承载，并且扩展成本高于替换成本
- 产品交互明确要求与 admin 标准列表模式不同

做例外时，应在实现说明或设计文档中写清原因，避免后续页面继续无序分叉。

## 参考

- [docs/superpowers/specs/2026-04-25-es-search-player-list-design.md](../superpowers/specs/2026-04-25-es-search-player-list-design.md)
- [docs/superpowers/specs/2026-04-27-admin-crud-page-structure-design.md](../superpowers/specs/2026-04-27-admin-crud-page-structure-design.md)
