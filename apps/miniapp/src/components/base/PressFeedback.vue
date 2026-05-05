<script setup lang="ts">
const props = defineProps<{
  durationPress?: number // 按下时长，默认 80ms
  durationRelease?: number // 释放时长，默认 150ms
  translateY?: number // 下移距离，默认 2rpx
  scale?: number // 按下缩放，1无缩放 小于1 入0.98有缩放效果
}>()

const durationPress = props.durationPress ?? 80
const durationRelease = props.durationRelease ?? 150
const translateY = props.translateY ?? 2
const scale = props.scale ?? 0.996

const pressed = ref(false)

let timer: ReturnType<typeof setTimeout> | null = null

const handleTouchStart = () => {
  if (pressed.value) return
  pressed.value = true
  if (timer) clearTimeout(timer)
}

const handleTouchEnd = () => {
  if (!pressed.value) return
  timer = setTimeout(() => {
    pressed.value = false
  }, 50) // 微延迟释放，增强“粘手”感
}

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})

const pressedStyle = computed(() => {
  return {
    transform: pressed.value ? `scale(${scale}) translateY(${translateY}rpx)` : '',
    filter: pressed.value ? 'brightness(0.96)' : '',
    transition: pressed.value
      ? `transform ${durationRelease}ms cubic-bezier(0, 0, 0.2, 1.3), filter ${durationRelease}ms cubic-bezier(0, 0, 0.2, 1.3)`
      : `transform ${durationPress}ms cubic-bezier(0.4, 0, 0.2, 1), filter ${durationPress}ms cubic-bezier(0.4, 0, 0.2, 1)`,
  }
})
</script>

<template>
  <view
    class="relative inline-block"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchEnd"
  >
    <view
      :style="pressedStyle"
      :class="{ 'press-active': pressed }"
      class="origin-bottom transition-all"
    >
      <slot />
    </view>
  </view>
</template>
