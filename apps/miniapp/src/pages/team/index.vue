<script setup lang="ts">
import type { AssetRecordSummary } from '@gaoge/shared-types'

import { requestFootballAssetSummary } from '@/api/football/asset'
import { navigateTo } from '@/utils'

const summaryLoading = ref(false)
const summaryError = ref('')
const summary = ref<AssetRecordSummary>({
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  waivedMatchCount: 0,
})

const formatCurrency = (amount: number) =>
  `¥${(amount / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

async function loadSummary() {
  summaryLoading.value = true
  summaryError.value = ''

  try {
    summary.value = await requestFootballAssetSummary()
  } catch (error) {
    summaryError.value = error instanceof Error ? error.message : '资产总览加载失败'
  } finally {
    summaryLoading.value = false
  }
}

function handleOpenDetail() {
  navigateTo('/pages/football/asset/index')
}

onLoad(() => {
  void loadSummary()
})

onPullDownRefresh(async () => {
  await loadSummary()
  uni.stopPullDownRefresh()
})
</script>

<template>
  <view class="team-page bg-#F3F6FB min-h-screen">
    <view class="px-28 pb-36 pt-24">
      <view class="flex flex-col gap-20">
        <view class="hero-card rounded-32 py-30 px-28">
          <view class="flex items-start justify-between gap-20">
            <view class="min-w-0 flex-1">
              <text class="eyebrow text-20 font-600">Gaoge FC</text>
              <text class="text-40 font-700 color-#0F172A mt-10 block">球队资产</text>
              <text class="text-24 leading-38 color-#5B6B86 mt-14 block">
                公开球队当前收支总览与历史明细。
              </text>
            </view>
            <view
              class="detail-pill px-22 text-22 font-600 rounded-full py-12"
              @tap="handleOpenDetail"
            >
              查看明细
            </view>
          </view>
          <view v-if="summaryLoading" class="state-card rounded-24 mt-20 px-24 py-32 text-center">
            <text class="text-24 color-#64748B">资产总览加载中...</text>
          </view>
          <view
            v-else-if="summaryError"
            class="state-card rounded-24 mt-20 px-24 py-32 text-center"
          >
            <text class="text-24 color-#DC2626">资产总览加载失败：{{ summaryError }}</text>
            <view class="mt-18">
              <t-button theme="primary" size="small" @click="loadSummary">重试</t-button>
            </view>
          </view>
          <view v-else class="mt-20 grid grid-cols-3 gap-16">
            <view class="metric-card metric-card-income rounded-24 px-18 py-22">
              <text class="text-20 color-#5B6B86">总收入</text>
              <text class="text-30 font-700 color-#047857 mt-10 block">
                {{ formatCurrency(summary.totalIncome) }}
              </text>
            </view>
            <view class="metric-card metric-card-expense rounded-24 px-18 py-22">
              <text class="text-20 color-#5B6B86">总支出</text>
              <text class="text-30 font-700 color-#DC2626 mt-10 block">
                {{ formatCurrency(summary.totalExpense) }}
              </text>
            </view>
            <view class="metric-card metric-card-balance rounded-24 px-18 py-22">
              <text class="text-20 color-#5B6B86">当前结余</text>
              <text class="text-30 font-700 color-#2563EB mt-10 block">
                {{ formatCurrency(summary.balance) }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.team-page {
  min-height: 100vh;
}

.hero-card,
.section-card,
.state-card {
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 16rpx 44rpx rgb(15 23 42 / 6%);
}

.eyebrow {
  color: #2563eb;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-pill {
  color: #2563eb;
  border: 1px solid rgb(191 219 254 / 96%);
  background: rgb(239 246 255 / 96%);
  white-space: nowrap;
}

.metric-card-income {
  background: linear-gradient(180deg, rgb(236 253 245 / 96%), rgb(209 250 229 / 96%));
}

.metric-card-expense {
  background: linear-gradient(180deg, rgb(255 241 242 / 96%), rgb(255 228 230 / 96%));
}

.metric-card-balance {
  background: linear-gradient(180deg, rgb(239 246 255 / 96%), rgb(219 234 254 / 96%));
}
</style>
