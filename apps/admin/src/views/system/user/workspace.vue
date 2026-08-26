<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'

import type { SystemRole } from '@/api/system/role'
import systemRoleApi from '@/api/system/role'
import type { SystemUser } from '@/api/system/user'
import systemUserApi from '@/api/system/user'
import type { SearchField } from '@/components/common/EsSearch/types'
import type { TableAction, TableColumn } from '@/components/common/EsTable/types'
import useAuth from '@/composables/useAuth'
import useUserStore from '@/store/user'

import SystemChoiceLabel from '../components/SystemChoiceLabel.vue'
import SystemIdentityCell from '../components/SystemIdentityCell.vue'

import { SYSTEM_USER_PERMISSIONS } from './auth'

import '../system-rbac.css'

defineOptions({ name: 'SystemUserWorkspace' })

const userStore = useUserStore()
const { auth } = useAuth()
const users = ref<SystemUser[]>([])
const roles = ref<SystemRole[]>([])
const loading = ref(false)
const saving = ref(false)
const pendingActionKey = ref('')
const error = ref('')
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filters = ref({
  keyword: '',
  roleId: '' as '' | number,
  status: '' as '' | 'active' | 'inactive',
})
const searchFields = computed<SearchField[]>(() => [
  { key: 'keyword', label: '用户', type: 'input', placeholder: '账号或昵称' },
  {
    key: 'roleId',
    label: '角色',
    type: 'select',
    placeholder: '全部角色',
    options: roles.value.map((role) => ({ label: role.name, value: role.id })),
  },
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
])
const dialogOpen = ref(false)
const editing = ref<SystemUser>()
const fieldErrors = ref<Record<string, string>>({})
const form = reactive({
  account: '',
  avatarUrl: '',
  nickname: '',
  password: '',
  roleIds: [] as number[],
  status: 'active' as 'active' | 'inactive',
})
const initialFormSnapshot = ref('')
const accountInputRef = ref<{ focus: () => void }>()
const nicknameInputRef = ref<{ focus: () => void }>()
const passwordInputRef = ref<{ focus: () => void }>()
const currentUserId = computed(() => userStore.profile?.id)

const columns = computed<TableColumn[]>(() => {
  const isCurrentUser = (row: SystemUser) => row.id === currentUserId.value
  const actionLoading = (kind: string) => (row: SystemUser) =>
    pendingActionKey.value === `${kind}:${row.id}`
  return [
    { label: '用户', prop: 'user', minWidth: 220, slot: 'user' },
    { label: '角色', prop: 'roles', minWidth: 220, slot: 'roles' },
    { label: '状态', prop: 'status', fixedWidth: 100, slot: 'status' },
    { label: '最后登录', prop: 'lastLoginAt', minWidth: 170, slot: 'lastLoginAt' },
    {
      label: '操作',
      prop: 'actions',
      fixedWidth: 96,
      fixed: 'right',
      align: 'center',
      inlineActionLimit: 2,
      actions: [
        { key: 'edit', label: '编辑', auth: SYSTEM_USER_PERMISSIONS.update, type: 'primary' },
        {
          key: 'resetPassword',
          label: '重置密码',
          auth: SYSTEM_USER_PERMISSIONS.resetPassword,
          type: 'primary',
          loading: actionLoading('resetPassword'),
        },
        {
          key: 'enable',
          label: '启用',
          auth: SYSTEM_USER_PERMISSIONS.enable,
          type: 'success',
          visible: (row: SystemUser) => row.status === 'inactive',
          disabled: isCurrentUser,
          loading: actionLoading('status'),
        },
        {
          key: 'disable',
          label: '停用',
          auth: SYSTEM_USER_PERMISSIONS.disable,
          type: 'warning',
          visible: (row: SystemUser) => row.status === 'active',
          disabled: isCurrentUser,
          loading: actionLoading('status'),
        },
        {
          key: 'delete',
          label: '删除',
          auth: SYSTEM_USER_PERMISSIONS.delete,
          type: 'danger',
          disabled: (row: SystemUser) => isCurrentUser(row) || row.account === 'admin',
          loading: actionLoading('delete'),
        },
      ],
    },
  ]
})
const userActions = computed(
  () => columns.value.find(({ prop }) => prop === 'actions')?.actions ?? [],
)

