<script setup lang="ts">
import { useAuthStore } from '@/store'

const authStore = useAuthStore()
const me = computed(() => authStore.me)
</script>

<template>
  <view class="page">
    <CustomNavbar title="首页" :show-back="false" />
    <view class="px-28 pt-32">
      <view class="rounded-24 bg-white px-32 py-28 shadow-sm">
        <text class="color-#0F172A text-32 font-600 leading-44">
          {{ me?.user.isBound ? '已完成登录并绑定球员' : '已完成登录，暂未绑定球员' }}
        </text>
        <text class="color-#475569 text-26 mt-20 block">
          当前 openid：{{ me?.user.openid || '-' }}
        </text>
      </view>
    </view>
  </view>
</template>
