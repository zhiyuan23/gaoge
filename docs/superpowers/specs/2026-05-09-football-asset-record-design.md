# 高歌FC资产信息模块设计

## 背景

当前仓库已经在 `football` 领域中落地了球员、球队、比赛等模块：

- 后端模块位于 `apps/api/src/modules/football/*`
- 管理端页面位于 `apps/admin/src/views/football/*`
- 高歌FC菜单入口位于 `apps/admin/src/router/modules/football/index.ts`

目前仓库中虽然已有一个 `TeamFund` 表和 `fund` 模块，但它更接近通用资金流水，不能准确承载当前业务需要的“每场固定收费、个别场次免收、额外收入、装备支出、自动汇总”这类球队资产记录场景。

当前实际业务口径已经明确：

- 常规收入为每场 `20` 元
- 个别场次可能免收
- 需要预留额外收入项
- 支出按单条记录，金额不固定，主要用于球队装备采购
- 系统需要记录每条收支明细，并展示总收入、总支出、剩余金额

管理端落地时，需要尽量复用现有球员信息页的通用 CRUD 结构和交互方式，不额外发明新的页面模式。

## 目标

- 在高歌FC子菜单下新增 `资产信息` 页面
- 在后端新增独立的资产收支模块，不继续扩展现有 `fund` 粗流水模块
- 支持资产收支记录的新增、列表、编辑、删除
- 支持顶部汇总信息展示：
  - 总收入
  - 总支出
  - 当前结余
  - 免收场次
- 支持收入和支出统一流水管理，并允许按条件筛选
- 管理端交互方式与球员信息页保持一致：
  - `EsSearch`
  - `EsListToolbar`
  - `EsTable`
  - 弹窗新增/编辑
  - 删除二次确认

## 非目标

- 本期不做 Excel 导入导出
- 本期不做资产账户、多钱包、多币种能力
- 本期不与 `match-round` 建立严格数据库外键
- 本期不重构既有 `fund` 模块，也不迁移旧数据
- 本期不做前台小程序或 Web 端资产展示

## 方案对比

### 方案一：继续扩展现有 `TeamFund`

做法：

- 在现有 `TeamFund` 表和 `fund` 模块上继续增加资产字段
- 通过新增 `seasonLabel`、`matchLabel`、`isWaived` 等字段适配新需求

优点：

- 初始改动最小
- 复用已有控制器、服务和 Prisma 模型

缺点：

- 现有表语义已经偏“通用资金流水”，继续堆字段会让模型越来越混乱
- 资产业务规则会和旧资金记录逻辑混在一起
- 后续做资产统计、筛选和前端联动时边界不清楚

### 方案二：新建独立资产模块

做法：

- 在 `football` 领域下新增独立资产模型与 CRUD 模块
- 保留旧 `fund` 模块不动
- 管理端新增 `资产信息` 页面，完全复用现有 CRUD 页面骨架

优点：

- 资产业务边界清晰
- 数据模型能直接按真实业务设计
- 后续扩展赛季筛选、统计口径和页面展示更稳定

缺点：

- 需要新增一套 Prisma 模型、Nest 模块和 admin 页面

### 方案三：赛事主表 + 收支明细子表

做法：

- 以赛季或赛事作为主表
- 每个赛事下挂多条收入和支出明细

优点：

- 适合强赛事台账型系统

缺点：

- 当前业务已经明确核心是“收支流水 + 汇总”，赛事仅作为辅助标签
- 建模偏重，会给新增、编辑和筛选增加不必要复杂度

## 结论

采用方案二：新增独立资产模块。

具体原则：

- 资产信息使用单表流水模型
- 赛季和场次先使用文本标签预留，不与比赛表做强关联
- 旧 `fund` 模块保持不动，避免混淆旧逻辑和新业务
- admin 页面完全复用球员信息页的 CRUD 结构，只在搜索区下方增加汇总卡片

## 信息架构

### 菜单与路由

在 `高歌FC` 子菜单下新增一个二级页面：

- 路径：`/football/asset-record`
- 路由名：`assetRecord`
- 标题：`资产信息`

其层级与以下页面并列：

- `球员信息`
- `球队信息`
- `比赛信息`

### 代码目录

后端目录：

- `apps/api/src/modules/football/asset-record/asset-record.module.ts`
- `apps/api/src/modules/football/asset-record/asset-record.controller.ts`
- `apps/api/src/modules/football/asset-record/asset-record.service.ts`
- `apps/api/src/modules/football/asset-record/dto/create-asset-record.dto.ts`
- `apps/api/src/modules/football/asset-record/dto/update-asset-record.dto.ts`
- `apps/api/src/modules/football/asset-record/dto/asset-record-list.dto.ts`

管理端目录：

