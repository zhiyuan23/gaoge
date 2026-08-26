<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { UseImage } from '@vueuse/components'
import type { HTMLAttributes } from 'vue'

import { cn } from '@/utils'

import { resolveIconSource } from './resolve'

defineOptions({
  name: 'FaIcon',
})

const { name, class: className = '' } = defineProps<{
  name: string
  class?: HTMLAttributes['class']
}>()

const source = computed(() => resolveIconSource(name))
</script>

<template>
  <i
    :class="
      cn(
        'flex-inline relative size-[1em] items-center justify-center fill-current leading-[1em]',
        className,
      )
    "
  >
    <Icon
      v-if="source.outputType === 'iconify'"
      :icon="source.name"
      class="size-inherit! shrink-0"
    />
    <svg v-else-if="source.outputType === 'svg'" class="size-inherit shrink-0" aria-hidden="true">
      <use :xlink:href="`#icon-${source.name}`" />
    </svg>
    <UseImage
      v-else-if="source.outputType === 'img'"
      :src="source.name"
      class="size-inherit shrink-0"
    >
      <template #loading>
        <i class="i-line-md:loading-loop size-inherit" />
      </template>
      <template #error>
        <i class="i-tdesign:image-error size-inherit" />
      </template>
    </UseImage>
  </i>
</template>
