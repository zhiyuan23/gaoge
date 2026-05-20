<script setup lang="ts">
import type { EsSummaryCardsProps } from './types'

defineOptions({
  name: 'EsSummaryCards',
})

const props = withDefaults(defineProps<EsSummaryCardsProps>(), {
  gridClass: '',
})

const CARD_BASE_CLASS =
  'group flex items-center justify-between rounded-xl border px-5 py-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md'

const BADGE_BASE_CLASS =
  'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-sm ring-1 ring-white/50 transition-all duration-300 dark:ring-white/10 group-hover:scale-110'

const COLOR_CLASS_MAP = {
  amber: {
    card: 'border-amber-200/70 bg-amber-50/65 dark:border-amber-900/40 dark:bg-amber-950/18',
    label: 'text-amber-700/70 dark:text-amber-300/70',
    value: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-white/70 text-amber-700 dark:bg-amber-900/38 dark:text-amber-300',
  },
  emerald: {
    card: 'border-emerald-200/70 bg-emerald-50/65 dark:border-emerald-900/40 dark:bg-emerald-950/18',
    label: 'text-emerald-700/70 dark:text-emerald-300/70',
    value: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-white/70 text-emerald-700 dark:bg-emerald-900/38 dark:text-emerald-300',
  },
  rose: {
    card: 'border-rose-200/70 bg-rose-50/65 dark:border-rose-900/40 dark:bg-rose-950/18',
    label: 'text-rose-700/70 dark:text-rose-300/70',
    value: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-white/70 text-rose-700 dark:bg-rose-900/38 dark:text-rose-300',
  },
  sky: {
    card: 'border-sky-200/70 bg-sky-50/65 dark:border-sky-900/40 dark:bg-sky-950/18',
    label: 'text-sky-700/70 dark:text-sky-300/70',
    value: 'text-sky-700 dark:text-sky-300',
    badge: 'bg-white/70 text-sky-700 dark:bg-sky-900/38 dark:text-sky-300',
  },
  slate: {
    card: 'border-slate-200/70 bg-slate-50/65 dark:border-slate-800/70 dark:bg-slate-900/30',
    label: 'text-slate-600/80 dark:text-slate-300/70',
    value: 'text-slate-700 dark:text-slate-200',
    badge: 'bg-white/70 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200',
  },
} as const

const DEFAULT_GRID_COLUMN_CLASS_MAP = {
  1: 'xl:grid-cols-1',
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
} as const

const resolvedGridClass = computed(() => {
  if (props.gridClass) {
    return props.gridClass
  }

  const columnCount = Math.min(
    Math.max(props.items.length, 1),
    4,
  ) as keyof typeof DEFAULT_GRID_COLUMN_CLASS_MAP

  return [
    'mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2',
    DEFAULT_GRID_COLUMN_CLASS_MAP[columnCount],
  ].join(' ')
})

const normalizedItems = computed(() =>
  props.items.map((item) => {
    const color = item.color ?? 'slate'
    const classes = COLOR_CLASS_MAP[color]

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
  <div :class="resolvedGridClass">
    <div v-for="item in normalizedItems" :key="item.key" :class="item.cardClass">
      <div class="min-w-0">
        <div :class="item.labelClass">{{ item.label }}</div>
        <div :class="item.valueClass">{{ item.value }}</div>
      </div>
      <div v-if="item.badge" :class="item.badgeClass">{{ item.badge }}</div>
    </div>
  </div>
</template>
