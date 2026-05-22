<script setup lang="ts">
import type { SystemRolePermissionModule } from '@/api/system/role'

defineOptions({
  name: 'RoleGlobalPermissionPanel',
})

const props = defineProps<{
  permissionGroups: SystemRolePermissionModule[]
  modelValue: number[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void
}>()

const selectedIds = ref<number[]>([])
const selectedCount = computed(() => selectedIds.value.length)

watch(
  () => props.modelValue,
  (value) => {
    selectedIds.value = [...value]
  },
  {
    immediate: true,
  },
)

watch(selectedIds, (value) => {
  emit('update:modelValue', value)
})
</script>

<template>
  <ElCard shadow="never" class="role-workspace-card">
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="font-600 text-base">全局动作权限</div>
          <div class="role-panel-muted mt-1 text-xs">
            不依赖具体菜单入口的系统级动作权限，仍参与本次统一保存。
          </div>
        </div>
        <span class="role-panel-muted text-sm">已选 {{ selectedCount }} 项</span>
      </div>
    </template>

    <div class="role-global-permission-groups space-y-5">
      <ElEmpty
        v-if="permissionGroups.length === 0"
        description="当前没有需要单独维护的全局动作权限"
        :image-size="72"
      />
      <template v-else>
        <div v-for="moduleGroup in permissionGroups" :key="moduleGroup.module" class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="font-600 text-sm">{{ moduleGroup.label }}</div>
            <div class="role-panel-muted text-xs">{{ moduleGroup.resources.length }} 个资源组</div>
          </div>
          <div
            v-for="resourceGroup in moduleGroup.resources"
            :key="`${moduleGroup.module}-${resourceGroup.resource}`"
            class="role-global-permission-resource p-4"
          >
            <div class="mb-3 flex items-center justify-between">
              <div class="font-500 text-sm">{{ resourceGroup.label }}</div>
              <div class="role-panel-muted text-xs">
                已选
                {{
                  modelValue.filter((id) =>
                    resourceGroup.permissions.some((item) => item.id === id),
                  ).length
                }}
                / {{ resourceGroup.permissions.length }}
              </div>
            </div>
            <ElCheckboxGroup v-model="selectedIds">
              <div class="grid grid-cols-1 gap-2 xl:grid-cols-2">
                <ElCheckbox
                  v-for="permission in resourceGroup.permissions"
                  :key="permission.id"
                  :value="permission.id"
                >
                  <div class="flex flex-col">
                    <span>{{ permission.name }}</span>
                    <span class="role-panel-muted text-xs">{{ permission.code }}</span>
                  </div>
                </ElCheckbox>
              </div>
            </ElCheckboxGroup>
          </div>
        </div>
      </template>
    </div>
  </ElCard>
</template>

<style scoped lang="scss">
.role-panel-muted {
  color: var(--el-text-color-regular);
}

.role-global-permission-groups {
  flex: 1;
  min-height: 0;
  padding-right: 4px;
  overflow: auto;
}

.role-global-permission-resource {
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
}

:deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

:deep(.el-checkbox) {
  align-items: start;
  width: 100%;
  min-width: 0;
  margin-right: 0;
}

:deep(.el-checkbox__label) {
  min-width: 0;
  padding-top: 1px;
  white-space: normal;
}
</style>
