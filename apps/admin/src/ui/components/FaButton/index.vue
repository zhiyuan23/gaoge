<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import type { ButtonVariants } from './button'
import { Button } from './button'

defineOptions({
  name: 'FaButton',
})

const {
  variant = undefined,
  size = undefined,
  class: className = '',
  disabled = false,
  loading = false,
} = defineProps<{
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
  disabled?: boolean
  loading?: boolean
}>()
</script>

<template>
  <Button :variant :size :disabled="disabled || loading" :class="className">
    <FaIcon v-if="loading" name="i-line-md:loading-twotone-loop" />
    <slot />
  </Button>
</template>
