<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils'

defineOptions({
  name: 'FaPageMain',
})

const props = withDefaults(
  defineProps<{
    title?: string
    collaspe?: boolean
    height?: string
    class?: HTMLAttributes['class']
    titleClass?: HTMLAttributes['class']
    mainClass?: HTMLAttributes['class']
  }>(),
  {
    title: '',
    collaspe: false,
    height: '',
  },
)

const slots = defineSlots<{
  title?: () => VNode
  default?: () => VNode
}>()

const isCollaspe = ref(props.collaspe)
function handleCollaspe() {
  isCollaspe.value = !isCollaspe.value
}
</script>

<template>
  <div
    :class="
      cn(
        'bg-card m-4 flex flex-col rounded-lg border transition-[background-color,border-color]',
        {
          'overflow-hidden': collaspe,
        },
        props.class,
      )
    "
  >
    <div
      v-if="!!slots.title || title"
      :class="cn('transition-border-color border-b px-5 py-4', props.titleClass)"
    >
      <slot name="title">
        {{ title }}
      </slot>
    </div>
    <div
      :class="
        cn(
          'main-container transition-height after:(pointer-events-none z-1 content-empty) group absolute relative bottom-0 left-0 h-12 h-[calc-size(auto,size)] max-h-full w-full bg-gradient-to-b from-transparent to-[hsl(var(--card))] p-5 opacity-0 transition-opacity',
          {
            'overflow-hidden': collaspe,
            'after:(opacity-100)': isCollaspe,
          },
          props.mainClass,
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
