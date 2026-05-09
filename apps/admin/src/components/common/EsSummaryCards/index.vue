<script setup lang="ts">
import type { EsSummaryCardsProps } from './types'

defineOptions({
  name: 'EsSummaryCards',
})

const { items, gridClass = 'mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4' } =
  defineProps<EsSummaryCardsProps>()

const CARD_BASE_CLASS =
  'group flex items-center justify-between rounded-xl border px-5 py-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md'

const BADGE_BASE_CLASS =
  'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-sm ring-1 ring-white/50 transition-all duration-300 dark:ring-white/10 group-hover:scale-110'

/**
 * 根据 Tailwind 颜色名生成卡片各部分的样式类。
 * 统一使用透明度/深浅度方案：背景 bg-{color}-50/65，边框 border-{color}-200/70 等
 */
function buildColorClasses(color: string) {
  return {
    card: `border-${color}-200/70 bg-${color}-50/65 dark:border-${color}-900/40 dark:bg-${color}-950/18`,
    label: `text-${color}-700/70 dark:text-${color}-300/70`,
    value: `text-${color}-700 dark:text-${color}-300`,
    badge: `bg-white/70 text-${color}-700 dark:bg-${color}-900/38 dark:text-${color}-300`,
  }
}

const normalizedItems = computed(() =>
  items.map((item) => {
    const color = item.color ?? 'slate'
    const classes = buildColorClasses(color)

    return {
      ...item,
      cardClass: [CARD_BASE_CLASS, classes.card, item.cardClass].filter(Boolean).join(' '),
      labelClass: ['text-xs', classes.label, item.labelClass].filter(Boolean).join(' '),
      valueClass: ['mt-1 text-xl font-semibold leading-none', classes.value, item.valueClass]
        .filter(Boolean)
        .join(' '),
      badgeClass: [BADGE_BASE_CLASS, classes.badge, item.badgeClass].filter(Boolean).join(' '),
    }
  }),
)
</script>

<template>
  <div :class="gridClass">
    <div v-for="item in normalizedItems" :key="item.key" :class="item.cardClass">
      <div class="min-w-0">
        <div :class="item.labelClass">{{ item.label }}</div>
        <div :class="item.valueClass">{{ item.value }}</div>
      </div>
      <div v-if="item.badge" :class="item.badgeClass">{{ item.badge }}</div>
    </div>
  </div>
</template>
