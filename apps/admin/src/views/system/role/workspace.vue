<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'

import systemAccessCatalogApi from '@/api/system/access-catalog'
import type { SystemPermission, SystemResource } from '@/api/system/resource'
import type { SystemRole } from '@/api/system/role'
import systemRoleApi from '@/api/system/role'
import type { SearchField, SearchFormData } from '@/components/common/EsSearch/types'
import type { TableAction, TableColumn } from '@/components/common/EsTable/types'
import useAuth from '@/composables/useAuth'

import SystemIdentityCell from '../components/SystemIdentityCell.vue'
import SystemPermissionSelector from '../components/SystemPermissionSelector.vue'

import { SYSTEM_ROLE_PERMISSIONS } from './auth'

import '../system-rbac.css'

defineOptions({ name: 'SystemRoleWorkspace' })

const { auth, authAll } = useAuth()
const roles = ref<SystemRole[]>([])
const resources = ref<SystemResource[]>([])
const rolePermissionCache = ref(new Map<number, SystemPermission[]>())
const loading = ref(false)
const saving = ref(false)
const pendingActionKey = ref('')
const error = ref('')
const filters = ref({ keyword: '', status: '' as '' | 'active' | 'inactive' })
const searchFields: SearchField[] = [
  { key: 'keyword', label: '角色', type: 'input', placeholder: '名称或编码' },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    placeholder: '全部状态',
    options: [
      { label: '启用', value: 'active' },
      { label: '停用', value: 'inactive' },
    ],
  },
]
const filteredRoles = computed(() => {
  const keyword = filters.value.keyword.trim().toLocaleLowerCase()
  return roles.value.filter(
    (role) =>
      (!keyword ||
        role.name.toLocaleLowerCase().includes(keyword) ||
        role.code.toLocaleLowerCase().includes(keyword)) &&
      (!filters.value.status || role.status === filters.value.status),
  )
})
const dialogOpen = ref(false)
const editing = ref<SystemRole>()
const form = reactive({
  code: '',
  description: '',
  name: '',
  permissionIds: [] as number[],
  sort: 0,
  status: 'active' as 'active' | 'inactive',
})
const fieldErrors = ref<Record<string, string>>({})
const initialFormSnapshot = ref('')

const columns = computed<TableColumn[]>(() => {
  const actionLoading = (kind: string) => (row: SystemRole) =>
    pendingActionKey.value === `${kind}:${row.id}`
  return [
    { label: '角色', prop: 'role', minWidth: 220, slot: 'role' },
    { label: '说明', prop: 'description', minWidth: 220, slot: 'description' },
    { label: '权限', prop: 'permissions', minWidth: 260, slot: 'permissions' },
    { label: '用户数', prop: 'userCount', fixedWidth: 90, align: 'center' },
    { label: '状态', prop: 'status', fixedWidth: 100, slot: 'status' },
    {
      label: '操作',
      prop: 'actions',
      fixedWidth: 96,
      fixed: 'right',
      align: 'center',
      inlineActionLimit: 2,
      actions: [
        {
          key: 'edit',
          label: '编辑',
          auth: [SYSTEM_ROLE_PERMISSIONS.update, SYSTEM_ROLE_PERMISSIONS.assignPermission],
          authMatch: 'all',
          type: 'primary',
        },
        {
          key: 'enable',
          label: '启用',
          auth: SYSTEM_ROLE_PERMISSIONS.enable,
          type: 'success',
          loading: actionLoading('status'),
          visible: (row: SystemRole) => row.status === 'inactive',
        },
        {
          key: 'disable',
          label: '停用',
          auth: SYSTEM_ROLE_PERMISSIONS.disable,
          type: 'warning',
          loading: actionLoading('status'),
          visible: (row: SystemRole) => row.status === 'active',
        },
        {
          key: 'delete',
          label: '删除',
          auth: SYSTEM_ROLE_PERMISSIONS.delete,
          type: 'danger',
          disabled: (row: SystemRole) => row.isBuiltIn,
          loading: actionLoading('delete'),
        },
      ],
    },
  ]
})
const roleActions = computed(
  () => columns.value.find(({ prop }) => prop === 'actions')?.actions ?? [],
)
const canCreateRole = computed(() =>
  authAll([SYSTEM_ROLE_PERMISSIONS.create, SYSTEM_ROLE_PERMISSIONS.assignPermission]),
)