- `apps/admin/src/api/football/asset-record/index.ts`
- `apps/admin/src/views/football/asset_record/index.vue`
- `apps/admin/src/views/football/asset_record/auth.ts`
- `apps/admin/src/views/football/asset_record/components/AssetRecordForm.vue`
- `apps/admin/src/views/football/asset_record/components/AssetRecordFormDialog.vue`
- `apps/admin/src/views/football/asset_record/model/defaults.ts`
- `apps/admin/src/views/football/asset_record/model/types.ts`
- `apps/admin/src/views/football/asset_record/model/mapper.ts`
- `apps/admin/src/views/football/asset_record/schemas/search.ts`
- `apps/admin/src/views/football/asset_record/schemas/form.ts`
- `apps/admin/src/views/football/asset_record/schemas/table.ts`

## 数据模型设计

### Prisma 模型

新增模型：`FootballAssetRecord`

字段：

- `id: Int`
- `direction: String`
  - `income`
  - `expense`
- `recordType: String`
  - 收入：
    - `match_fee`
    - `extra_income`
  - 支出：
    - `equipment`
    - `activity`
    - `other_expense`
- `amount: Int`
  - 单位为分
  - 使用整数存储
- `seasonLabel: String?`
  - 赛季文本标签
  - 示例：`26赛季春季赛`
- `matchLabel: String?`
  - 场次文本标签
  - 示例：`第1场`
- `isWaived: Boolean`
  - 默认 `false`
  - 仅比赛收费收入场景使用
- `title: String`
  - 示例：`春季赛场费`
  - 示例：`购买足球`
- `description: String?`
- `recordDate: DateTime`
- `status: String`
  - `confirmed`
  - `cancelled`
- `creatorId: Int?`
- `createdAt: DateTime`
- `updatedAt: DateTime`

建议索引：

- `@@index([direction])`
- `@@index([recordType])`
- `@@index([recordDate])`
- `@@index([status])`
- `@@index([seasonLabel])`
- `@@index([matchLabel])`

### 数据约束

后端服务层需要保证以下规则：

- `direction=income` 时，`recordType` 只能是 `match_fee` 或 `extra_income`
- `direction=expense` 时，`recordType` 只能是 `equipment`、`activity`、`other_expense`
- `isWaived=true` 时：
  - `direction` 必须是 `income`
  - `recordType` 必须是 `match_fee`
  - `amount` 必须为 `0`
- 非免收记录：
  - `amount` 必须大于 `0`
- 汇总统计只计算 `status=confirmed` 的记录

### 为什么不做强关联

本期不把 `seasonLabel` 和 `matchLabel` 建成外键，原因如下：

- 当前业务已经明确只需要文本标签即可支撑管理
- `match-round` 当前是比赛轮次结果管理，不是资产主数据来源
- 如果现在强绑比赛表，会让“额外收入”“非比赛支出”这些记录变得别扭
- 未来如果需要和比赛模块打通，可以新增可选外键，而不是在本期过度设计

## 接口设计

### 路由

统一使用资源集合语义，采用复数路径：

- `GET /football/asset-records`
- `GET /football/asset-records/summary`
- `GET /football/asset-records/:id`
- `POST /football/asset-records`
- `PATCH /football/asset-records/:id`
- `DELETE /football/asset-records/:id`

### 列表查询参数

- `page`
- `pageSize`
- `keyword`
  - 匹配 `title` / `description`
- `direction`
- `recordType`
- `seasonLabel`
- `status`
- `startDate`
- `endDate`

列表返回结构与 `player/team/match-round` 模块保持一致：

- `list`
- `total`

### 列表项返回字段

每条记录直接返回以下字段：

- `id`
- `direction`
- `recordType`
- `amount`
- `seasonLabel`
- `matchLabel`
- `isWaived`
- `title`
- `description`
- `recordDate`
- `status`
- `createdAt`
- `updatedAt`

不做额外嵌套，避免增加前端映射复杂度。

### 汇总接口返回

- `totalIncome`
- `totalExpense`
- `balance`
- `waivedMatchCount`

其中：

- `totalIncome` 为所有 `confirmed` 收入总额
- `totalExpense` 为所有 `confirmed` 支出总额
- `balance = totalIncome - totalExpense`
- `waivedMatchCount` 为所有 `confirmed` 且 `isWaived=true` 的记录数量

## 管理端页面设计

### 页面结构

页面组织方式与球员信息页一致，按以下顺序展开：

1. `EsSearch`
2. 汇总卡片区域
3. `EsListToolbar`
4. `EsTable`
5. `AssetRecordFormDialog`

差异仅在于资产页比球员页多一排汇总卡片，不改变 CRUD 主流程。

### 搜索区域

建议搜索项：

- `keyword`
- `direction`
- `recordType`
- `seasonLabel`
- `status`
- `dateRange`

行为要求：