function serializeForm() {
  return JSON.stringify({
    account: form.account.trim(),
    avatarUrl: form.avatarUrl.trim(),
    nickname: form.nickname.trim(),
    password: form.password,
    roleIds: [...form.roleIds].sort((a, b) => a - b),
    status: form.status,
  })
}

function captureInitialForm() {
  initialFormSnapshot.value = serializeForm()
}

const formDirty = computed(() => dialogOpen.value && serializeForm() !== initialFormSnapshot.value)

async function focusFirstError() {
  await nextTick()
  if (fieldErrors.value.account) accountInputRef.value?.focus()
  else if (fieldErrors.value.nickname) nicknameInputRef.value?.focus()
  else if (fieldErrors.value.password) passwordInputRef.value?.focus()
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [response, roleList] = await Promise.all([
      systemUserApi.list({
        page: page.value,
        pageSize: pageSize.value,
        keyword: filters.value.keyword.trim() || undefined,
        roleId: filters.value.roleId || undefined,
        status: filters.value.status || undefined,
      }),
      systemRoleApi.list(),
    ])
    users.value = response.list
    total.value = response.total
    roles.value = roleList.filter(({ status }) => status === 'active')
  } catch {
    error.value = '用户列表加载失败，请重试。'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = undefined
  Object.assign(form, {
    account: '',
    avatarUrl: '',
    nickname: '',
    password: '',
    roleIds: [],
    status: 'active',
  })
  fieldErrors.value = {}
  captureInitialForm()
  dialogOpen.value = true
}

function openEdit(user: SystemUser) {
  editing.value = user
  Object.assign(form, {
    account: user.account,
    avatarUrl: user.avatarUrl ?? '',
    nickname: user.nickname ?? '',
    password: '',
    roleIds: user.roles.map(({ id }) => id),
    status: user.status,
  })
  fieldErrors.value = {}
  captureInitialForm()
  dialogOpen.value = true
}

async function save() {
  fieldErrors.value = {}
  if (!form.account.trim()) fieldErrors.value.account = '请输入登录账号'
  if (!form.nickname.trim()) fieldErrors.value.nickname = '请输入昵称'
  if (!editing.value && form.password.length < 6)
    fieldErrors.value.password = '初始密码至少需要 6 个字符'
  if (form.roleIds.length === 0) fieldErrors.value.roles = '至少选择一个角色'
  if (Object.keys(fieldErrors.value).length) {
    await focusFirstError()
    return
  }
  saving.value = true
  try {
    if (editing.value) {
      await systemUserApi.update(editing.value.id, {
        avatarUrl: form.avatarUrl.trim() || undefined,
        expectedUpdatedAt: editing.value.updatedAt,
        nickname: form.nickname.trim(),
        roleIds: form.roleIds,
        status: form.status === editing.value.status ? undefined : form.status,
      })
    } else {
      await systemUserApi.create({
        account: form.account.trim(),
        avatarUrl: form.avatarUrl.trim() || undefined,
        nickname: form.nickname.trim(),
        password: form.password,
        roleIds: form.roleIds,
        status: form.status,
      })
    }
    captureInitialForm()
    dialogOpen.value = false
    ElMessage.success(editing.value ? '用户已更新' : '用户已创建')
    await load()
  } finally {
    saving.value = false
  }
}

