<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import { cn } from '@/utils'

defineOptions({
  name: 'FaPageMain',
})

const {
  title = '',
  collaspe = false,
  height = '',
  class: className = '',
  titleClass = '',
  mainClass = '',
} = defineProps<{
  title?: string
  collaspe?: boolean
  height?: string
  class?: HTMLAttributes['class']
  titleClass?: HTMLAttributes['class']
  mainClass?: HTMLAttributes['class']
}>()

const slots = defineSlots<{
  title?: () => VNode
  default?: () => VNode
}>()

const isCollaspe = ref(collaspe)
function handleCollaspe() {
  isCollaspe.value = !isCollaspe.value
}
</script>

<template>
  <div
    :class="
      cn(
        'bg-card m-4 flex flex-col overflow-hidden rounded-lg border transition-[background-color,border-color]',
        className,
      )
    "
  >
    <div
      v-if="!!slots.title || title"
      :class="cn('transition-border-color border-b px-5 py-4', titleClass)"
    >
      <slot name="title">
        {{ title }}
      </slot>
    </div>
    <div
      :class="
        cn(
          `main-container transition-height group absolute relative bottom-0 left-0 max-h-full min-h-12 w-full bg-gradient-to-b from-transparent to-[hsl(var(--card))] p-5 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-12 after:bg-gradient-to-b after:from-transparent after:to-[hsl(var(--card))] after:opacity-0 after:transition-opacity after:content-['']`,
          {
            'overflow-hidden': collaspe,
            'after:opacity-100': isCollaspe,
          },
          mainClass,
        )
      "
      :style="{
        height: isCollaspe ? height : '',
      }"
    >
      <slot />
      <FaButton
        v-if="collaspe"
        variant="link"
        size="icon"
        class="inset-b-0 inset-s-1/2 group-hover-opacity-100 absolute -translate-x-1/2 opacity-0 transition-all"
        :class="{ 'rotate-x-180': !isCollaspe }"
        @click="handleCollaspe"
      >
        <FaIcon name="i-ep:arrow-down" class="text-xl" />
      </FaButton>
    </div>
  </div>
</template>
