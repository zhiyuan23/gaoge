<script setup lang="ts">
import type { Banner } from '@gaoge/shared-types'

import { requestBanners } from '@/api'
import { isPathExists, isTabBarPath, removeQueryString } from '@/router'
import { navigateTo, switchTab, Toast } from '@/utils'

defineOptions({
  name: 'HomePage',
})

const banners = ref<Banner[]>([])
const loading = ref(false)
const loadFailed = ref(false)

async function loadBanners() {
  loading.value = true

  try {
    banners.value = await requestBanners()
    loadFailed.value = false
  } catch (error) {
    banners.value = []
    loadFailed.value = true
    console.error(error)
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

function getBannerActionLabel(item: Banner) {
  if (item.jumpType === 'webview') {
    return '查看详情'
  }

  if (item.jumpType === 'miniapp') {
    return '进入页面'
  }

  return '品牌展示'
}

function navigateByBanner(item: Banner) {
  if (item.jumpType === 'none') {
    return
  }

  const targetUrl = item.jumpUrl?.trim() ?? ''

  if (item.jumpType === 'webview' && targetUrl) {
    navigateTo(
      `/pages/common/webview/index?url=${encodeURIComponent(targetUrl)}&title=${encodeURIComponent(item.title)}`,
    )
    return
  }

  if (item.jumpType === 'miniapp' && targetUrl && isPathExists(targetUrl)) {
    if (isTabBarPath(targetUrl)) {
      switchTab(removeQueryString(targetUrl))
    } else {
      navigateTo(targetUrl)
    }
    return
  }

  Toast('跳转配置无效')
}

function handleBannerTap(item: Banner) {
  navigateByBanner(item)
}

onLoad(() => {
  void loadBanners()
})

onPullDownRefresh(() => {
  void loadBanners()
})
</script>

<template>
  <view class="home-page bg-#F3F6FB min-h-screen">
    <view class="px-28 pb-36 pt-28">
      <view class="hero-card rounded-36 px-30 py-32">
        <text class="text-42 font-700 leading-58 color-#0F172A block">高歌体育</text>
        <text class="text-24 leading-38 color-#5B6B86 mt-12 block">
          首页 Banner 由后台配置，按排序展示，支持网页和小程序页面跳转。
        </text>
      </view>

      <view
        v-if="loading && !banners.length"
        class="state-card rounded-28 mt-24 px-28 py-40 text-center"
      >
        <text class="text-28 font-600 color-#0F172A block">加载中</text>
        <text class="text-24 color-#6B7280 mt-10 block">正在同步最新 Banner</text>
      </view>

      <swiper
        v-else-if="banners.length"
        class="home-banner-swiper mt-24"
        circular
        autoplay
        indicator-dots
        :interval="5000"
        :duration="500"
        indicator-color="rgba(255,255,255,0.5)"
        indicator-active-color="#FFFFFF"
      >
        <swiper-item v-for="item in banners" :key="item.id">
          <view class="home-banner-item" @tap="handleBannerTap(item)">
            <image class="home-banner-image" :src="item.imageUrl" mode="aspectFill" />
            <view class="home-banner-mask">
              <text class="text-28 font-700 leading-40 color-white block">{{ item.title }}</text>
              <text class="text-20 color-white/80 mt-8 block">
                {{ getBannerActionLabel(item) }}
              </text>
            </view>
          </view>
        </swiper-item>
      </swiper>

      <view v-else-if="loadFailed" class="state-card rounded-28 mt-24 px-28 py-40 text-center">
        <text class="text-28 font-600 color-#0F172A block">加载失败</text>
        <text class="text-24 color-#6B7280 mt-10 block">下拉刷新后重试</text>
      </view>

      <view v-else class="state-card rounded-28 mt-24 px-28 py-40 text-center">
        <text class="text-28 font-600 color-#0F172A block">暂无 Banner</text>
        <text class="text-24 color-#6B7280 mt-10 block">后台启用后会在这里展示最新活动内容</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.home-page {
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 16%), transparent 32%),
    linear-gradient(180deg, #f8fbff 0%, #f3f6fb 100%);
}

.hero-card,
.state-card,
.home-banner-item {
  background: rgba(255, 255, 255, 94%);
  box-shadow: 0 18rpx 48rpx rgba(15, 23, 42, 8%);
}

.hero-card {
  position: relative;
  overflow: hidden;

  &::after {
    position: absolute;
    top: -60rpx;
    right: -30rpx;
    width: 220rpx;
    height: 220rpx;
    background: linear-gradient(135deg, rgba(37, 99, 235, 16%), rgba(14, 165, 233, 0%));
    border-radius: 999rpx;
    content: '';
  }
}

.home-banner-swiper {
  height: 320rpx;
}

.home-banner-item {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 32rpx;
}

.home-banner-image {
  display: block;
  width: 100%;
  height: 100%;
}

.home-banner-mask {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 28rpx;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0%) 0%, rgba(15, 23, 42, 72%) 100%);
}
</style>
