<script setup lang="ts">
import { Maximize, Minimize, X } from 'lucide-vue-next'
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

type DialogContentInstance = InstanceType<typeof DialogContent>

const props = defineProps<
  DialogContentProps & {
    class?: HTMLAttributes['class']
    maximize?: boolean
    maximizable?: boolean
    closable?: boolean
    overlayBlur?: boolean
  }
>()
const emits = defineEmits<
  DialogContentEmits & {
    toggleMaximize: [val: boolean]
    animationEnd: []
  }
>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)

function handleMaximize() {
  emits('toggleMaximize', !props.maximize)
}

const dialogContentRef = ref<DialogContentInstance | null>(null)

defineExpose({
  el: dialogContentRef,
})
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
      ref="dialogContentRef"
      v-bind="forwarded"
      :class="
        cn(
          'z-2000 bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-1/5 data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-1/5 fixed left-1/2 top-1/2 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg',
          props.class,
        )
      "
      @animationend="emits('animationEnd')"
    >
      <slot />
      <div class="inset-e-4 flex-center absolute top-4 gap-2">
        <button
          v-if="props.maximizable"
          class="ring-offset-background data-[state=open]:bg-accent data-[state=open]:text-muted-foreground focus:ring-ring hidden rounded-sm bg-transparent opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none sm:inline-block"
          @click="handleMaximize"
        >
          <Maximize v-if="!props.maximize" class="h-4 w-4" />
          <Minimize v-else class="h-4 w-4" />
        </button>
        <DialogClose
          v-if="closable"
          class="ring-offset-background data-[state=open]:bg-accent data-[state=open]:text-muted-foreground focus:ring-ring rounded-sm bg-transparent opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X class="h-4 w-4" />
          <span class="sr-only">Close</span>
        </DialogClose>
      </div>
    </DialogContent>
  </DialogPortal>
</template>
