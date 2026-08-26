<script setup lang="ts">
import { ElMessage, ElMessageBox, ElTag } from 'element-plus'

import type { SystemPermission } from '@/api/system/permission'
import systemPermissionApi from '@/api/system/permission'
import type { SearchFormData } from '@/components/common/EsSearch/types'

import PermissionFormDialog from './components/PermissionFormDialog.vue'
import { SYSTEM_PERMISSION_DEFAULT_SEARCH } from './model/defaults'
import {
  buildSystemPermissionCreatePayload,
  buildSystemPermissionSearchParams,
  buildSystemPermissionUpdatePayload,
} from './model/mapper'
import type { SystemPermissionSearch } from './model/types'
import { createSystemPermissionSearchFields } from './schemas/search'
import { SYSTEM_PERMISSION_TABLE_COLUMNS } from './schemas/table'
import { SYSTEM_PERMISSION_PERMISSIONS } from './auth'
import { formatModuleOptions } from './constants'

defineOptions({
  name: 'SystemPermission',
})

const loading = ref(false)
const submitLoading = ref(false)
const permissionList = ref<SystemPermission[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const currentPermission = ref<SystemPermission | null>(null)

const search = ref<SystemPermissionSearch>({ ...SYSTEM_PERMISSION_DEFAULT_SEARCH })

const moduleOptions = computed(() => formatModuleOptions(permissionList.value))
const searchFields = computed(() => createSystemPermissionSearchFields(moduleOptions.value))

async function fetchList() {
  loading.value = true
  try {
    const params = buildSystemPermissionSearchParams(search.value)
    permissionList.value = await systemPermissionApi.list(params)
  } finally {
    loading.value = false
  }
}

function handleSearch(formData: SearchFormData) {
  search.value = {
    keyword: String(formData.keyword ?? ''),
    module: String(formData.module ?? ''),
    status: String(formData.status ?? '') as SystemPermissionSearch['status'],
  }
  fetchList()
}

function openEdit(row: SystemPermission) {
  dialogMode.value = 'edit'
  currentPermission.value = row
  dialogVisible.value = true
}

function openCreate() {
  dialogMode.value = 'create'
  currentPermission.value = null
  dialogVisible.value = true
}

async function handleSubmit(payload: any) {
  submitLoading.value = true
  try {
    if (dialogMode.value === 'create') {
      await systemPermissionApi.create(buildSystemPermissionCreatePayload(payload))
      ElMessage.success('权限已创建')
    } else if (currentPermission.value) {
      await systemPermissionApi.update(
        currentPermission.value.id,
        buildSystemPermissionUpdatePayload(payload),
      )
      ElMessage.success('权限信息已更新')
    }
    dialogVisible.value = false
    await fetchList()
  } finally {
    submitLoading.value = false
  }
}

async function handleSync() {
  await systemPermissionApi.syncBuiltIns()
  ElMessage.success('内置权限已同步')
  await fetchList()
}

async function handleAction(row: SystemPermission, key: string) {
  if (key === 'edit') {
    openEdit(row)
    return
  }

  if (key === 'delete') {
    await ElMessageBox.confirm(`确定删除权限 ${row.name} 吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await systemPermissionApi.remove(row.id)
    ElMessage.success('权限已删除')
    await fetchList()
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
        :fields="searchFields"
        :default-visible-count="2"
        @search="handleSearch"
      />

      <EsListToolbar>
        <template #actions>
          <ElButton
            v-auth="SYSTEM_PERMISSION_PERMISSIONS.create"
            type="primary"
            plain
            @click="openCreate"
          >
            新增权限
          </ElButton>
          <ElButton
            v-auth="SYSTEM_PERMISSION_PERMISSIONS.syncBuiltIns"
            type="default"
            plain
            @click="handleSync"
          >
            同步内置权限
          </ElButton>
        </template>
      </EsListToolbar>

      <div class="table-wrapper">
        <EsTable
          :columns="SYSTEM_PERMISSION_TABLE_COLUMNS"
          :data="permissionList"
          :total="permissionList.length"
          :loading="loading"
          :show-pagination="false"
          table-height="100%"
          @action-click="({ row, action }) => handleAction(row, action.key)"
        >
          <template #status="{ row }">
            <ElTag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </ElTag>
          </template>
          <template #isBuiltIn="{ row }">
            {{ row.isBuiltIn ? '是' : '否' }}
          </template>
        </EsTable>
      </div>
    </FaPageMain>

    <PermissionFormDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :permission="currentPermission"
      :loading="submitLoading"
      @submit="handleSubmit"
    />
  </div>
</template>
