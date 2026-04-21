<script setup lang="ts">
import { Primitive, type PrimitiveProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'

import { cn } from '@/utils'

import { type ButtonVariants, buttonVariants } from '.'

interface ButtonProps extends PrimitiveProps {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
}

const {
  as = 'button',
  asChild,
  variant = 'default',
  size = 'default',
  class: className = '',
} = defineProps<ButtonProps>()
</script>

<template>
  <Primitive :as="as" :as-child="asChild" :class="cn(buttonVariants({ variant, size }), className)">
    <slot />
  </Primitive>
</template>
