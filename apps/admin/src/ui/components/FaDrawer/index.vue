<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from './sheet'

defineOptions({
  name: 'FaDrawer',
})

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    side?: 'top' | 'bottom' | 'left' | 'right'
    title: string
    description?: string
    loading?: boolean
    closable?: boolean
    centered?: boolean
    bordered?: boolean
    overlay?: boolean
    overlayBlur?: boolean
    showConfirmButton?: boolean
    showCancelButton?: boolean
    confirmButtonText?: string
    cancelButtonText?: string
    confirmButtonDisabled?: boolean
    confirmButtonLoading?: boolean
    header?: boolean
    footer?: boolean
    closeOnClickOverlay?: boolean
    closeOnPressEscape?: boolean
    class?: HTMLAttributes['class']
    headerClass?: HTMLAttributes['class']
    contentClass?: HTMLAttributes['class']
    footerClass?: HTMLAttributes['class']
  }>(),
  {
    modelValue: false,
    side: 'right',
    loading: false,
    closable: true,
    centered: false,
    bordered: true,
    overlay: true,
    overlayBlur: false,
    showConfirmButton: true,
    showCancelButton: false,
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    confirmButtonDisabled: false,
    confirmButtonLoading: false,
    header: true,
    footer: true,
    closeOnClickOverlay: true,
    closeOnPressEscape: true,
  },
)

const emits = defineEmits<{
  'update:modelValue': [value: boolean]
  open: []
  opened: []
  close: []
  closed: []
  confirm: []
  cancel: []
}>()

const isOpen = ref(props.modelValue)

watch(
  () => props.modelValue,
  (newValue) => {
    isOpen.value = newValue
  },
)

function updateOpen(value: boolean) {
  isOpen.value = value
  emits('update:modelValue', value)
  if (value) {
    emits('open')
  } else {
    emits('close')
  }
}

function onConfirm() {
  updateOpen(false)
  emits('confirm')
}

function onCancel() {
  updateOpen(false)
  emits('cancel')
}

function handleFocusOutside(e: Event) {
  e.preventDefault()
  e.stopPropagation()
}

function handleClickOutside(e: Event) {
  if (!props.closeOnClickOverlay) {
    e.preventDefault()
  }
}

function handleEscapeKeyDown(e: KeyboardEvent) {
  if (!props.closeOnPressEscape) {
    e.preventDefault()
  }
}

function handleAnimationEnd() {
  if (isOpen.value) {
    emits('opened')
  } else {
    emits('closed')
  }
}
</script>

<template>
  <Sheet :modal="props.overlay" :open="isOpen" @update:open="updateOpen">
    <SheetContent
      :closable="props.closable"
      :overlay-blur="props.overlayBlur"
      class="flex w-full flex-col gap-0 p-0"
      :side="props.side"
      @close-auto-focus="handleFocusOutside"
      @focus-outside="handleFocusOutside"
      @pointer-down-outside="handleClickOutside"
      @interact-outside="handleClickOutside"
      @escape-key-down="handleEscapeKeyDown"
      @animation-end="handleAnimationEnd"
    >
      <SheetHeader
        v-if="header"
        :class="
          cn('gap-y-1 p-4', props.headerClass, {
            'border-b': props.bordered,
          })
        "
      >
        <slot name="header">
          <SheetTitle :class="{ 'text-center': props.centered }">
            {{ title }}
          </SheetTitle>
          <SheetDescription v-if="!!description" :class="{ 'text-center': props.centered }">
            {{ description }}
          </SheetDescription>
        </slot>
      </SheetHeader>
      <div class="of-y-hidden m-0 flex-1">
        <FaScrollArea class="h-full">
          <div class="p-4">
            <slot />
          </div>
        </FaScrollArea>
        <div
          v-show="props.loading"
          class="z-1000 flex-center bg-popover/75 absolute inset-0 size-full"
        >
          <FaIcon name="i-line-md:loading-twotone-loop" class="size-10" />
        </div>
      </div>
      <SheetFooter
        v-if="footer"
        :class="
          cn('gap-y-2 p-2', props.footerClass, {
            'sm:justify-center': props.centered,
            'border-t': props.bordered,
          })
        "
      >
        <slot name="footer">
          <FaButton variant="outline" @click="onCancel">
            {{ cancelButtonText }}
          </FaButton>
          <FaButton @click="onConfirm">
            {{ confirmButtonText }}
          </FaButton>
        </slot>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
