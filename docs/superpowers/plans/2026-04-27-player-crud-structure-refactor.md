# Player CRUD Structure Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `apps/admin` 的 `player` 页面重构为符合 admin CRUD 标准结构的首个落地模块，同时保持现有列表、搜索和新增/编辑行为不变。

**Architecture:** 先拆职责，再保持行为。`index.vue` 只负责页面装配与请求编排；搜索、表格、表单默认值和映射逻辑分别下沉到 `schemas/*`、`model/*`、`components/*`。不在这一轮引入完整 CRUD 平台，只补当前重构必须的文件边界。

**Tech Stack:** Vue 3 `script setup`、TypeScript、Element Plus、现有 `EsSearch` / `EsTable`

---

## 文件结构

本次改造涉及以下文件：

- 新建：`apps/admin/src/views/gaoge/player/components/PlayerForm.vue`
- 新建：`apps/admin/src/views/gaoge/player/components/PlayerFormDialog.vue`
- 新建：`apps/admin/src/views/gaoge/player/model/mapper.ts`
- 新建：`apps/admin/src/views/gaoge/player/model/types.ts`
- 新建：`apps/admin/src/views/gaoge/player/schemas/form.ts`
- 新建：`apps/admin/src/views/gaoge/player/schemas/search.ts`
- 新建：`apps/admin/src/views/gaoge/player/schemas/table.ts`
- 新建：`docs/superpowers/plans/2026-04-27-player-crud-structure-refactor.md`
- 修改：`apps/admin/src/views/gaoge/player/index.vue`
- 修改：`apps/admin/src/views/gaoge/player/constants.ts` 或删除后由新文件替代

职责划分：

- `index.vue`：页面状态、请求流程、动作入口
- `components/PlayerForm.vue`：纯业务表单体
- `components/PlayerFormDialog.vue`：弹窗容器与提交出口
- `schemas/search.ts`：搜索默认值与字段定义
- `schemas/table.ts`：表格列定义
- `schemas/form.ts`：表单静态选项与规则
- `model/types.ts`：页面内部表单类型
- `model/mapper.ts`：`row -> form -> payload` 转换

### Task 1: 拆分 schema 和 mapper

**Files:**

- Create: `apps/admin/src/views/gaoge/player/schemas/search.ts`
- Create: `apps/admin/src/views/gaoge/player/schemas/table.ts`
- Create: `apps/admin/src/views/gaoge/player/schemas/form.ts`
- Create: `apps/admin/src/views/gaoge/player/model/types.ts`
- Create: `apps/admin/src/views/gaoge/player/model/mapper.ts`
- Modify: `apps/admin/src/views/gaoge/player/index.vue`
- Modify: `apps/admin/src/views/gaoge/player/PlayerFormDialog.vue`

- [ ] **Step 1: 记录当前 player 页面结构作为重构前基线**

Run: `find apps/admin/src/views/gaoge/player -maxdepth 2 -type f | sort`
Expected: 只看到 `index.vue`、`constants.ts`、`PlayerFormDialog.vue`、`auth.ts`、`formatters.ts`

- [ ] **Step 2: 新建页面内部类型文件**

```ts
// apps/admin/src/views/gaoge/player/model/types.ts
import type { SearchFormData } from '@/components/common/EsSearch/types'

export interface PlayerSearch extends SearchFormData {
  keyword: string
  subTeam: string
  position: string
  status: string
}

export interface PlayerFormModel {
  id?: number
  openid: string
  nickname: string
  realName: string
  avatarUrl: string
  subTeam: string
  birthDate: string
  isAdmin: boolean
  position: string
  jerseySize: string
  status: string
  remark: string
}
```

- [ ] **Step 3: 新建搜索 schema 文件**

