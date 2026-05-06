<script setup lang="ts">
import useAuth from '@/composables/useAuth'

import { isActionDisabled, isActionVisible } from './action'
import type { TableAction } from './types'

defineOptions({
  name: 'EsTableActionCell',
})

const props = defineProps({
  actions: {
    type: Array as PropType<TableAction[]>,
    default: () => [],
  },
  row: {
    type: Object as PropType<any>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'actionClick', action: TableAction): void
}>()

const { auth } = useAuth()

const ACTION_ICON_MAP = {
  edit: 'i-ri:edit-line',
  delete: 'i-ri:delete-bin-line',
  enable: 'i-ri:check-line',
  disable: 'i-ri:close-line',
  resetPassword: 'mdi:lock-reset',
  detail: 'i-ri:eye-line',
  view: 'i-ri:eye-line',
}

const DEFAULT_MORE_ICON = 'i-ri:more-line'

const visibleActions = computed(() => {
  return props.actions.filter((action) => isActionVisible(action, auth, props.row))
})

const primaryAction = computed(() => {
  return visibleActions.value[0]
})

const secondaryActions = computed(() => {
  return visibleActions.value.slice(1)
})

const shouldUseDropdown = computed(() => {
  return visibleActions.value.length > 2
})

const inlineActions = computed(() => {
  return shouldUseDropdown.value ? [primaryAction.value].filter(Boolean) : visibleActions.value
})

const dropdownItems = computed(() => {
  return [
    secondaryActions.value.map((action) => ({
      label: action.label,
      icon: getActionIcon(action),
      disabled: isActionDisabled(action, props.row),
      class:
        action.type === 'danger'
          ? 'text-destructive focus:text-destructive data-[highlighted]:text-destructive'
          : undefined,
      handle: () => handleActionClick(action),
    })),
  ]
})

// 统一返回操作按钮和下拉项使用的图标名称。
function getActionIcon(action?: TableAction) {
  if (!action) {
    return DEFAULT_MORE_ICON
  }

  if (action.icon) {
    return action.icon
  }

  return ACTION_ICON_MAP[action.key as keyof typeof ACTION_ICON_MAP] ?? DEFAULT_MORE_ICON
}

// 触发 action 点击前，先拦截已禁用的操作。
function handleActionClick(action?: TableAction) {
  if (!action || isActionDisabled(action, props.row)) {
    return
  }

  emit('actionClick', action)
}
</script>

<template>
  <div class="flex-center gap-2">
    <template v-if="visibleActions.length">
      <ElButton
        v-for="action in inlineActions"
        :key="action.key"
        plain
        circle
        class="table-action-icon-button"
        :class="{ 'table-action-icon-button-danger': action.type === 'danger' }"
        :disabled="isActionDisabled(action, row)"
        @click="handleActionClick(action)"
      >
        <FaIcon :name="getActionIcon(action)" class="size-4" />
      </ElButton>
      <FaDropdown
        v-if="shouldUseDropdown"
        content-class="min-w-max whitespace-nowrap"
        :items="dropdownItems"
      >
        <ElButton plain circle class="table-action-icon-button" aria-label="更多操作">
          <FaIcon :name="DEFAULT_MORE_ICON" class="size-4" />
        </ElButton>
      </FaDropdown>
    </template>
    <span v-else class="text-secondary">--</span>
  </div>
</template>

<style scoped>
:deep(.table-action-icon-button) {
  width: 32px;
  height: 32px;
  padding: 0;
  color: hsl(var(--foreground));
  background-color: hsl(var(--background));
  border: 1px solid hsl(var(--input));
  border-radius: calc(var(--radius) - 2px);
  box-shadow: var(--shadow-sm);
  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s;
}

:deep(.table-action-icon-button + .table-action-icon-button) {
  margin-left: 0;
}

:deep(.table-action-icon-button:hover:not(:disabled)),
:deep(.table-action-icon-button:focus-visible:not(:disabled)) {
  color: hsl(var(--accent-foreground));
  background-color: hsl(var(--accent));
}
</style>
