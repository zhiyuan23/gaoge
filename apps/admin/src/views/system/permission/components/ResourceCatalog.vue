<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'

import type { SystemPermission } from '@/api/system/permission'
import systemPermissionApi from '@/api/system/permission'
import type { SystemResource } from '@/api/system/resource'
import systemResourceApi from '@/api/system/resource'

const loading = ref(false)
const resources = ref<SystemResource[]>([])
const keyword = ref('')
const resourceDialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const editingResource = ref<SystemResource | null>(null)
const editingPermission = ref<SystemPermission | null>(null)
const selectedResource = ref<SystemResource | null>(null)

const resourceForm = reactive({ key: '', name: '', module: '', description: '', sort: 0 })
const permissionForm = reactive({
  action: '',
  name: '',
  description: '',
  status: 'active' as const,
})

const filteredResources = computed(() => {
  const value = keyword.value.trim().toLowerCase()
  return value
    ? resources.value.filter(
        (resource) =>
          resource.name.toLowerCase().includes(value) || resource.key.toLowerCase().includes(value),
      )
    : resources.value
})

async function fetchResources() {
  loading.value = true
  try {
    resources.value = await systemResourceApi.list()
  } finally {
    loading.value = false
  }
}

function openCreateResource() {
  editingResource.value = null
  Object.assign(resourceForm, { key: '', name: '', module: '', description: '', sort: 0 })
  resourceDialogVisible.value = true
}

function openEditResource(resource: SystemResource) {
  editingResource.value = resource
  Object.assign(resourceForm, {
    key: resource.key,
    name: resource.name,
    module: resource.module,
    description: resource.description ?? '',
    sort: resource.sort,
  })
  resourceDialogVisible.value = true
}

async function saveResource() {
  if (editingResource.value) {
    await systemResourceApi.update(editingResource.value.id, {
      name: resourceForm.name,
      module: resourceForm.module,
      description: resourceForm.description || undefined,
      sort: resourceForm.sort,
      expectedUpdatedAt: editingResource.value.updatedAt,
    })
    ElMessage.success('资源已更新')
  } else {
    await systemResourceApi.create({
      key: resourceForm.key,
      name: resourceForm.name,
      module: resourceForm.module,
      description: resourceForm.description || undefined,
      sort: resourceForm.sort,
    })
    ElMessage.success('资源及查看权限已创建')
  }
  resourceDialogVisible.value = false
  await fetchResources()
}

async function toggleResource(resource: SystemResource) {
  await systemResourceApi.updateStatus(resource.id, {
    status: resource.status === 'active' ? 'inactive' : 'active',
    expectedUpdatedAt: resource.updatedAt,
  })
  ElMessage.success(resource.status === 'active' ? '资源已停用' : '资源已启用')
  await fetchResources()
}

async function removeResource(resource: SystemResource) {
  await ElMessageBox.confirm(`确定删除资源 ${resource.name} 吗？`, '删除确认', {
    type: 'warning',
  })
  await systemResourceApi.remove(resource.id)
  ElMessage.success('资源已删除')
  await fetchResources()
}

function openCreatePermission(resource: SystemResource) {
  selectedResource.value = resource
  editingPermission.value = null
  Object.assign(permissionForm, { action: '', name: '', description: '', status: 'active' })
  permissionDialogVisible.value = true
}

function openEditPermission(resource: SystemResource, permission: SystemPermission) {
  selectedResource.value = resource
  editingPermission.value = permission
  Object.assign(permissionForm, {
    action: permission.action,
    name: permission.name,
    description: permission.description ?? '',
    status: permission.status,
  })
  permissionDialogVisible.value = true
}

async function savePermission() {
  if (!selectedResource.value) return
  if (editingPermission.value) {
    await systemPermissionApi.update(editingPermission.value.id, {
      name: permissionForm.name,
      description: permissionForm.description || undefined,
      status: permissionForm.status,
      expectedUpdatedAt: editingPermission.value.updatedAt,
    })
    ElMessage.success('权限已更新')
  } else {
    await systemResourceApi.createPermission(selectedResource.value.id, {
      action: permissionForm.action,
      name: permissionForm.name,
      description: permissionForm.description || undefined,
      status: permissionForm.status,
    })
    ElMessage.success('权限已创建')
  }
  permissionDialogVisible.value = false
  await fetchResources()
}

async function removePermission(permission: SystemPermission) {
  await ElMessageBox.confirm(`确定删除权限 ${permission.name} 吗？`, '删除确认', {
    type: 'warning',
  })
  await systemPermissionApi.remove(permission.id)
  ElMessage.success('权限已删除')
  await fetchResources()
}

