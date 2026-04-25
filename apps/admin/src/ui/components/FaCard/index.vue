<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'

defineOptions({
  name: 'FaCard',
})

const {
  title = '',
  description = '',
  class: className = '',
  headerClass = '',
  contentClass = '',
  footerClass = '',
} = defineProps<{
  title?: string
  description?: string
  class?: HTMLAttributes['class']
  headerClass?: HTMLAttributes['class']
  contentClass?: HTMLAttributes['class']
  footerClass?: HTMLAttributes['class']
}>()

const slots = defineSlots<{
  header?: () => VNode
  default?: () => VNode
  footer?: () => VNode
}>()
</script>

<template>
  <Card :class="className">
    <CardHeader v-if="!!slots.header || !!title || !!description" :class="headerClass">
      <slot name="header">
        <CardTitle v-if="!!title">
          {{ title }}
        </CardTitle>
        <CardDescription v-if="!!description">
          {{ description }}
        </CardDescription>
      </slot>
    </CardHeader>
    <CardContent v-if="!!slots.default" :class="contentClass">
      <slot />
    </CardContent>
    <CardFooter v-if="!!slots.footer" :class="footerClass">
      <slot name="footer" />
    </CardFooter>
  </Card>
</template>
