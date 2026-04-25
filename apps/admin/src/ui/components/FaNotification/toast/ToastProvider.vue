<script setup lang="ts">
import { ToastProvider, type ToastProviderProps } from 'radix-vue'

const toastProviderProps = defineProps<ToastProviderProps>()
</script>

<template>
  <ToastProvider v-bind="toastProviderProps">
    <slot />
  </ToastProvider>
</template>
