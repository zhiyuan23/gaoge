<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import { cn } from '@/utils'

const { class: className = '' } = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('flex flex-col gap-y-1.5 text-center sm:text-start', className)">
    <slot />
  </div>
</template>
