<script setup lang="ts">
import { AvatarRoot } from 'radix-vue'
import type { HTMLAttributes } from 'vue'

import { cn } from '@/utils'

import { avatarVariant, type AvatarVariants } from '.'

const {
  class: className = '',
  size = 'sm',
  shape = 'circle',
} = defineProps<{
  class?: HTMLAttributes['class']
  size?: AvatarVariants['size']
  shape?: AvatarVariants['shape']
}>()
</script>

<template>
  <AvatarRoot :class="cn(avatarVariant({ size, shape }), className)">
    <slot />
  </AvatarRoot>
</template>