- 继续使用 `useListPage`
- 搜索参数通过 `model/mapper.ts` 转成接口参数
- 重置行为与球员信息页一致

### 汇总卡片

在搜索区下方增加 4 个汇总卡片：

- 总收入
- 总支出
- 当前结余
- 免收场次

要求：

- 页面首次加载时请求
- 列表筛选变化时不联动改变全局汇总
- 新增、编辑、删除成功后重新请求汇总

本期汇总卡片展示的是全局已确认汇总，而不是“当前筛选结果汇总”，这样口径更稳定，也更符合总账认知。

### 工具栏

工具栏继续使用 `EsListToolbar`。

动作按钮：

- `新增收入`
- `新增支出`

这两个按钮都打开同一个表单弹窗，只是默认传入不同 `direction`。

### 表格列

建议列结构：

- `记录日期`
- `方向`
- `类型`
- `金额`
- `赛季标签`
- `场次标签`
- `状态`
- `标题`
- `备注`
- `创建时间`
- `更新时间`
- `操作`

展示规则：

- 收入金额显示为 `+`
- 支出金额显示为 `-`
- 免收记录金额固定显示 `¥0.00`
- 方向、类型、状态需要通过 schema 映射成中文标签

### 新增与编辑弹窗

仍然采用和球员页一致的“表单组件 + Dialog 容器组件”拆分方式。

公共字段：

- `direction`
- `recordType`
- `amount`
- `recordDate`
- `seasonLabel`
- `matchLabel`
- `title`
- `description`
- `status`

条件字段：

- `isWaived`
  - 仅当 `direction=income` 且 `recordType=match_fee` 时显示

联动规则：

- 选择 `income` 时，类型选项只显示：
  - `比赛收费`
  - `额外收入`
- 选择 `expense` 时，类型选项只显示：
  - `球队装备`
  - `活动支出`
  - `其他支出`
- 勾选 `isWaived` 后：
  - `amount` 自动置 `0`
  - 金额输入框禁用
- 切换为非 `match_fee` 时：
  - 自动隐藏 `isWaived`
  - 自动重置 `isWaived=false`

### 删除交互

删除交互与球员信息页保持一致：

- 点击删除
- 弹出确认框
- 删除成功后提示
- 刷新列表与汇总

## 权限设计

新增权限码：

- `football.assetRecord.view`
- `football.assetRecord.create`
- `football.assetRecord.update`
- `football.assetRecord.delete`

页面路由需要绑定 `view` 权限，按钮动作继续通过 `v-auth` 控制。

命名风格与现有球员模块保持一致，避免引入新的权限命名体系。

## 校验规则

### 后端 DTO 基础校验

- `direction` 必填，且只能是允许值
- `recordType` 必填，且只能是允许值
- `recordDate` 必填
- `title` 必填
- `amount` 必须是整数

### 后端服务层业务校验

DTO 只做基础格式校验，以下规则应由 service 保证：

- 方向与类型组合必须合法
- 免收记录必须满足 `income + match_fee + amount=0`
- 非免收记录金额必须大于 `0`

这样可以避免把条件耦合逻辑全部塞进 DTO 装饰器，保持实现清晰。

### 前端表单校验

- `direction` 必填
- `recordType` 必填
- `recordDate` 必填
- `title` 必填
- 非免收时 `amount > 0`
- 免收时 `amount = 0`

前端主要用于快速反馈，最终以服务端校验为准。

## 测试与验证

### 后端

至少补充以下测试：

- service 汇总统计：
  - 只统计 `confirmed`
  - 正确计算收入、支出、结余
  - 正确计算免收场次
- service 业务校验：
  - 非法方向与类型组合被拒绝
  - 免收但金额不为 `0` 被拒绝
  - 非免收但金额不大于 `0` 被拒绝

### 前端

至少完成以下人工验证：

- 资产信息菜单可见且路由正常
- 列表筛选、分页、重置可用
- 新增收入成功
- 新增支出成功
- 新增免收记录成功
- 编辑记录后列表和汇总同步更新
- 删除记录后列表和汇总同步更新
- 按权限控制按钮可见性与操作可用性

## 实施边界

本期只实现一个稳定的管理闭环：

- Prisma 模型与迁移
- Nest CRUD 与汇总接口
- admin 列表页、汇总卡片、弹窗新增编辑、删除
- 基本测试与人工验证

明确不在本期扩展：

- 批量导入
- 文件附件
- 对账状态流转
- 按筛选条件动态汇总卡片
- 与比赛轮次的真实关联

## 后续演进方向

如果资产信息后续继续扩展，建议按以下顺序演进：

1. 允许记录关联 `matchRoundId` 作为可选外键
2. 增加按赛季、类型的统计视图
3. 增加导出能力
4. 评估是否合并或下线旧 `fund` 模块

在这些需求真正出现前，不应提前把当前模型拆成更重的主从结构或统计模型。