function serializeForm() {
  return JSON.stringify({
    code: form.code.trim(),
    description: form.description.trim(),
    name: form.name.trim(),
    permissionIds: [...form.permissionIds].sort((a, b) => a - b),
    sort: form.sort,
    status: form.status,
  })
}

function captureInitialForm() {
  initialFormSnapshot.value = serializeForm()
}

const formDirty = computed(() => dialogOpen.value && serializeForm() !== initialFormSnapshot.value)

function permissionSummary(role: SystemRole) {
  return `${role.permissionCount} 项权限 · ${role.resourceCount} 个资源 · ${role.moduleCount} 个模块`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [roleList, catalog] = await Promise.all([
      systemRoleApi.list(),
      systemAccessCatalogApi.get(),
    ])
    roles.value = roleList
    resources.value = catalog.resources
    rolePermissionCache.value = new Map()
  } catch {
    error.value = '角色列表加载失败，请重试。'
  } finally {
    loading.value = false
  }
}

async function loadRolePermissions(role: SystemRole) {
  if (rolePermissionCache.value.has(role.id)) return rolePermissionCache.value.get(role.id) ?? []
  const permissions = await systemRoleApi.permissions(role.id)
  rolePermissionCache.value = new Map(rolePermissionCache.value).set(role.id, permissions)
  return permissions
}

function openCreate() {
  editing.value = undefined
  Object.assign(form, {
    code: '',
    description: '',
    name: '',
    permissionIds: [],
    sort: 0,
    status: 'active',
  })
  fieldErrors.value = {}
  captureInitialForm()
  dialogOpen.value = true
}

async function openEdit(role: SystemRole) {
  editing.value = role
  const permissions = await loadRolePermissions(role)
  Object.assign(form, {
    code: role.code,
    description: role.description ?? '',
    name: role.name,
    permissionIds: permissions
      .filter(
        ({ status, resourceDefinition }) =>
          status === 'active' && resourceDefinition.status === 'active',
      )
      .map(({ id }) => id),
    sort: role.sort,
    status: role.status,
  })
  fieldErrors.value = {}
  captureInitialForm()
  dialogOpen.value = true
}

async function save() {
  fieldErrors.value = {}
  if (!form.name.trim()) fieldErrors.value.name = '请输入角色名称'
  if (!editing.value && !/^[a-z][a-z0-9_]*$/.test(form.code)) {
    fieldErrors.value.code = '编码需使用小写字母、数字和下划线'
  }
  if (Object.keys(fieldErrors.value).length) return
  saving.value = true
  try {
    if (editing.value) {
      await systemRoleApi.update(editing.value.id, {
        description: form.description.trim() || undefined,
        expectedUpdatedAt: editing.value.updatedAt,
        name: form.name.trim(),
        permissionIds: form.permissionIds,
        sort: form.sort,
        status: form.status === editing.value.status ? undefined : form.status,
      })
    } else {
      await systemRoleApi.create({
        code: form.code.trim(),
        description: form.description.trim() || undefined,
        name: form.name.trim(),
        permissionIds: form.permissionIds,
        sort: form.sort,
        status: form.status,
      })
    }
    captureInitialForm()
    dialogOpen.value = false
    ElMessage.success(editing.value ? '角色已更新' : '角色已创建')
    await load()
  } finally {
    saving.value = false
  }
}