```ts
// apps/admin/src/views/gaoge/player/schemas/search.ts
import type { SearchField, SearchOption } from '@/components/common/EsSearch/types'
import { getPlayerStatusLabel } from '../formatters'
import type { PlayerSearch } from '../model/types'

export interface PlayerSearchFieldContext {
  subTeamOptions: () => SearchOption[]
  positionOptions: () => SearchOption[]
  statusOptions: () => SearchOption[]
}

export const PLAYER_DEFAULT_SEARCH: PlayerSearch = {
  keyword: '',
  subTeam: '',
  position: '',
  status: '',
}

export function createPlayerSearchFields(ctx: PlayerSearchFieldContext): SearchField[] {
  return [
    {
      key: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '昵称 / 姓名 / OpenID / 位置',
      span: 8,
    },
    {
      key: 'subTeam',
      label: '分队',
      type: 'select',
      placeholder: '全部',
      options: ctx.subTeamOptions,
      props: { filterable: true },
    },
    {
      key: 'position',
      label: '位置',
      type: 'select',
      placeholder: '全部',
      options: ctx.positionOptions,
      props: { filterable: true },
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      placeholder: '全部',
      options: () =>
        ctx
          .statusOptions()
          .map((item) => ({ ...item, label: getPlayerStatusLabel(String(item.value)) })),
      props: { filterable: true },
    },
  ]
}
```

- [ ] **Step 4: 新建表格 schema 文件**

```ts
// apps/admin/src/views/gaoge/player/schemas/table.ts
import type { TableColumn } from '@/constants/basic-data/types'

export const PLAYER_TABLE_COLUMNS: TableColumn[] = [
  { label: '头像', prop: 'avatarUrl', width: 88, slot: 'avatar', align: 'center' },
  { label: '昵称', prop: 'nickname', width: 140 },
  { label: '真实姓名', prop: 'realName', width: 120 },
  { label: 'OpenID', prop: 'openid', width: 220 },
  { label: '分队', prop: 'subTeam', width: 120 },
  { label: '位置', prop: 'position', width: 120 },
  { label: '球衣尺码', prop: 'jerseySize', width: 110, align: 'center' },
  { label: '状态', prop: 'status', width: 110, slot: 'status', align: 'center' },
  { label: '管理员', prop: 'isAdmin', width: 100, slot: 'isAdmin', align: 'center' },
  { label: '生日', prop: 'birthDate', width: 120, slot: 'birthDate', align: 'center' },
  { label: '更新时间', prop: 'updatedAt', width: 170, slot: 'updatedAt' },
  { label: '备注', prop: 'remark', width: 180 },
  { label: '操作', prop: 'actions', width: 160, fixed: 'right', slot: 'actions', align: 'center' },
]
```

- [ ] **Step 5: 新建表单 schema 与 mapper 文件**

```ts
// apps/admin/src/views/gaoge/player/schemas/form.ts
import type { FormRules } from 'element-plus'
import type { SearchOption } from '@/components/common/EsSearch/types'
import type { PlayerFormModel } from '../model/types'

export const PLAYER_STATUS_OPTIONS: SearchOption[] = [
  { label: '正常', value: 'active' },
  { label: '停用', value: 'inactive' },
]

export const PLAYER_FORM_RULES: FormRules<PlayerFormModel> = {
  openid: [{ required: true, message: '请输入 OpenID', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
}
```

