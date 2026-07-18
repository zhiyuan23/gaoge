<script setup lang="ts">
import type { Banner } from '@gaoge/shared-types'

import { requestBanners } from '@/api'

defineOptions({
  name: 'HomePage',
})

const banners = ref<Banner[]>([])
const bannerSwiperList = computed(() => banners.value.map((item) => item.imageUrl))

async function loadBanners() {
  banners.value = await requestBanners()
}

onLoad(() => {
  void loadBanners()
})

onPullDownRefresh(() => {
  void loadBanners()
})
</script>

<template>
  <view class="min-h-screen">
    <view class="card-theme">
      <t-swiper
        :list="bannerSwiperList"
        :navigation="{ type: 'dots-bar' }"
        :image-props="{ shape: 'round' }"
        height="200"
        previous-margin="34px"
        next-margin="34px"
        t-class-nav="card-theme-nav"
      />
    </view>
  </view>
</template>

<style>
.card-theme {
  --td-swiper-radius: 0;
  --td-swiper-item-padding: 0 12rpx;

  padding-bottom: 18px;
}
</style>