async function toggle(role: SystemRole) {
  pendingActionKey.value = `status:${role.id}`
  try {
    await systemRoleApi.updateStatus(role.id, {
      status: role.status === 'active' ? 'inactive' : 'active',
      expectedUpdatedAt: role.updatedAt,
    })
    ElMessage.success(role.status === 'active' ? '角色已停用' : '角色已启用')
    await load()
  } finally {
    pendingActionKey.value = ''
  }
}

async function remove(role: SystemRole) {
  try {
    await ElMessageBox.confirm(`确认删除角色「${role.name}」？`, '删除角色', {
      confirmButtonText: '确认删除',
      type: 'warning',
    })
    pendingActionKey.value = `delete:${role.id}`
    await systemRoleApi.remove(role.id)
    ElMessage.success('角色已删除')
    await load()
  } catch (caught) {
    if (caught !== 'cancel' && caught !== 'close') throw caught
  } finally {
    pendingActionKey.value = ''
  }
}

async function confirmDialogClose() {
  if (!formDirty.value) return true
  try {
    await ElMessageBox.confirm('当前角色信息或权限选择尚未保存，确认放弃修改？', '放弃未保存修改', {
      confirmButtonText: '放弃修改',
      cancelButtonText: '继续编辑',
      type: 'warning',
    })
    return true
  } catch {
    return false
  }
}

async function requestDialogClose() {
  if (saving.value || !(await confirmDialogClose())) return
  dialogOpen.value = false
}

async function handleDialogBeforeClose(done: () => void) {
  if (saving.value || !(await confirmDialogClose())) return
  done()
}

function handleSearch(data: SearchFormData) {
  filters.value = {
    keyword: String(data.keyword ?? ''),
    status: String(data.status ?? '') as '' | 'active' | 'inactive',
  }
}

function handleTableAction(payload: { row: SystemRole; action: { key: string } }) {
  if (payload.action.key === 'edit') void openEdit(payload.row)
  else if (payload.action.key === 'enable' || payload.action.key === 'disable') {
    void toggle(payload.row)
  } else if (payload.action.key === 'delete') void remove(payload.row)
}

function handleMobileAction(row: SystemRole, action: TableAction) {
  handleTableAction({ row, action })
}

onMounted(load)
</script>

