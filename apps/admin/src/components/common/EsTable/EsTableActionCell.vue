<script setup lang="ts">
import useAuth from '@/composables/useAuth'

import {
  isActionDisabled,
  isActionLoading,
  isActionVisible,
  partitionActions,
  shouldDisableActionTooltips,
} from './action'
import type { TableAction } from './types'

defineOptions({
  name: 'EsTableActionCell',
})

const props = defineProps({
  actions: {
    type: Array as PropType<TableAction[]>,
    default: () => [],
  },
  inlineLimit: {
    type: Number,
    default: 2,
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
  publish: 'i-ri:send-plane-line',
  republish: 'i-ri:refresh-line',
  offline: 'i-ri:stop-circle-line',
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

const actionLayout = computed(() => partitionActions(visibleActions.value, props.inlineLimit))
const shouldUseDropdown = computed(() => actionLayout.value.useDropdown)
const inlineActions = computed(() => actionLayout.value.inlineActions)
const secondaryActions = computed(() => actionLayout.value.secondaryActions)
const rowBusy = computed(() =>
  visibleActions.value.some((action) => isActionLoading(action, props.row)),
)
const disableActionTooltips = computed(() =>
  shouldDisableActionTooltips(inlineActions.value.length, shouldUseDropdown.value),
)

const dropdownItems = computed(() => {
  return [
    secondaryActions.value.map((action) => ({
      label: isActionLoading(action, props.row) ? `${action.label}（处理中）` : action.label,
      icon: getActionIcon(action),
      disabled: rowBusy.value || isActionDisabled(action, props.row),
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
  if (!action || rowBusy.value || isActionDisabled(action, props.row)) {
    return
  }

  emit('actionClick', action)
}
</script>

<template>
  <div class="flex-center gap-2">
    <template v-if="visibleActions.length">
      <ElTooltip
        v-for="action in inlineActions"
        :key="action.key"
        :content="action.label"
        placement="top"
        :show-after="300"
        :disabled="disableActionTooltips"
      >
        <span class="inline-flex">
          <ElButton
            plain
            circle
            class="table-action-icon-button"
            :class="{ 'table-action-icon-button-danger': action.type === 'danger' }"
            :aria-label="action.label"
            :disabled="(rowBusy && !isActionLoading(action, row)) || isActionDisabled(action, row)"
            :loading="isActionLoading(action, row)"
            @click="handleActionClick(action)"
          >
            <FaIcon :name="getActionIcon(action)" class="size-4" />
          </ElButton>
        </span>
      </ElTooltip>
      <ElTooltip
        v-if="shouldUseDropdown"
        content="更多操作"
        placement="top"
        :show-after="300"
        :disabled="disableActionTooltips"
      >
        <span class="inline-flex">
          <FaDropdown content-class="min-w-max whitespace-nowrap" :items="dropdownItems">
            <ElButton
              plain
              circle
              class="table-action-icon-button"
              aria-label="更多操作"
              :disabled="rowBusy"
              :loading="rowBusy"
            >
              <FaIcon :name="DEFAULT_MORE_ICON" class="size-4" />
            </ElButton>
          </FaDropdown>
        </span>
      </ElTooltip>
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