onMounted(fetchResources)
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="mb-3 flex items-center gap-3">
      <ElInput v-model="keyword" clearable placeholder="搜索资源名称或 key" class="max-w-80" />
      <ElButton
        v-auth="'system.permission.create'"
        type="primary"
        plain
        @click="openCreateResource"
      >
        新增资源
      </ElButton>
    </div>
    <ElTable v-loading="loading" :data="filteredResources" row-key="id" border stripe>
      <ElTableColumn type="expand">
        <template #default="{ row }">
          <div class="px-4 py-2">
            <div class="mb-2 flex items-center justify-between">
              <strong>权限动作</strong>
              <ElButton
                v-auth="'system.permission.create'"
                link
                type="primary"
                @click="openCreatePermission(row)"
              >
                新增权限
              </ElButton>
            </div>
            <ElTable :data="row.permissions" size="small">
              <ElTableColumn prop="name" label="权限名称" min-width="150" />
              <ElTableColumn prop="code" label="权限码" min-width="220" />
              <ElTableColumn prop="status" label="状态" width="90" />
              <ElTableColumn label="授权角色" min-width="160">
                <template #default="scope">
                  {{ scope.row.roles.map((role: { name: string }) => role.name).join('、') || '-' }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="操作" width="150">
                <template #default="scope">
                  <ElButton
                    v-auth="'system.permission.update'"
                    link
                    type="primary"
                    @click="openEditPermission(row, scope.row)"
                    >编辑</ElButton
                  >
                  <ElButton
                    v-if="!scope.row.isBuiltIn"
                    v-auth="'system.permission.delete'"
                    link
                    type="danger"
                    @click="removePermission(scope.row)"
                    >删除</ElButton
                  >
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="name" label="资源名称" min-width="150" />
      <ElTableColumn prop="key" label="资源 key" min-width="220" />
      <ElTableColumn prop="module" label="模块" width="120" />
      <ElTableColumn prop="roleCount" label="角色数" width="90" />
      <ElTableColumn label="关联菜单" min-width="160">
        <template #default="{ row }">{{
          row.menus.map((menu: { title: string }) => menu.title).join('、') || '-'
        }}</template>
      </ElTableColumn>
      <ElTableColumn prop="status" label="状态" width="90" />
      <ElTableColumn label="操作" width="210" fixed="right">
        <template #default="{ row }">
          <ElButton
            v-auth="'system.permission.update'"
            link
            type="primary"
            @click="openEditResource(row)"
            >编辑</ElButton
          >
          <ElButton
            v-if="!row.isBuiltIn"
            v-auth="'system.permission.update'"
            link
            type="warning"
            @click="toggleResource(row)"
            >{{ row.status === 'active' ? '停用' : '启用' }}</ElButton
          >
          <ElButton
            v-if="!row.isBuiltIn"
            v-auth="'system.permission.delete'"
            link
            type="danger"
            @click="removeResource(row)"
            >删除</ElButton
          >
        </template>
      </ElTableColumn>
    </ElTable>

    <ElDialog
      v-model="resourceDialogVisible"
      :title="editingResource ? '编辑资源' : '新增资源'"
      width="520px"
    >
      <ElForm label-width="90px">
        <ElFormItem label="资源 key"
          ><ElInput
            v-model="resourceForm.key"
            :disabled="Boolean(editingResource)"
            placeholder="module.resource"
        /></ElFormItem>
        <ElFormItem label="资源名称"><ElInput v-model="resourceForm.name" /></ElFormItem>
        <ElFormItem label="模块"
          ><ElInput v-model="resourceForm.module" :disabled="Boolean(editingResource)"
        /></ElFormItem>
        <ElFormItem label="说明"
          ><ElInput v-model="resourceForm.description" type="textarea"
        /></ElFormItem>
        <ElFormItem label="排序"><ElInputNumber v-model="resourceForm.sort" /></ElFormItem>
      </ElForm>
      <template #footer
        ><ElButton @click="resourceDialogVisible = false">取消</ElButton
        ><ElButton type="primary" @click="saveResource">保存</ElButton></template
      >
    </ElDialog>

    <ElDialog
      v-model="permissionDialogVisible"
      :title="editingPermission ? '编辑权限' : '新增权限'"
      width="520px"
    >
      <ElForm label-width="90px">
        <ElFormItem label="操作标识"
          ><ElInput
            v-model="permissionForm.action"
            :disabled="Boolean(editingPermission)"
            placeholder="publish"
        /></ElFormItem>
        <ElFormItem label="权限名称"><ElInput v-model="permissionForm.name" /></ElFormItem>
        <ElFormItem label="说明"
          ><ElInput v-model="permissionForm.description" type="textarea"
        /></ElFormItem>
        <ElFormItem label="状态"
          ><ElRadioGroup v-model="permissionForm.status"
            ><ElRadio value="active">启用</ElRadio
            ><ElRadio value="inactive">停用</ElRadio></ElRadioGroup
          ></ElFormItem
        >
      </ElForm>
      <template #footer
        ><ElButton @click="permissionDialogVisible = false">取消</ElButton
        ><ElButton type="primary" @click="savePermission">保存</ElButton></template
      >
    </ElDialog>
  </div>
</template>
