<script setup lang="ts">
import { AvatarFallback, type AvatarFallbackProps } from 'radix-vue'

const avatarFallbackProps = defineProps<AvatarFallbackProps>()
</script>

<template>
  <AvatarFallback v-bind="avatarFallbackProps">
    <slot />
  </AvatarFallback>
</template>
