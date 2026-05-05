<script setup lang="ts">
import { useAppStore } from '@/store'

const { title = '', showBack = true } = defineProps<{
  title?: string
  showBack?: boolean
}>()

const emit = defineEmits<{
  back: []
  height: [height: number]
}>()

const appStore = useAppStore()

const statusBarHeight = ref(0)
const navBarHeight = ref(44)
const navbarHeight = ref(0)

const getWindowInfo = () => {
  const { windowInfo } = appStore
  statusBarHeight.value = windowInfo?.statusBarHeight || 0

  // 获取胶囊按钮位置
  const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
  if (menuButtonInfo) {
    // 计算导航栏高度：胶囊按钮顶部 - 状态栏高度 + 胶囊按钮高度 + (胶囊按钮顶部 - 状态栏高度)
    navBarHeight.value = (menuButtonInfo.top - statusBarHeight.value) * 2 + menuButtonInfo.height
  }

  navbarHeight.value = statusBarHeight.value + navBarHeight.value
  emit('height', navbarHeight.value)
}

const handleBack = () => {
  emit('back')
  uni.navigateBack()
}

onMounted(() => {
  getWindowInfo()
})
</script>

<template>
  <view
    class="z-999 fixed left-0 right-0 top-0 bg-transparent"
    :style="{ height: `${navbarHeight}px` }"
  >
    <!-- 状态栏占位 -->
    <view class="w-full" :style="{ height: `${statusBarHeight}px` }" />
    <!-- 导航栏内容 -->
    <view
      class="flex-center-between px-30rpx box-border w-full"
      :style="{ height: `${navBarHeight}px` }"
    >
      <!-- 返回按钮 -->
      <view v-if="showBack" class="w-80rpx flex-center-start h-full" @click="handleBack">
        <t-icon name="arrow-left" size="40rpx" />
      </view>
      <view v-else class="w-80rpx h-full" />
      <!-- 标题 -->
      <view class="color-white flex-1 text-center text-xl font-bold">
        {{ title }}
      </view>
      <!-- 右侧占位 -->
      <view class="w-80rpx h-full" />
    </view>
  </view>
</template>
