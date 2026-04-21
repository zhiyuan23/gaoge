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

const {
  modelValue = false,
  side = 'right',
  title,
  description = '',
  loading = false,
  closable = true,
  centered = false,
  bordered = true,
  overlay = true,
  overlayBlur = false,
  showConfirmButton = true,
  showCancelButton = false,
  confirmButtonText = '确定',
  cancelButtonText = '取消',
  confirmButtonDisabled = false,
  confirmButtonLoading = false,
  header = true,
  footer = true,
  closeOnClickOverlay = true,
  closeOnPressEscape = true,
  headerClass = '',
  contentClass = '',
  footerClass = '',
} = defineProps<{
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
  headerClass?: HTMLAttributes['class']
  contentClass?: HTMLAttributes['class']
  footerClass?: HTMLAttributes['class']
}>()

const emits = defineEmits<{
  'update:modelValue': [value: boolean]
  open: []
  opened: []
  close: []
  closed: []
  confirm: []
  cancel: []
}>()

const isOpen = ref(modelValue)

watch(
  () => modelValue,
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
  if (!closeOnClickOverlay) {
    e.preventDefault()
  }
}

function handleEscapeKeyDown(e: KeyboardEvent) {
  if (!closeOnPressEscape) {
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
  <Sheet :modal="overlay" :open="isOpen" @update:open="updateOpen">
    <SheetContent
      :closable="closable"
      :overlay-blur="overlayBlur"
      class="flex w-full flex-col gap-0 p-0"
      :side="side"
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
          cn('gap-y-1 p-4', headerClass, {
            'border-b': bordered,
          })
        "
      >
        <slot name="header">
          <SheetTitle :class="{ 'text-center': centered }">
            {{ title }}
          </SheetTitle>
          <SheetDescription v-if="!!description" :class="{ 'text-center': centered }">
            {{ description }}
          </SheetDescription>
        </slot>
      </SheetHeader>
      <div class="of-y-hidden m-0 flex-1">
        <FaScrollArea class="h-full">
          <div :class="cn('p-4', contentClass)">
            <slot />
          </div>
        </FaScrollArea>
        <div v-show="loading" class="z-1000 flex-center bg-popover/75 absolute inset-0 size-full">
          <FaIcon name="i-line-md:loading-twotone-loop" class="size-10" />
        </div>
      </div>
      <SheetFooter
        v-if="footer"
        :class="
          cn('gap-y-2 p-2', footerClass, {
            'sm:justify-center': centered,
            'border-t': bordered,
          })
        "
      >
        <slot name="footer">
          <FaButton v-if="showCancelButton" variant="outline" @click="onCancel">
            {{ cancelButtonText }}
          </FaButton>
          <FaButton
            v-if="showConfirmButton"
            :disabled="confirmButtonDisabled"
            :loading="confirmButtonLoading"
            @click="onConfirm"
          >
            {{ confirmButtonText }}
          </FaButton>
        </slot>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