```ts
// apps/admin/src/views/gaoge/player/model/mapper.ts
import dayjs from 'dayjs'
import type { Player, PlayerPayload } from '@/api/players'
import type { PlayerFormModel, PlayerSearch } from './types'

export function createEmptyPlayerForm(): PlayerFormModel {
  return {
    openid: '',
    nickname: '',
    realName: '',
    avatarUrl: '',
    subTeam: '',
    birthDate: '',
    isAdmin: false,
    position: '',
    jerseySize: '',
    status: 'active',
    remark: '',
  }
}

export function createPlayerFormFromRow(row: Player): PlayerFormModel {
  return {
    id: row.id,
    openid: row.openid,
    nickname: row.nickname,
    realName: row.realName ?? '',
    avatarUrl: row.avatarUrl ?? '',
    subTeam: row.subTeam ?? '',
    birthDate: row.birthDate ? row.birthDate.slice(0, 10) : '',
    isAdmin: row.isAdmin,
    position: row.position ?? '',
    jerseySize: row.jerseySize ?? '',
    status: row.status ?? 'active',
    remark: row.remark ?? '',
  }
}

export function buildPlayerPayload(model: PlayerFormModel): PlayerPayload {
  const normalizeText = (value: string) => {
    const trimmed = value.trim()
    return trimmed || undefined
  }

  return {
    openid: model.openid.trim(),
    nickname: model.nickname.trim(),
    realName: normalizeText(model.realName),
    avatarUrl: normalizeText(model.avatarUrl),
    subTeam: normalizeText(model.subTeam),
    birthDate: model.birthDate ? dayjs(model.birthDate).startOf('day').toISOString() : undefined,
    isAdmin: model.isAdmin,
    position: normalizeText(model.position),
    jerseySize: normalizeText(model.jerseySize),
    status: normalizeText(model.status) ?? 'active',
    remark: normalizeText(model.remark),
  }
}

export function buildPlayerListParams(search: PlayerSearch, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    keyword: search.keyword || undefined,
    subTeam: search.subTeam || undefined,
    position: search.position || undefined,
    status: search.status || undefined,
  }
}
```

- [ ] **Step 6: 运行 admin 类型检查，确认新模块拆分没有破坏类型**

Run: `pnpm --filter @gaoge/app-admin typecheck`
Expected: PASS

### Task 2: 拆分 PlayerForm 与 PlayerFormDialog

**Files:**

- Create: `apps/admin/src/views/gaoge/player/components/PlayerForm.vue`
- Create: `apps/admin/src/views/gaoge/player/components/PlayerFormDialog.vue`
- Modify: `apps/admin/src/views/gaoge/player/index.vue`
- Delete or stop using: `apps/admin/src/views/gaoge/player/PlayerFormDialog.vue`

- [ ] **Step 1: 新建纯业务表单组件**

```vue
<!-- apps/admin/src/views/gaoge/player/components/PlayerForm.vue -->
<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import type { SearchOption } from '@/components/common/EsSearch/types'
import { PLAYER_FORM_RULES, PLAYER_STATUS_OPTIONS } from '../schemas/form'
import { getPlayerStatusLabel } from '../formatters'
import type { PlayerFormModel } from '../model/types'

const props = defineProps<{
  model: PlayerFormModel
  subTeamOptions: SearchOption[]
  positionOptions: SearchOption[]
  statusOptions: SearchOption[]
}>()

const formRef = ref<FormInstance>()

const customStatusOptions = computed(() =>
  props.statusOptions.filter((item) => !['active', 'inactive'].includes(String(item.value))),
)

async function validate() {
  const valid = await formRef.value?.validate().catch(() => false)
  return Boolean(valid)
}

function reset() {
  formRef.value?.resetFields()
}

function clearValidate() {
  formRef.value?.clearValidate()
}

defineExpose({
  validate,
  reset,
  clearValidate,
})
</script>
```

- [ ] **Step 2: 在表单组件模板中承接原有全部表单项**

```vue
<template>
  <ElForm ref="formRef" :model="model" :rules="PLAYER_FORM_RULES" label-width="96px">
    <!-- 这里直接迁移原 PlayerFormDialog.vue 中 ElForm 内部所有表单项 -->
  </ElForm>
</template>
```

- [ ] **Step 3: 新建弹窗容器组件，只负责弹窗和提交出口**