<template>
  <div class="absolute-container">
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 flex flex-col overflow-auto">
      <EsSearch v-model="filters" :fields="searchFields" @search="handleSearch" />
      <div v-if="error" class="system-alert system-alert--danger" role="alert">
        <span>{{ error }}</span
        ><ElButton link type="danger" @click="load">重新加载</ElButton>
      </div>
      <EsListToolbar>
        <template #actions>
          <ElButton v-if="canCreateRole" type="primary" plain @click="openCreate"
            >新建角色</ElButton
          >
        </template>
      </EsListToolbar>

      <div class="table-wrapper system-desktop-table">
        <EsTable
          :columns="columns"
          :data="filteredRoles"
          :loading="loading"
          :show-pagination="false"
          row-key="id"
          table-height="100%"
          @action-click="handleTableAction"
        >
          <template #role="{ row }">
            <SystemIdentityCell
              :badge="row.isBuiltIn ? '内置' : undefined"
              :code="row.code"
              :primary="row.name"
            />
          </template>
          <template #description="{ row }">
            <span class="block min-w-0 truncate" :title="row.description || undefined">{{
              row.description || '--'
            }}</span>
          </template>
          <template #permissions="{ row }">
            <ElPopover placement="top" trigger="click" width="360" @show="loadRolePermissions(row)">
              <template #reference>
                <ElButton
                  class="system-scope-summary"
                  text
                  :aria-label="`查看${row.name}的权限：${permissionSummary(row)}`"
                >
                  <span>{{ permissionSummary(row) }}</span
                  ><FaIcon class="system-scope-summary__icon" name="i-ri:arrow-right-s-line" />
                </ElButton>
              </template>
              <div class="impact-list">
                <strong>{{ row.name }}的权限</strong>
                <ul v-if="rolePermissionCache.get(row.id)?.length">
                  <li v-for="permission in rolePermissionCache.get(row.id)" :key="permission.id">
                    <span>{{ permission.name }}</span
                    ><code>{{ permission.code }}</code>
                  </li>
                </ul>
                <p v-else>暂无权限</p>
              </div>
            </ElPopover>
          </template>
          <template #status="{ row }"
            ><ElTag :type="row.status === 'active' ? 'success' : 'info'">{{
              row.status === 'active' ? '启用' : '停用'
            }}</ElTag></template
          >
        </EsTable>
      </div>

      <div v-loading="loading" class="system-mobile-list">
        <article v-for="role in filteredRoles" :key="role.id" class="system-mobile-card">
          <div class="system-mobile-card__main">
            <SystemIdentityCell
              :badge="role.isBuiltIn ? '内置' : undefined"
              :code="role.code"
              :primary="role.name"
            /><ElTag size="small" :type="role.status === 'active' ? 'success' : 'info'">{{
              role.status === 'active' ? '启用' : '停用'
            }}</ElTag>
          </div>
          <p>{{ permissionSummary(role) }} · {{ role.userCount }} 个用户</p>
          <p v-if="role.description" class="system-mobile-card__muted">{{ role.description }}</p>
          <EsTableActionCell
            :actions="roleActions"
            :row="role"
            @action-click="handleMobileAction(role, $event)"
          />
        </article>
        <p v-if="!loading && filteredRoles.length === 0" class="system-dialog-empty">暂无角色</p>
      </div>
    </FaPageMain>

    <ElDialog
      v-model="dialogOpen"
      align-center
      class="role-dialog system-dialog"
      :close-on-click-modal="false"
      :before-close="handleDialogBeforeClose"
      destroy-on-close
      :title="editing ? '编辑角色' : '新建角色'"
      width="min(760px, calc(100vw - 32px))"
    >
      <ElForm
        id="role-form"
        class="system-dialog-form"
        label-position="right"
        label-width="84px"
        @submit.prevent="save"
      >
        <div class="system-dialog-grid">
          <ElFormItem label="角色名称" required :error="fieldErrors.name"
            ><ElInput v-model="form.name"
          /></ElFormItem>
          <ElFormItem label="角色编码" required :error="fieldErrors.code"
            ><ElInput
              v-model="form.code"
              class="system-readonly-field"
              :readonly="Boolean(editing)"
              :title="editing ? '角色编码创建后不可修改' : undefined"
          /></ElFormItem>
          <ElFormItem label="状态"
            ><ElSelect v-model="form.status"
              ><ElOption
                label="启用"
                value="active"
                :disabled="Boolean(editing) && !auth(SYSTEM_ROLE_PERMISSIONS.enable)" /><ElOption
                label="停用"
                value="inactive"
                :disabled="Boolean(editing) && !auth(SYSTEM_ROLE_PERMISSIONS.disable)" /></ElSelect
          ></ElFormItem>
          <ElFormItem label="排序"
            ><ElInputNumber v-model="form.sort" :min="0" controls-position="right"
          /></ElFormItem>
          <ElFormItem class="system-dialog-grid__wide" label="说明"
            ><ElInput v-model="form.description" :rows="2" type="textarea"
          /></ElFormItem>
        </div>
        <section class="system-dialog-section">
          <p class="system-dialog-section__label">权限</p>
          <SystemPermissionSelector v-model="form.permissionIds" :resources="resources" />
        </section>
        <p v-if="editing?.code === 'super_admin'" class="text-secondary m-0 text-xs">
          超级管理员是系统关键角色，部分权限不可取消。
        </p>
      </ElForm>
      <template #footer
        ><ElButton @click="requestDialogClose">取消</ElButton
        ><ElButton form="role-form" :loading="saving" native-type="submit" type="primary"
          >保存</ElButton
        ></template
      >
    </ElDialog>
  </div>
</template>
