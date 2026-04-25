<script setup lang="ts" generic="T extends string | number">
import type { HTMLAttributes } from 'vue'

import { cn } from '@/utils'

import { Input } from './input'

defineOptions({
  name: 'FaInput',
})

const { disabled = false, class: className = '' } = defineProps<{
  disabled?: boolean
  class?: HTMLAttributes['class']
}>()

const value = defineModel<T>()
</script>

<template>
  <Input v-model="value" :disabled autocomplete="off" :class="cn('w-[200px]', className)" />
</template>

<style scoped>
input[type='password']::-ms-reveal {
  display: none;
}
</style>
