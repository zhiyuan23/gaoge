<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

const {
  to = undefined,
  replace = false,
  separator = '/',
} = defineProps<{
  to?: RouteLocationRaw
  replace?: boolean
  separator?: string
}>()

const router = useRouter()

function onClick() {
  if (to) {
    replace ? router.replace(to) : router.push(to)
  }
}
</script>

<template>
  <div class="breadcrumb-item text-foreground flex items-center">
    <span class="separator mx-2">
      {{ separator }}
    </span>
    <span
      class="text flex items-center opacity-60"
      :class="{
        'is-link hover-opacity-100 cursor-pointer transition-opacity': !!to,
      }"
      @click="onClick"
    >
      <slot />
    </span>
  </div>
</template>
