<script setup lang="ts">
import { cn } from '@/utils'

defineOptions({
  name: 'FaDivider',
})

defineProps<{
  position?: 'start' | 'end'
}>()

const slots = defineSlots<{
  default?: () => VNode
}>()
</script>

<template>
  <div
    :class="
      cn(
        'flex-center font-500 after:(h-px bg-border content-empty) before:(h-px bg-border content-empty) my-4 w-full min-w-4 whitespace-nowrap text-sm',
        {
          'before:(flex-basis-0)': position === 'start',
          'after:(flex-basis-0)': position === 'end',
          'gap-4': !!slots.default,
        },
      )
    "
  >
    <slot />
  </div>
</template>
