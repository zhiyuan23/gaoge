<script setup lang="ts">
import { X } from 'lucide-vue-next'
import {
  DialogClose,
  DialogContent,
  type DialogContentEmits,
  type DialogContentProps,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from 'radix-vue'
import { computed, type HTMLAttributes } from 'vue'

import { cn } from '@/utils'

import { type SheetVariants, sheetVariants } from '.'

interface SheetContentProps extends DialogContentProps {
  class?: HTMLAttributes['class']
  side?: SheetVariants['side']
  closable?: boolean
  overlayBlur?: boolean
}

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<SheetContentProps>()

const emits = defineEmits<
  DialogContentEmits & {
    animationEnd: []
  }
>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      :class="
        cn(
          'z-2000 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 fixed inset-0 bg-black/50',
          {
            'backdrop-blur-sm': props.overlayBlur,
          },
        )
      "
    />
    <DialogContent
      :class="cn(sheetVariants({ side }), props.class)"
      v-bind="{ ...forwarded, ...$attrs }"
      @animationend="emits('animationEnd')"
    >
      <slot />
      <DialogClose
        v-if="closable"
        class="ring-offset-background data-[state=open]:bg-secondary focus:ring-ring absolute right-4 top-4 rounded-sm bg-transparent opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none"
      >
        <X class="text-muted-foreground h-4 w-4" />
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
