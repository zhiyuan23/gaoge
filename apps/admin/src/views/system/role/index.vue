<route lang="yaml">
meta:
  title: 角色管理
</route>

<script setup lang="ts">
import { ElMessage, ElMessageBox, ElTag } from 'element-plus'

import type { GroupedSystemPermissionResponse } from '@/api/system/permission'
import systemPermissionApi from '@/api/system/permission'
import type { SystemRole } from '@/api/system/role'
import systemRoleApi from '@/api/system/role'
import type { SearchFormData } from '@/components/common/EsSearch/types'
import { useCrudDialog } from '@/composables/useCrudDialog'

import PermissionDialog from './components/PermissionDialog.vue'
import RoleFormDialog from './components/RoleFormDialog.vue'
import { SYSTEM_ROLE_DEFAULT_SEARCH } from './model/defaults'
import { buildSystemRoleCreatePayload, buildSystemRoleUpdatePayload } from './model/mapper'
import type { SystemRoleSearch } from './model/types'
import { createSystemRoleSearchFields } from './schemas/search'
import { SYSTEM_ROLE_TABLE_COLUMNS } from './schemas/table'
import { SYSTEM_ROLE_PERMISSIONS } from './auth'

defineOptions({
  name: 'SystemRole',
})

const submitLoading = ref(false)
const allRoles = ref<SystemRole[]>([])
const loading = ref(false)
const permissionGroups = ref<GroupedSystemPermissionResponse['groups']>([])
const permissionVisible = ref(false)
const selectedPermissionIds = ref<number[]>([])

const search = ref<SystemRoleSearch>({ ...SYSTEM_ROLE_DEFAULT_SEARCH })

const { dialogVisible, dialogMode, currentRow, openCreate, openEdit } = useCrudDialog<SystemRole>()

const roleList = computed(() => {
  let list = allRoles.value
  const keyword = search.value.keyword.trim().toLowerCase()
  const status = search.value.status
  if (keyword) {
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) || item.code.toLowerCase().includes(keyword),
    )
  }
  if (status) {
    list = list.filter((item) => item.status === status)
  }
  return list
})

async function fetchList() {
  loading.value = true
  try {
    allRoles.value = await systemRoleApi.list()
  } finally {
    loading.value = false
  }
}

async function fetchPermissionGroups() {
  const res = await systemPermissionApi.grouped()
  permissionGroups.value = res.groups
}

function handleSearch(formData: SearchFormData) {
  search.value = {
    keyword: String(formData.keyword ?? ''),
    status: String(formData.status ?? '') as SystemRoleSearch['status'],
  }
}

async function handleSubmit(payload: any) {
  submitLoading.value = true
  try {
    if (dialogMode.value === 'create') {
      await systemRoleApi.create(buildSystemRoleCreatePayload(payload))
      ElMessage.success('角色已创建')
    } else if (currentRow.value) {
      await systemRoleApi.update(currentRow.value.id, buildSystemRoleUpdatePayload(payload))
      ElMessage.success('角色已更新')
    }
    dialogVisible.value = false
    await fetchList()
  } finally {
    submitLoading.value = false
  }
}

async function handleAction(row: SystemRole, key: string) {
  if (key === 'edit') {
    openEdit(row)
    return
  }

  if (key === 'enable' || key === 'disable') {
    await systemRoleApi.updateStatus(row.id, {
      status: key === 'enable' ? 'active' : 'inactive',
    })
    ElMessage.success(key === 'enable' ? '角色已启用' : '角色已停用')
    await fetchList()
    return
  }

  if (key === 'assignPermission') {
    currentRow.value = row
    const permissions = await systemRoleApi.permissions(row.id)
    selectedPermissionIds.value = permissions.map((item) => item.id)
    permissionVisible.value = true
    return
  }

  if (key === 'delete') {
    await ElMessageBox.confirm(`确定删除角色 ${row.name} 吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await systemRoleApi.remove(row.id)
    ElMessage.success('角色已删除')
    await fetchList()
  }
}

async function handlePermissionSubmit() {
  if (!currentRow.value) {
    return
  }
  await systemRoleApi.updatePermissions(currentRow.value.id, {
    permissionIds: selectedPermissionIds.value,
  })
  ElMessage.success('角色权限已更新')
  permissionVisible.value = false
  await fetchList()
}

onMounted(() => {
  Promise.all([fetchList(), fetchPermissionGroups()])
})
</script>

<template>
  <div class="absolute-container">
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 flex flex-col overflow-auto">
      <EsSearch
        v-model="search"
        :fields="createSystemRoleSearchFields()"
        :default-visible-count="2"
        @search="handleSearch"
      />

      <EsListToolbar>
        <template #actions>
          <ElButton
            v-auth="SYSTEM_ROLE_PERMISSIONS.create"
            type="primary"
            plain
            @click="openCreate()"
          >
            新增角色
          </ElButton>
        </template>
      </EsListToolbar>

      <div class="table-wrapper">
        <EsTable
          :columns="SYSTEM_ROLE_TABLE_COLUMNS"
          :data="roleList"
          :total="roleList.length"
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

    <RoleFormDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :role="currentRow"
      :loading="submitLoading"
      @submit="handleSubmit"
    />

    <PermissionDialog
      v-model="permissionVisible"
      :permission-groups="permissionGroups"
      :selected-ids="selectedPermissionIds"
      @update:selected-ids="selectedPermissionIds = $event"
      @submit="handlePermissionSubmit"
    />
  </div>
</template>
