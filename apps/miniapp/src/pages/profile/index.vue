<script setup lang="ts">
import { useAuthStore } from '@/store'

const authStore = useAuthStore()
const me = computed(() => authStore.me)
</script>

<template>
  <view class="page profile-page">
    <CustomNavbar title="我的" :show-back="false" />
    <view class="px-28 pt-32">
      <view class="rounded-24 bg-white px-32 py-28 shadow-sm">
        <text class="color-#0F172A text-32 font-600 leading-44">
          {{ me?.user.isBound ? '已绑定球员' : '未绑定球员' }}
        </text>
        <text class="color-#475569 text-26 mt-20 block">
          openid：{{ me?.user.openid || '-' }}
        </text>
        <text class="color-#475569 text-26 mt-12 block">
          号码：{{ me?.binding?.playerNumber ?? '未绑定' }}
        </text>
        <text class="color-#475569 text-26 mt-12 block">
          昵称：{{ me?.binding?.nickname ?? '未绑定' }}
        </text>
      </view>
    </view>
  </view>
</template>
