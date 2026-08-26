<script setup lang="ts">
import { ElMessage, ElMessageBox, ElTag } from 'element-plus'

import type { SystemMenu } from '@/api/system/menu'
import systemMenuApi from '@/api/system/menu'
import type { SystemResource } from '@/api/system/resource'
import systemResourceApi from '@/api/system/resource'
import type { SearchFormData } from '@/components/common/EsSearch/types'
import { useCrudDialog } from '@/composables/useCrudDialog'

import MenuFormDialog from './components/MenuFormDialog.vue'
import PermissionDialog from './components/PermissionDialog.vue'
import { SYSTEM_MENU_DEFAULT_SEARCH } from './model/defaults'
import { buildSystemMenuCreatePayload, buildSystemMenuUpdatePayload } from './model/mapper'
import type { SystemMenuSearch } from './model/types'
import { createSystemMenuSearchFields } from './schemas/search'
import { SYSTEM_MENU_PERMISSIONS } from './auth'
import { canDeleteMenu, formatMenuTypeLabel } from './constants'

defineOptions({
  name: 'SystemMenu',
})

const loading = ref(false)
const submitLoading = ref(false)
const allMenuTree = ref<SystemMenu[]>([])
const resources = ref<SystemResource[]>([])
const permissionVisible = ref(false)
const selectedResourceIds = ref<number[]>([])
const createParentId = ref<number | null>(null)

const search = ref<SystemMenuSearch>({ ...SYSTEM_MENU_DEFAULT_SEARCH })

const { dialogVisible, dialogMode, currentRow, openEdit } = useCrudDialog<SystemMenu>()

function filterTree(
  nodes: SystemMenu[],
  keyword: string,
  menuType: string,
  status: string,
): SystemMenu[] {
  return nodes.reduce<SystemMenu[]>((result, node) => {
    const matchesKeyword =
      !keyword ||
      node.title.toLowerCase().includes(keyword) ||
      node.name.toLowerCase().includes(keyword)
    const matchesType = !menuType || node.menuType === menuType
    const matchesStatus = !status || node.status === status
    const matches = matchesKeyword && matchesType && matchesStatus

    const filteredChildren = node.children
      ? filterTree(node.children, keyword, menuType, status)
      : []

    if (matches || filteredChildren.length > 0) {
      result.push({
        ...node,
        children: filteredChildren,
      })
    }
    return result
  }, [])
}

const menuTree = computed(() => {
  const keyword = search.value.keyword.trim().toLowerCase()
  const menuType = search.value.menuType
  const status = search.value.status
  if (!keyword && !menuType && !status) {
    return allMenuTree.value
  }
  return filterTree(allMenuTree.value, keyword, menuType, status)
})

async function fetchTree() {
  loading.value = true
  try {
    allMenuTree.value = await systemMenuApi.tree()
  } finally {
    loading.value = false
  }
}

async function fetchResources() {
  resources.value = await systemResourceApi.list()
}

function handleSearch(formData: SearchFormData) {
  search.value = {
    keyword: String(formData.keyword ?? ''),
    menuType: String(formData.menuType ?? '') as SystemMenuSearch['menuType'],
    status: String(formData.status ?? '') as SystemMenuSearch['status'],
  }
}

function openCreate(parent?: SystemMenu | null) {
  dialogMode.value = 'create'
  currentRow.value = null
  createParentId.value = parent?.id ?? null
  dialogVisible.value = true
}

