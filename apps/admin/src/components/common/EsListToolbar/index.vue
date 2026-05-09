<script setup lang="ts">
defineOptions({
  name: 'EsListToolbar',
})

const {
  selectedCount = 0,
  showSelectionSummary = false,
  summaryLabel = '已选择',
  summaryUnit = '项',
} = defineProps<{
  selectedCount?: number
  showSelectionSummary?: boolean
  summaryLabel?: string
  summaryUnit?: string
}>()
</script>

<template>
  <div class="flex items-center justify-between gap-3 rounded-xl">
    <div v-if="showSelectionSummary" class="text-sm text-[rgb(var(--ui-muted-foreground))]">
      {{ summaryLabel }}
      <span class="text-primary font-semibold">{{ selectedCount }}</span>
      {{ summaryUnit }}
    </div>
    <div class="actions flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.actions ::v-deep(.el-button) {
  margin-bottom: 16px;
}
</style>
