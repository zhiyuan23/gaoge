<script setup lang="ts">
import type { SystemResource } from '@/api/system/resource'

defineOptions({ name: 'RolePermissionDialog' })

const props = defineProps<{
  modelValue: boolean
  resources: SystemResource[]
  selectedIds: number[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:selectedIds', ids: number[]): void
  (e: 'submit'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
const selectedSet = computed(() => new Set(props.selectedIds))
const moduleGroups = computed(() =>
  Object.entries(
    props.resources.reduce<Record<string, SystemResource[]>>((groups, resource) => {
      ;(groups[resource.module] ??= []).push(resource)
      return groups
    }, {}),
  ).map(([module, resources]) => ({ module, resources })),
)

function permissionIds(resources: SystemResource[]) {
  return resources.flatMap((resource) => resource.permissions.map((permission) => permission.id))
}

function selectionState(ids: number[]) {
  const selectedCount = ids.filter((id) => selectedSet.value.has(id)).length
  return {
    checked: ids.length > 0 && selectedCount === ids.length,
    indeterminate: selectedCount > 0 && selectedCount < ids.length,
  }
}

function replaceSelection(next: Set<number>) {
  emit(
    'update:selectedIds',
    [...next].sort((a, b) => a - b),
  )
}

function togglePermissions(resources: SystemResource[], checked: boolean) {
  const next = new Set(props.selectedIds)
  for (const id of permissionIds(resources)) {
    checked ? next.add(id) : next.delete(id)
  }
  replaceSelection(next)
}

function togglePermission(resource: SystemResource, permissionId: number, checked: boolean) {
  const next = new Set(props.selectedIds)
  const viewPermission = resource.permissions.find((permission) => permission.action === 'view')
  if (checked) {
    next.add(permissionId)
    if (viewPermission) next.add(viewPermission.id)
  } else if (viewPermission?.id === permissionId) {
    for (const permission of resource.permissions) next.delete(permission.id)
  } else {
    next.delete(permissionId)
  }
  replaceSelection(next)
}
</script>

<template>
  <ElDialog v-model="visible" title="分配权限" width="820px" destroy-on-close>
    <div class="text-secondary mb-3 text-sm">
      按“模块 → 资源 → 权限”授权；选择操作权限会自动补齐查看权限。已选
      {{ selectedIds.length }} 项。
    </div>
    <div class="max-h-96 overflow-auto pr-2">
      <section v-for="group in moduleGroups" :key="group.module" class="mb-5 rounded border p-3">
        <div class="mb-3 flex items-center justify-between">
          <ElCheckbox
            :model-value="selectionState(permissionIds(group.resources)).checked"
            :indeterminate="selectionState(permissionIds(group.resources)).indeterminate"
            @change="togglePermissions(group.resources, Boolean($event))"
          >
            <strong>{{ group.module }}</strong>
          </ElCheckbox>
          <span class="text-secondary text-xs">{{ group.resources.length }} 个资源</span>
        </div>
        <div v-for="resource in group.resources" :key="resource.id" class="mb-3 pl-4 last:mb-0">
          <ElCheckbox
            :model-value="selectionState(permissionIds([resource])).checked"
            :indeterminate="selectionState(permissionIds([resource])).indeterminate"
            @change="togglePermissions([resource], Boolean($event))"
          >
            {{ resource.name }}
            <span class="text-secondary ml-1 text-xs">{{ resource.key }}</span>
          </ElCheckbox>
          <div class="mt-2 grid grid-cols-1 gap-2 pl-6 md:grid-cols-2">
            <ElCheckbox
              v-for="permission in resource.permissions"
              :key="permission.id"
              :model-value="selectedSet.has(permission.id)"
              :disabled="permission.status !== 'active' || resource.status !== 'active'"
              @change="togglePermission(resource, permission.id, Boolean($event))"
            >
              {{ permission.name }}
              <span class="text-secondary ml-1 text-xs">{{ permission.action }}</span>
            </ElCheckbox>
          </div>
        </div>
      </section>
    </div>
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="emit('submit')">保存</ElButton>
    </template>
  </ElDialog>
</template>