async function handleSubmit(payload: any) {
  submitLoading.value = true
  try {
    if (dialogMode.value === 'create') {
      await systemMenuApi.create(buildSystemMenuCreatePayload(payload))
      ElMessage.success('菜单已创建')
    } else if (currentRow.value) {
      await systemMenuApi.update(currentRow.value.id, {
        ...buildSystemMenuUpdatePayload(payload),
        expectedUpdatedAt: currentRow.value.updatedAt,
      })
      ElMessage.success('菜单已更新')
    }
    dialogVisible.value = false
    await fetchTree()
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: SystemMenu) {
  await ElMessageBox.confirm(`确定删除菜单 ${row.title} 吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  })
  await systemMenuApi.remove(row.id)
  ElMessage.success('菜单已删除')
  await fetchTree()
}

async function openPermissionDialog(row: SystemMenu) {
  currentRow.value = row
  selectedResourceIds.value = row.resources.map((item) => item.id)
  permissionVisible.value = true
}

async function handlePermissionSubmit() {
  if (!currentRow.value) {
    return
  }
  await systemMenuApi.updateResources(currentRow.value.id, {
    resourceIds: selectedResourceIds.value,
    expectedUpdatedAt: currentRow.value.updatedAt,
  })
  ElMessage.success('菜单资源已更新')
  permissionVisible.value = false
  await fetchTree()
}

onMounted(() => {
  Promise.all([fetchTree(), fetchResources()])
})
</script>

<template>
  <div class="absolute-container">
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 flex flex-col overflow-auto">
      <EsSearch
        v-model="search"
        :fields="createSystemMenuSearchFields()"
        :default-visible-count="2"
        @search="handleSearch"
      />

      <EsListToolbar>
        <template #actions>
          <ElButton
            v-auth="SYSTEM_MENU_PERMISSIONS.create"
            type="primary"
            plain
            @click="openCreate()"
          >
            新增根菜单
          </ElButton>
        </template>
      </EsListToolbar>

      <div class="table-wrapper">
        <ElTable
          v-loading="loading"
          :data="menuTree"
          border
          row-key="id"
          default-expand-all
          :tree-props="{ children: 'children' }"
          class="w-full"
          stripe
        >
          <ElTableColumn prop="title" label="菜单标题" min-width="180" />
          <ElTableColumn prop="name" label="菜单标识" min-width="160" />
          <ElTableColumn prop="path" label="路径" min-width="180" />
          <ElTableColumn prop="routeName" label="路由名" min-width="160" />
          <ElTableColumn label="类型" width="100">
            <template #default="{ row }">
              <ElTag size="small" :type="row.menuType === 'catalog' ? 'warning' : 'primary'">
                {{ formatMenuTypeLabel(row.menuType) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="sort" label="排序" width="80" />
          <ElTableColumn label="关联资源" width="110">
            <template #default="{ row }">
              <span>{{ row.resources.length }} 项</span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="状态" width="96">
            <template #default="{ row }">
              <ElTag :type="row.status === 'active' ? 'success' : 'info'">
                {{ row.status === 'active' ? '启用' : '停用' }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="可见" width="88">
            <template #default="{ row }">{{ row.visible ? '是' : '否' }}</template>
          </ElTableColumn>
          <ElTableColumn label="操作" fixed="right" width="320">
            <template #default="{ row }">
              <ElButton
                v-auth="SYSTEM_MENU_PERMISSIONS.create"
                link
                type="primary"
                @click="openCreate(row)"
              >
                新增子菜单
              </ElButton>
              <ElButton
                v-auth="SYSTEM_MENU_PERMISSIONS.update"
                link
                type="primary"
                @click="openEdit(row)"
              >
                编辑
              </ElButton>
              <ElButton
                v-auth="SYSTEM_MENU_PERMISSIONS.assignPermission"
                link
                type="primary"
                @click="openPermissionDialog(row)"
              >
                关联资源
              </ElButton>
              <ElButton
                v-if="canDeleteMenu(row)"
                v-auth="SYSTEM_MENU_PERMISSIONS.delete"
                link
                type="danger"
                @click="handleDelete(row)"
              >
                删除
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
    </FaPageMain>

    <MenuFormDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :menu="dialogMode === 'edit' ? currentRow : null"
      :parent-id="dialogMode === 'create' ? createParentId : null"
      :menu-tree="allMenuTree"
      :loading="submitLoading"
      @submit="handleSubmit"
    />

    <PermissionDialog
      v-model="permissionVisible"
      :resources="resources"
      :selected-ids="selectedResourceIds"
      @update:selected-ids="selectedResourceIds = $event"
      @submit="handlePermissionSubmit"
    />
  </div>
</template>
