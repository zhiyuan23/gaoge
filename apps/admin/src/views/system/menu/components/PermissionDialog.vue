<script setup lang="ts">
import type { SystemResource } from '@/api/system/resource'

defineOptions({
  name: 'MenuPermissionDialog',
})

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

const internalSelectedIds = computed<number[]>({
  get: () => props.selectedIds,
  set: (value) => emit('update:selectedIds', value),
})

const displayGroups = computed(() =>
  Object.entries(
    props.resources.reduce<Record<string, SystemResource[]>>((groups, resource) => {
      ;(groups[resource.module] ??= []).push(resource)
      return groups
    }, {}),
  ).map(([module, resources]) => ({ module, resources })),
)
</script>

<template>
  <ElDialog v-model="visible" title="关联资源" width="720px" destroy-on-close>
    <div class="text-secondary mb-3 text-sm">
      页面关联多个资源时采用 ANY 可见语义；目录不能关联资源。已选择
      {{ internalSelectedIds.length }} 项资源。
    </div>
    <div class="max-h-96 overflow-auto">
      <div v-for="moduleGroup in displayGroups" :key="moduleGroup.module" class="mb-5 last:mb-0">
        <div class="font-600 mb-3 text-sm">{{ moduleGroup.module }}</div>
        <ElCheckboxGroup v-model="internalSelectedIds">
          <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
            <ElCheckbox
              v-for="resource in moduleGroup.resources"
              :key="resource.id"
              :value="resource.id"
              :disabled="resource.status !== 'active'"
            >
              <span>{{ resource.name }}</span>
              <span class="text-secondary ml-2 text-xs">{{ resource.key }}</span>
            </ElCheckbox>
          </div>
        </ElCheckboxGroup>
      </div>
    </div>
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="emit('submit')">保存</ElButton>
    </template>
  </ElDialog>
</template>