async function confirmDialogClose() {
  if (!formDirty.value) return true
  try {
    await ElMessageBox.confirm('当前用户信息或角色选择尚未保存，确认放弃修改？', '放弃未保存修改', {
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

async function toggle(user: SystemUser) {
  if (user.id === currentUserId.value) {
    ElMessage.warning('不能在当前会话中停用自己。')
    return
  }
  pendingActionKey.value = `status:${user.id}`
  try {
    await systemUserApi.updateStatus(user.id, {
      status: user.status === 'active' ? 'inactive' : 'active',
      expectedUpdatedAt: user.updatedAt,
    })
    ElMessage.success(user.status === 'active' ? '用户已停用，现有会话已撤销' : '用户已启用')
    await load()
  } finally {
    pendingActionKey.value = ''
  }
}

async function resetPassword(user: SystemUser) {
  try {
    const result = await ElMessageBox.prompt(
      '请输入 6 到 18 位新密码',
      `重置 ${user.account} 的密码`,
      {
        inputType: 'password',
        inputValidator: (value) =>
          (value.length >= 6 && value.length <= 18) || '密码长度应为 6 到 18 位',
      },
    )
    pendingActionKey.value = `resetPassword:${user.id}`
    await systemUserApi.resetPassword(user.id, {
      expectedUpdatedAt: user.updatedAt,
      newPassword: result.value,
    })
    ElMessage.success('密码已重置，目标账号现有会话已撤销')
  } catch (caught) {
    if (caught !== 'cancel' && caught !== 'close') throw caught
  } finally {
    pendingActionKey.value = ''
  }
}

async function remove(user: SystemUser) {
  if (user.id === currentUserId.value) return
  try {
    await ElMessageBox.confirm(`确认删除用户「${user.account}」？`, '删除用户', {
      confirmButtonText: '确认删除',
      type: 'warning',
    })
    pendingActionKey.value = `delete:${user.id}`
    await systemUserApi.remove(user.id)
    ElMessage.success('用户已删除')
    await load()
  } catch (caught) {
    if (caught !== 'cancel' && caught !== 'close') throw caught
  } finally {
    pendingActionKey.value = ''
  }
}

function doSearch() {
  page.value = 1
  void load()
}

function handlePaginationChange() {
  void load()
}

function handleTableAction(payload: { row: SystemUser; action: { key: string } }) {
  if (payload.action.key === 'edit') openEdit(payload.row)
  else if (payload.action.key === 'resetPassword') void resetPassword(payload.row)
  else if (payload.action.key === 'enable' || payload.action.key === 'disable')
    void toggle(payload.row)
  else if (payload.action.key === 'delete') void remove(payload.row)
}

function handleMobileAction(row: SystemUser, action: TableAction) {
  handleTableAction({ row, action })
}

onMounted(load)
</script>

<template>
  <div class="absolute-container">
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 flex flex-col overflow-auto">
      <EsSearch v-model="filters" :fields="searchFields" @search="doSearch" />
      <div v-if="error" class="system-alert system-alert--danger" role="alert">
        <span>{{ error }}</span
        ><ElButton link type="danger" @click="load">重新加载</ElButton>
      </div>
      <EsListToolbar
        ><template #actions
          ><ElButton
            v-auth="SYSTEM_USER_PERMISSIONS.create"
            type="primary"
            plain
            @click="openCreate"
            >新建用户</ElButton
          ></template
        ></EsListToolbar
      >

      <div class="table-wrapper system-desktop-table">
        <EsTable
          v-model:page="page"
          v-model:page-size="pageSize"
          :columns="columns"
          :data="users"
          :loading="loading"
          :total="total"
          row-key="id"
          table-height="100%"
          @action-click="handleTableAction"
          @pagination-change="handlePaginationChange"
        >
          <template #user="{ row }"
            ><SystemIdentityCell
              :badge="row.id === currentUserId ? '当前账号' : undefined"
              :code="row.account"
              :primary="row.nickname || row.account"
          /></template>
          <template #roles="{ row }"
            ><div class="system-tag-list">
              <ElTag v-for="role in row.roles.slice(0, 2)" :key="role.id" size="small">{{
                role.name
              }}</ElTag
              ><ElTag v-if="row.roles.length > 2" effect="plain" size="small"
                >+{{ row.roles.length - 2 }}</ElTag
              ><span v-if="row.roles.length === 0">--</span>
            </div></template
          >
          <template #status="{ row }"
            ><ElTag :type="row.status === 'active' ? 'success' : 'info'">{{
              row.status === 'active' ? '启用' : '停用'
            }}</ElTag></template
          >
          <template #lastLoginAt="{ row }">{{
            row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString('zh-CN') : '从未登录'
          }}</template>
        </EsTable>
      </div>

      <div v-loading="loading" class="system-mobile-list">
        <article v-for="user in users" :key="user.id" class="system-mobile-card">
          <div class="system-mobile-card__main">
            <SystemIdentityCell
              :badge="user.id === currentUserId ? '当前账号' : undefined"
              :code="user.account"
              :primary="user.nickname || user.account"
            /><ElTag size="small" :type="user.status === 'active' ? 'success' : 'info'">{{
              user.status === 'active' ? '启用' : '停用'
            }}</ElTag>
          </div>
          <p>
            {{
              user.roles.length
                ? `${user.roles.map(({ name }) => name).join('、')} · ${user.roles.length} 个角色`
                : '未分配角色'
            }}
          </p>
          <p class="system-mobile-card__muted">
            最后登录：{{
              user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '从未登录'
            }}
          </p>
          <EsTableActionCell
            :actions="userActions"
            :row="user"
            @action-click="handleMobileAction(user, $event)"
          />
        </article>
        <p v-if="!loading && users.length === 0" class="system-dialog-empty">暂无用户</p>
        <ElPagination
          v-if="total > pageSize"
          v-model:current-page="page"
          class="system-mobile-pagination"
          layout="total, prev, pager, next"
          small
          :page-size="pageSize"
          :total="total"
          @current-change="handlePaginationChange"
        />
      </div>
    </FaPageMain>

    <ElDialog
      v-model="dialogOpen"
      class="system-dialog"
      :close-on-click-modal="false"
      :before-close="handleDialogBeforeClose"
      destroy-on-close
      :title="editing ? '编辑用户' : '新建用户'"
      width="min(640px, calc(100vw - 32px))"
    >
      <ElForm
        id="user-form"
        class="system-dialog-form"
        label-position="right"
        label-width="84px"
        @submit.prevent="save"
      >
        <div class="system-dialog-grid">
          <ElFormItem label="登录账号" required :error="fieldErrors.account"
            ><ElInput
              ref="accountInputRef"
              v-model="form.account"
              autocomplete="off"
              class="system-readonly-field"
              :readonly="Boolean(editing)"
          /></ElFormItem>
          <ElFormItem label="昵称" required :error="fieldErrors.nickname"
            ><ElInput ref="nicknameInputRef" v-model="form.nickname"
          /></ElFormItem>
          <ElFormItem
            v-if="!editing"
            class="system-dialog-grid__wide"
            label="初始密码"
            required
            :error="fieldErrors.password"
            ><ElInput
              ref="passwordInputRef"
              v-model="form.password"
              autocomplete="new-password"
              minlength="6"
              show-password
              type="password"
          /></ElFormItem>
          <ElFormItem label="头像地址"><ElInput v-model="form.avatarUrl" /></ElFormItem>
          <ElFormItem label="状态"
            ><ElSelect v-model="form.status"
              ><ElOption
                label="启用"
                value="active"
                :disabled="Boolean(editing) && !auth(SYSTEM_USER_PERMISSIONS.enable)" /><ElOption
                label="停用"
                value="inactive"
                :disabled="Boolean(editing) && !auth(SYSTEM_USER_PERMISSIONS.disable)" /></ElSelect
          ></ElFormItem>
        </div>
        <section class="system-dialog-section">
          <p class="system-dialog-section__label">角色</p>
          <ElCheckboxGroup v-if="roles.length" v-model="form.roleIds" class="system-choice-grid"
            ><ElCheckbox v-for="role in roles" :key="role.id" :value="role.id"
              ><SystemChoiceLabel
                :code="role.code"
                :name="role.name"
                :title="role.description || role.name" /></ElCheckbox
          ></ElCheckboxGroup>
          <p v-else class="system-dialog-empty">暂无可选角色</p>
          <p v-if="fieldErrors.roles" class="text-danger m-0 text-xs">{{ fieldErrors.roles }}</p>
        </section>
      </ElForm>
      <template #footer
        ><ElButton @click="requestDialogClose">取消</ElButton
        ><ElButton form="user-form" :loading="saving" native-type="submit" type="primary"
          >保存</ElButton
        ></template
      >
    </ElDialog>
  </div>
</template>
