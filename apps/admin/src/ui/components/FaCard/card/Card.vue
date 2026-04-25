<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import { cn } from '@/utils'

const { class: className = '' } = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('bg-card text-card-foreground rounded-lg border shadow-sm', className)">
    <slot />
  </div>
</template>
