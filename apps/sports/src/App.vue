<script setup>
import { nextTick, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import { syncWechatShare } from '@/utils/wechatShare'

const route = useRoute()

watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    await syncWechatShare(route)
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <RouterView v-slot="{ Component, route: currentRoute }">
    <div :class="{ 'overflow-hidden': currentRoute.path === '/hero' }">
      <transition name="slide-up" mode="out-in">
        <component :is="Component" />
      </transition>
    </div>
  </RouterView>
</template>

<style>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-30%);
}
</style>
