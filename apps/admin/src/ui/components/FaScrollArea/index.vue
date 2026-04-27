<script setup lang="ts">
import { useElementSize, useScroll } from '@vueuse/core'
import type { HTMLAttributes } from 'vue'

import { cn } from '@/utils'

import { ScrollArea, ScrollBar } from './scroll-area'

defineOptions({
  name: 'FaScrollArea',
})

const props = withDefaults(
  defineProps<{
    horizontal?: boolean
    scrollbar?: boolean
    mask?: boolean
    gradientColor?: string
    class?: HTMLAttributes['class']
    contentClass?: HTMLAttributes['class']
  }>(),
  {
    horizontal: false,
    scrollbar: true,
    mask: false,
    gradientColor: 'hsl(var(--background))',
    class: '',
    contentClass: '',
  },
)

const scrollAreaRef = useTemplateRef('scrollAreaRef')

const arrivedState = ref<{
  left: boolean
  right: boolean
  top: boolean
  bottom: boolean
}>()
const showMaskStart = computed(() => {
  if (props.horizontal) {
    return !arrivedState.value?.left
  }
  return !arrivedState.value?.top
})
const showMaskEnd = computed(() => {
  if (props.horizontal) {
    return !arrivedState.value?.right
  }
  return !arrivedState.value?.bottom
})

function onWheel(event: WheelEvent) {
  if (props.horizontal) {
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
  if (props.horizontal) {
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
        `before:z-1 after:z-1 absolute relative flex size-full overflow-hidden from-transparent to-[var(--mask-scroll-container-gradient-color)] before:pointer-events-none before:absolute before:opacity-0 before:transition-opacity before:content-[''] after:pointer-events-none after:absolute after:opacity-0 after:transition-opacity after:content-['']`,
        {
          'before:start-0 before:top-0 before:h-full before:w-12 before:bg-gradient-to-l after:end-0 after:top-0 after:h-full after:w-12 after:bg-gradient-to-r rtl:before:bg-gradient-to-r rtl:after:bg-gradient-to-l':
            props.horizontal,
          'before:left-0 before:top-0 before:h-12 before:w-full before:bg-gradient-to-t after:bottom-0 after:left-0 after:h-12 after:w-full after:bg-gradient-to-b':
            !props.horizontal,
          'before:opacity-100': props.mask && showMaskStart,
          'after:opacity-100': props.mask && showMaskEnd,
        },
        props.class,
      )
    "
    :style="
      props.mask
        ? {
            '--mask-scroll-container-gradient-color': props.gradientColor,
          }
        : {}
    "
  >
    <ScrollArea
      ref="scrollAreaRef"
      :class="cn('relative z-0 flex-1', props.contentClass)"
      :scrollbar="props.scrollbar"
      :on-wheel="onWheel"
    >
      <slot />
      <ScrollBar
        v-if="props.horizontal"
        orientation="horizontal"
        :class="{ 'pointer-events-none opacity-0': !props.scrollbar }"
      />
    </ScrollArea>
  </div>
</template>
