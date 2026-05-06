<route lang="yaml">
meta:
  title: 用户管理
</route>

<script setup lang="ts">
import { ElMessage, ElMessageBox, ElTag } from 'element-plus'

import type { SystemUser } from '@/api/system/user'
import systemUserApi from '@/api/system/user'
import type { SearchFormData } from '@/components/common/EsSearch/types'
import { useCrudDialog } from '@/composables/useCrudDialog'
import { useListPage } from '@/composables/useListPage'

import ResetPasswordDialog from './components/ResetPasswordDialog.vue'
import UserFormDialog from './components/UserFormDialog.vue'
import { SYSTEM_USER_DEFAULT_SEARCH } from './model/defaults'
import {
  buildSystemUserCreatePayload,
  buildSystemUserSearchParams,
  buildSystemUserUpdatePayload,
} from './model/mapper'
import type { SystemUserSearch } from './model/types'
import { createSystemUserSearchFields } from './schemas/search'
import { formatDateTime, SYSTEM_USER_TABLE_COLUMNS } from './schemas/table'
import { SYSTEM_USER_PERMISSIONS } from './auth'
import { ROLE_LABELS } from './constants'

defineOptions({
  name: 'SystemUser',
})

const submitLoading = ref(false)
const resetLoading = ref(false)
const selectionDataList = ref<SystemUser[]>([])
const resetPasswordVisible = ref(false)
const resetTarget = ref<SystemUser | null>(null)

const {
  search,
  tableData,
  total,
  loading,
  page,
  pageSize,
  fetchList,
  handleSearch,
  handlePaginationChange,
} = useListPage<SystemUserSearch, SystemUser, ReturnType<typeof buildSystemUserSearchParams>>({
  defaultSearch: SYSTEM_USER_DEFAULT_SEARCH,
  buildParams: buildSystemUserSearchParams,
  request: systemUserApi.list,
  normalizeSearch(formData: SearchFormData) {
    return {
      keyword: String(formData.keyword ?? ''),
      role: String(formData.role ?? '') as SystemUserSearch['role'],
      status: String(formData.status ?? '') as SystemUserSearch['status'],
    }
  },
})

const { dialogVisible, dialogMode, currentRow, openCreate, openEdit } = useCrudDialog<SystemUser>()

async function handleSubmit(payload: any) {
  submitLoading.value = true
  try {
    if (dialogMode.value === 'create') {
      await systemUserApi.create(buildSystemUserCreatePayload(payload))
      ElMessage.success('新增成功')
    } else if (currentRow.value) {
      await systemUserApi.update(currentRow.value.id, buildSystemUserUpdatePayload(payload))
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    await fetchList()
  } finally {
    submitLoading.value = false
  }
}

async function handleAction(row: SystemUser, key: string) {
  if (key === 'edit') {
    openEdit(row)
    return
  }
  if (key === 'enable' || key === 'disable') {
    await systemUserApi.updateStatus(row.id, { status: key === 'enable' ? 'active' : 'inactive' })
    ElMessage.success(key === 'enable' ? '已启用' : '已停用')
    await fetchList()
    return
  }
  if (key === 'resetPassword') {
    resetTarget.value = row
    resetPasswordVisible.value = true
    return
  }
  if (key === 'delete') {
    await ElMessageBox.confirm(`确定删除账号 ${row.account} 吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await systemUserApi.remove(row.id)
    ElMessage.success('已删除')
    await fetchList()
  }
}

function handleSelectionChange(rows: SystemUser[]) {
  selectionDataList.value = rows
}

async function handleResetPasswordSubmit(payload: { newPassword: string }) {
  if (!resetTarget.value) {
    return
  }
  resetLoading.value = true
  try {
    await systemUserApi.resetPassword(resetTarget.value.id, payload)
    ElMessage.success('密码已重置')
    resetPasswordVisible.value = false
  } finally {
    resetLoading.value = false
  }
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="absolute-container">
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 flex flex-col overflow-auto">
      <EsSearch
        v-model="search"
        :fields="createSystemUserSearchFields()"
        :default-visible-count="2"
        @search="handleSearch"
      />

      <EsListToolbar :selected-count="selectionDataList.length">
        <template #actions>
          <ElButton
            v-auth="SYSTEM_USER_PERMISSIONS.create"
            type="primary"
            plain
            @click="openCreate()"
          >
            新增用户
          </ElButton>
        </template>
      </EsListToolbar>

      <div class="table-wrapper">
        <EsTable
          v-model:page="page"
          v-model:page-size="pageSize"
          :columns="SYSTEM_USER_TABLE_COLUMNS"
          :data="tableData"
          :total="total"
          :loading="loading"
          table-height="100%"
          @action-click="({ row, action }) => handleAction(row, action.key)"
          @pagination-change="handlePaginationChange"
          @selection-change="handleSelectionChange"
        >
          <template #role="{ row }">{{ ROLE_LABELS[row.role] ?? row.role }}</template>
          <template #status="{ row }">
            <ElTag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </ElTag>
          </template>
          <template #lastLoginAt="{ row }">{{ formatDateTime(row.lastLoginAt) }}</template>
          <template #createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </EsTable>
      </div>
    </FaPageMain>

    <UserFormDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :user="currentRow"
      :loading="submitLoading"
      @submit="handleSubmit"
    />

    <ResetPasswordDialog
      v-model="resetPasswordVisible"
      :loading="resetLoading"
      @submit="handleResetPasswordSubmit"
    />
  </div>
</template>
