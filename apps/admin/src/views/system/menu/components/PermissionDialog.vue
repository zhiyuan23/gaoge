<script setup lang="ts">
import type { SystemPermission } from '@/api/system/permission'

import { formatPermissionModules } from '../constants'

defineOptions({
  name: 'MenuPermissionDialog',
})

const props = defineProps<{
  modelValue: boolean
  permissionGroups: { module: string; permissions: SystemPermission[] }[]
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

const internalSelectedIds = computed({
  get: () => props.selectedIds,
  set: (value) => emit('update:selectedIds', value),
})

const displayGroups = computed(() => {
  return formatPermissionModules(props.permissionGroups, internalSelectedIds.value)
})
</script>

<template>
  <ElDialog v-model="visible" title="绑定权限" width="720px" destroy-on-close>
    <div class="text-secondary mb-3 text-sm">已选择 {{ internalSelectedIds.length }} 项权限</div>
    <div class="max-h-96 overflow-auto">
      <div v-for="moduleGroup in displayGroups" :key="moduleGroup.key" class="mb-5 last:mb-0">
        <div class="mb-3 flex items-center justify-between">
          <div class="font-600 text-sm">{{ moduleGroup.label }}</div>
          <div class="text-secondary text-xs">
            已选 {{ moduleGroup.selectedCount }} / {{ moduleGroup.resources.length }} 个资源组
          </div>
        </div>
        <div
          v-for="resourceGroup in moduleGroup.resources"
          :key="resourceGroup.key"
          class="mb-4 last:mb-0"
        >
          <div class="mb-2 flex items-center justify-between text-sm">
            <span>{{ resourceGroup.label }}</span>
            <span class="text-secondary text-xs">
              已选 {{ resourceGroup.selectedCount }} / {{ resourceGroup.permissions.length }}
            </span>
          </div>
          <ElCheckboxGroup v-model="internalSelectedIds">
            <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
              <ElCheckbox
                v-for="permission in resourceGroup.permissions"
                :key="permission.id"
                :value="permission.id"
              >
                <span>{{ permission.name }}</span>
                <span class="text-secondary ml-2 text-xs">{{ permission.code }}</span>
              </ElCheckbox>
            </div>
          </ElCheckboxGroup>
        </div>
      </div>
    </div>
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="emit('submit')">保存</ElButton>
    </template>
  </ElDialog>
</template>
