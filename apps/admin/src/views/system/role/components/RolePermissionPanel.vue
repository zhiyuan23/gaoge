<script setup lang="ts">
import type { SystemRoleMenuNode, SystemRolePermissionModule } from '@/api/system/role'

defineOptions({
  name: 'RolePermissionPanel',
})

const props = defineProps<{
  menu: SystemRoleMenuNode | null
  permissionGroups: SystemRolePermissionModule[]
  modelValue: number[]
  disabled?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void
}>()

const selectedIds = ref<number[]>([])

const selectedCount = computed(() => selectedIds.value.length)
const isDisabled = computed(() => props.disabled || !props.menu)
const isEmpty = computed(() => props.permissionGroups.length === 0)

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
  <ElCard v-loading="loading" shadow="never" class="role-workspace-card">
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="font-600 text-base">当前菜单动作权限</div>
          <div class="role-panel-muted mt-1 text-xs">
            <template v-if="menu">
              围绕
              <span class="font-600">{{ menu.title }}</span>
              配置进入该菜单后的按钮和接口动作。
            </template>
            <template v-else>先从左侧菜单树中选择一个可授权入口。</template>
          </div>
        </div>
        <span class="role-panel-muted text-sm">已选 {{ selectedCount }} 项</span>
      </div>
    </template>

    <div class="role-permission-groups space-y-5">
      <ElEmpty
        v-if="isDisabled"
        description="未授权或未选择菜单时，无法配置该菜单下的动作权限"
        :image-size="72"
      />
      <ElEmpty v-else-if="isEmpty" description="当前菜单暂无挂载动作权限" :image-size="72" />
      <template v-else>
        <div v-for="moduleGroup in permissionGroups" :key="moduleGroup.module" class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="font-600 text-sm">{{ moduleGroup.label }}</div>
            <div class="role-panel-muted text-xs">{{ moduleGroup.resources.length }} 个资源组</div>
          </div>
          <div
            v-for="resourceGroup in moduleGroup.resources"
            :key="`${moduleGroup.module}-${resourceGroup.resource}`"
            class="role-permission-resource p-4"
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
            <ElCheckboxGroup v-model="selectedIds" :disabled="isDisabled">
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

.role-permission-groups {
  flex: 1;
  min-height: 0;
  padding-right: 4px;
  overflow: auto;
}

.role-permission-resource {
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