```vue
<!-- apps/admin/src/views/gaoge/player/components/PlayerFormDialog.vue -->
<script setup lang="ts">
import type { Player, PlayerPayload } from '@/api/players'
import type { SearchOption } from '@/components/common/EsSearch/types'
import PlayerForm from './PlayerForm.vue'
import { createEmptyPlayerForm, createPlayerFormFromRow, buildPlayerPayload } from '../model/mapper'
import type { PlayerFormModel } from '../model/types'

defineOptions({ name: 'PlayerFormDialog' })

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  player?: Player | null
  subTeamOptions: SearchOption[]
  positionOptions: SearchOption[]
  statusOptions: SearchOption[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: PlayerPayload): void
}>()

const formRef = ref<InstanceType<typeof PlayerForm>>()
const formModel = ref<PlayerFormModel>(createEmptyPlayerForm())

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) return
  emit('submit', buildPlayerPayload(formModel.value))
}
```

- [ ] **Step 4: 为弹窗组件补齐 watch 和模板**

```ts
watch(
  () => [props.modelValue, props.mode, props.player] as const,
  ([modelValue]) => {
    if (!modelValue) return
    formModel.value =
      props.mode === 'edit' && props.player
        ? createPlayerFormFromRow(props.player)
        : createEmptyPlayerForm()
    nextTick(() => formRef.value?.clearValidate())
  },
  { immediate: true },
)

watch(visible, (value) => {
  if (!value) formRef.value?.reset()
})
```

```vue
<template>
  <ElDialog v-model="visible" :title="mode === 'create' ? '新增球员' : '编辑球员'" width="640px">
    <PlayerForm
      ref="formRef"
      :model="formModel"
      :sub-team-options="subTeamOptions"
      :position-options="positionOptions"
      :status-options="statusOptions"
    />
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>
</template>
```

- [ ] **Step 5: 更新页面引用路径，停止使用旧顶层对话框文件**

Run: `rg -n "PlayerFormDialog" apps/admin/src/views/gaoge/player`
Expected: 只剩 `components/PlayerFormDialog.vue` 和 `index.vue` 的新引用

- [ ] **Step 6: 运行 admin 类型检查**

Run: `pnpm --filter @gaoge/app-admin typecheck`
Expected: PASS

### Task 3: 清理 index.vue，让页面只做编排

**Files:**

- Modify: `apps/admin/src/views/gaoge/player/index.vue`
- Remove usage: `apps/admin/src/views/gaoge/player/constants.ts`

- [ ] **Step 1: 调整 index.vue import，改为引用新的模块边界**

```ts
import PlayerFormDialog from './components/PlayerFormDialog.vue'
import { usePlayerAuth } from './auth'
import {
  formatBirthDate,
  formatDateTime,
  getPlayerStatusLabel,
  getPlayerStatusTagType,
} from './formatters'
import { buildPlayerListParams } from './model/mapper'
import type { PlayerSearch } from './model/types'
import { PLAYER_STATUS_OPTIONS } from './schemas/form'
import { PLAYER_DEFAULT_SEARCH, createPlayerSearchFields } from './schemas/search'
import { PLAYER_TABLE_COLUMNS } from './schemas/table'
```

- [ ] **Step 2: 从 index.vue 中删除表单默认值、字段配置和 payload 拼装细节**

```ts
function buildListParams(): PlayerListParams {
  return buildPlayerListParams(search.value, page.value, pageSize.value)
}
```

页面只保留：

- 搜索状态
- 分页状态
- 列表请求
- 弹窗开关
- 提交与删除动作

- [ ] **Step 3: 删除旧 `constants.ts` 文件或让其不再被引用**

Run: `rg -n "./constants|constants.ts" apps/admin/src/views/gaoge/player`
Expected: 无结果，或仅剩准备删除的旧文件本身

- [ ] **Step 4: 运行完整 admin lint，确认结构改造后风格和类型均通过**

Run: `pnpm --filter @gaoge/app-admin lint`
Expected: PASS

- [ ] **Step 5: 运行仓库级 typecheck，确认没有影响其他包**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 6: 提交本轮 player 结构改造**

```bash
git add apps/admin/src/views/gaoge/player docs/superpowers/plans/2026-04-27-player-crud-structure-refactor.md
git commit -m "refactor: align player page with admin crud structure"
```
