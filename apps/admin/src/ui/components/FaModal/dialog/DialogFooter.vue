<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import { cn } from '@/utils'

const { class: className = '' } = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div :class="cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-x-2', className)">
    <slot />
  </div>
</template>
