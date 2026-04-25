<script setup lang="ts">
import { AvatarImage, type AvatarImageProps } from 'radix-vue'

const avatarImageProps = defineProps<AvatarImageProps>()
</script>

<template>
  <AvatarImage v-bind="avatarImageProps" class="h-full w-full object-cover" />
</template>
