# Admin 页面开发规范

本规范只面向 `apps/admin`，用于统一页面装配层、权限接入和常见页面模式。

AI 在处理 `apps/admin/src/views/*` 下的页面需求时，应先判断是否属于标准 CRUD 列表页；如果是，优先直接套用 [admin-crud.md](./admin-crud.md) 的组件和目录约定，而不是重新设计页面骨架。

## 适用范围

适用于 `apps/admin/src/views/*` 下的大多数业务页面。

其中标准 CRUD 列表页的细化要求，继续以 [admin-crud.md](./admin-crud.md) 为准。

## 页面装配原则

- `index.vue` 作为页面装配层，负责拼接 API、状态、权限和通用组件
- schema、mapper、格式化和表单细节下沉到模块内部文件
- 页面优先复用既有 composable 和组件，不轻易重新发明页面骨架

## 推荐目录结构

页面优先采用如下结构：

```text
views/<domain>/<module>/
  index.vue
  components/
  schemas/
  model/
  services/
  auth.ts
  formatters.ts
```

规则：

- `schemas/*` 放声明式配置
- `model/*` 放页面内部类型和 mapper
- `services/*` 放本页面局部服务辅助，例如远程 options
- `auth.ts` 放权限常量和模块内权限辅助
- 标准 CRUD 页面默认还应包含表单组件拆分，例如 `components/<Entity>Form.vue` 与 `components/<Entity>FormDialog.vue`

## 查询列表模式

对标准列表页，默认优先使用：

- `useListPage`
- `EsSearch`
- `EsTable`
- `EsListToolbar`

页面负责：

- 列表请求
- 搜索参数归一化
- 分页和刷新
- 行级动作处理

通用组件负责：

- 查询区渲染
- 表格和分页渲染
- 工具栏承载

## 新增编辑模式

对标准新增/编辑行为，默认优先使用：

- `useCrudDialog`
- `<Entity>Form.vue`
- `<Entity>FormDialog.vue`

规则：

- 表单体负责字段渲染和校验
- Dialog 负责标题、开关、提交区域和 loading
- 页面负责创建/更新请求与成功后的刷新

## 权限接入

- 页面级权限常量集中放在 `auth.ts`
- 模板内通过 `v-auth` 使用权限，而不是散落硬编码权限字符串
- 若某个页面需要复杂权限组合，应在 `auth.ts` 或页面脚本内集中表达，不要把判断逻辑塞进模板

## 路由与模块边界

- 路由模块按业务域拆分到 `src/router/modules/*`
- 页面目录优先按业务域组织，而不是按组件类型组织
- 一个页面模块只关心自己的 API、schema 和视图装配，不横向读取别的页面内部实现

## 例外条件

以下场景可以不完全套用本规范：

- 高度定制的大屏、仪表盘或富交互页面
- 第三方复杂组件主导的页面
- 需要实验性验证的新页面模式

做例外时，应保证页面边界仍然清晰，并在设计文档或实现说明中写清原因。
