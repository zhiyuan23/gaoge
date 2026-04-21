<script setup lang="ts">
import { useElementSize, useScroll } from '@vueuse/core'
import type { HTMLAttributes } from 'vue'

import { cn } from '@/utils'

import { ScrollArea, ScrollBar } from './scroll-area'

defineOptions({
  name: 'FaScrollArea',
})

const {
  horizontal = false,
  scrollbar = true,
  mask = false,
  gradientColor = 'hsl(var(--background))',
  class: className = '',
  contentClass = '',
} = defineProps<{
  horizontal?: boolean
  scrollbar?: boolean
  mask?: boolean
  gradientColor?: string
  class?: HTMLAttributes['class']
  contentClass?: HTMLAttributes['class']
}>()

const scrollAreaRef = useTemplateRef('scrollAreaRef')

const arrivedState = ref<{
  left: boolean
  right: boolean
  top: boolean
  bottom: boolean
}>()
const showMaskStart = computed(() => {
  if (horizontal) {
    return !arrivedState.value?.left
  }
  return !arrivedState.value?.top
})
const showMaskEnd = computed(() => {
  if (horizontal) {
    return !arrivedState.value?.right
  }
  return !arrivedState.value?.bottom
})

function onWheel(event: WheelEvent) {
  if (horizontal) {
    scrollAreaRef.value?.el?.viewportElement?.scrollBy({
      left: event.deltaY || event.detail,
    })
  } else {
    scrollAreaRef.value?.el?.viewportElement?.scrollBy({
      top: event.deltaY || event.detail,
    })
  }
}

const scrollContainerRef = useTemplateRef('scrollContainerRef')

onMounted(() => {
  const { arrivedState: arrivedStateValue } = useScroll(scrollAreaRef.value?.el?.viewportElement)
  watch(
    arrivedStateValue,
    (value) => {
      arrivedState.value = value
    },
    {
      immediate: true,
    },
  )
  const { width, height } = useElementSize(scrollContainerRef.value)
  watch(
    [width, height],
    () => {
      scrollAreaRef.value?.el?.viewportElement?.dispatchEvent(new Event('scroll'))
    },
    {
      immediate: true,
    },
  )
})

function scrollTo(scrollNumber: number) {
  if (horizontal) {
    scrollAreaRef.value?.el?.viewportElement?.scrollTo({
      left: scrollNumber,
      behavior: 'smooth',
    })
  } else {
    scrollAreaRef.value?.el?.viewportElement?.scrollTo({
      top: scrollNumber,
      behavior: 'smooth',
    })
  }
}

defineExpose({
  ref: scrollAreaRef,
  scrollTo,
})
</script>

<template>
  <div
    ref="scrollContainerRef"
    :class="
      cn(
        'after:(pointer-events-none z-1 content-empty) before:(pointer-events-none z-1 content-empty) absolute relative flex overflow-hidden from-transparent to-[var(--mask-scroll-container-gradient-color)] opacity-0 transition-opacity',
        {
          'after:(bg-gradient-to-r end-0) before:(bg-gradient-to-l start-0) h-full w-12 rtl:bg-gradient-to-l rtl:bg-gradient-to-r':
            horizontal,
          'after:(bg-gradient-to-b bottom-0) before:(bg-gradient-to-t w-full) h-12 w-full':
            !horizontal,
          'before:(opacity-100!)': mask && showMaskStart,
          'after:(opacity-100!)': mask && showMaskEnd,
        },
        className,
      )
    "
    :style="
      mask
        ? {
            '--mask-scroll-container-gradient-color': gradientColor,
          }
        : {}
    "
  >
    <ScrollArea
      ref="scrollAreaRef"
      :class="cn('relative z-0 flex-1', contentClass)"
      :scrollbar="scrollbar"
      :on-wheel="onWheel"
    >
      <slot />
      <ScrollBar
        v-if="horizontal"
        orientation="horizontal"
        :class="{ 'pointer-events-none opacity-0': !scrollbar }"
      />
    </ScrollArea>
  </div>
</template>
