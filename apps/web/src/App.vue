<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <div :class="{ 'overflow-hidden': route.path === '/' }">
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
