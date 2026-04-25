<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import type { AvatarVariants } from './avatar'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'

const {
  src,
  fallback = '',
  shape = undefined,
  class: className = '',
} = defineProps<{
  src: string
  fallback?: string
  shape?: AvatarVariants['shape']
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <Avatar :shape :class="className">
    <AvatarImage :src="src" />
    <AvatarFallback class="inline-flex">
      <slot>
        {{ fallback }}
      </slot>
    </AvatarFallback>
  </Avatar>
</template>
