<script setup lang="ts">
import type { AssetRecord, AssetRecordSummary } from '@gaoge/shared-types'

import { requestFootballAssetRecords, requestFootballAssetSummary } from '@/api/football/asset'

import {
  ASSET_FILTER_OPTIONS,
  type AssetFilterKey,
  formatAssetCurrency,
  formatAssetRecordDate,
  formatAssetSignedAmount,
  getAssetDirectionByFilter,
  getAssetRecordTypeLabel,
  getAssetTotalPage,
} from './model'

defineOptions({
  name: 'FootballAssetPage',
})

const pageSize = 10

const activeFilter = ref<AssetFilterKey>('all')
const page = ref(1)
const total = ref(0)
const summaryLoading = ref(false)
const listLoading = ref(false)
const summaryError = ref('')
const listError = ref('')
const summary = ref<AssetRecordSummary>({
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  waivedMatchCount: 0,
})
const records = ref<AssetRecord[]>([])

const totalPage = computed(() => getAssetTotalPage(total.value, pageSize))
const hasPrevPage = computed(() => page.value > 1)
const hasNextPage = computed(() => page.value < totalPage.value)

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

async function loadRecords() {
  listLoading.value = true
  listError.value = ''

  try {
    const direction = getAssetDirectionByFilter(activeFilter.value)
    const payload = await requestFootballAssetRecords({
      page: page.value,
      pageSize,
      ...(direction ? { direction } : {}),
    })

    records.value = payload.list ?? []
    total.value = payload.total ?? 0
  } catch (error) {
    records.value = []
    total.value = 0
    listError.value = error instanceof Error ? error.message : '资产明细加载失败'
  } finally {
    listLoading.value = false
  }
}

async function reloadPage() {
  await Promise.all([loadSummary(), loadRecords()])
}

async function handleFilterChange(filterKey: AssetFilterKey) {
  if (activeFilter.value === filterKey || listLoading.value) {
    return
  }

  activeFilter.value = filterKey
  page.value = 1
  await loadRecords()
}

async function handlePageChange(nextPage: number) {
  if (listLoading.value || nextPage < 1 || nextPage > totalPage.value || nextPage === page.value) {
    return
  }

  page.value = nextPage
  await loadRecords()
}

onLoad(() => {
  void reloadPage()
})

onPullDownRefresh(async () => {
  page.value = 1
  await reloadPage()
  uni.stopPullDownRefresh()
})
</script>

<template>
  <view class="asset-detail-page bg-#F3F6FB min-h-screen">
    <view class="px-28 pb-36 pt-24">
      <view class="flex flex-col gap-20">
        <view class="hero-card rounded-32 px-28 py-28">
          <text class="eyebrow text-20 font-600">Gaoge FC</text>
          <text class="text-38 font-700 color-#0F172A mt-10 block">球队资产明细</text>
          <text class="text-24 leading-38 color-#5B6B86 mt-14 block">
            查看高歌足球队当前公开收支总览与历史流水记录。
          </text>
          <view v-if="summaryLoading" class="state-card rounded-24 py-30 mt-20 px-24 text-center">
            <text class="text-24 color-#64748B">资产总览加载中...</text>
          </view>
          <view
            v-else-if="summaryError"
            class="state-card rounded-24 py-30 mt-20 px-24 text-center"
          >
            <text class="text-24 color-#DC2626">资产总览加载失败：{{ summaryError }}</text>
            <view class="mt-18">
              <t-button theme="primary" size="small" @click="loadSummary">重试</t-button>
            </view>
          </view>
          <view v-else class="mt-20 grid grid-cols-3 gap-16">
            <view class="metric-card metric-card-income rounded-24 px-18 py-20">
              <text class="text-20 color-#5B6B86">总收入</text>
              <text class="text-28 font-700 color-#047857 mt-10 block">
                {{ formatAssetCurrency(summary.totalIncome) }}
              </text>
            </view>
            <view class="metric-card metric-card-expense rounded-24 px-18 py-20">
              <text class="text-20 color-#5B6B86">总支出</text>
              <text class="text-28 font-700 color-#DC2626 mt-10 block">
                {{ formatAssetCurrency(summary.totalExpense) }}
              </text>
            </view>
            <view class="metric-card metric-card-balance rounded-24 px-18 py-20">
              <text class="text-20 color-#5B6B86">当前结余</text>
              <text class="text-28 font-700 color-#2563EB mt-10 block">
                {{ formatAssetCurrency(summary.balance) }}
              </text>
            </view>
          </view>
        </view>

        <view class="section-card rounded-32 px-24 py-24">
          <view class="flex flex-wrap gap-12">
            <view
              v-for="option in ASSET_FILTER_OPTIONS"
              :key="option.key"
              class="filter-chip text-24 rounded-full px-24 py-12"
              :class="
                activeFilter === option.key ? `filter-chip-${option.key}` : 'filter-chip-idle'
              "
              @tap="handleFilterChange(option.key)"
            >
              {{ option.label }}
            </view>
          </view>

          <view v-if="listError" class="state-card rounded-24 mt-20 px-24 py-32 text-center">
            <text class="text-24 color-#DC2626">资产明细加载失败：{{ listError }}</text>
            <view class="mt-18">
              <t-button theme="primary" size="small" @click="loadRecords">重试</t-button>
            </view>
          </view>
          <view
            v-else-if="!records.length && !listLoading"
            class="state-card rounded-24 mt-20 px-24 py-32 text-center"
          >
            <text class="text-26 font-600 color-#0F172A">暂无资产记录</text>
            <text class="text-22 color-#64748B mt-10 block">球队收支录入后会展示在这里。</text>
          </view>
          <view v-else class="gap-18 mt-20 flex flex-col">
            <view
              v-for="record in records"
              :key="record.id"
              class="record-card rounded-28 px-24 py-24"
              :class="listLoading ? 'opacity-55' : ''"
            >
              <view class="flex items-start justify-between gap-20">
                <view class="min-w-0 flex-1">
                  <view class="flex flex-wrap items-center gap-10">
                    <text class="record-title text-28 font-700 color-#0F172A">
                      {{ record.title }}
                    </text>
                    <text class="record-tag text-20 color-#5B6B86 rounded-full px-14 py-6">
                      {{ getAssetRecordTypeLabel(record.recordType) }}
                    </text>
                  </view>
                  <text
                    v-if="record.description"
                    class="text-24 leading-38 color-#334155 mt-12 block"
                  >
                    {{ record.description }}
                  </text>
                  <view class="gap-x-18 mt-16 flex flex-wrap gap-y-8">
                    <text class="text-20 color-#64748B">
                      {{ formatAssetRecordDate(record.recordDate) }}
                    </text>
                    <text v-if="record.seasonLabel" class="text-20 color-#64748B">
                      {{ record.seasonLabel }}
                    </text>
                    <text v-if="record.matchLabel" class="text-20 color-#64748B">
                      {{ record.matchLabel }}
                    </text>
                  </view>
                </view>
                <text
                  class="text-30 font-700 shrink-0 text-right"
                  :class="record.direction === 'income' ? 'color-#059669' : 'color-#DC2626'"
                >
                  {{ formatAssetSignedAmount(record.direction, record.amount) }}
                </text>
              </view>
            </view>

            <view class="pagination-bar rounded-24 py-18 px-20">
              <text
                class="text-24"
                :class="hasPrevPage ? 'color-#2563EB' : 'color-#94A3B8'"
                @tap="handlePageChange(page - 1)"
              >
                上一页
              </text>
              <text class="text-22 color-#475569">第 {{ page }} 页</text>
              <text
                class="text-24"
                :class="hasNextPage ? 'color-#2563EB' : 'color-#94A3B8'"
                @tap="handlePageChange(page + 1)"
              >
                下一页
              </text>
            </view>

            <view v-if="listLoading" class="loading-bar rounded-24 py-18 px-20 text-center">
              <text class="text-22 color-#64748B">资产明细加载中...</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.asset-detail-page {
  min-height: 100vh;
}

.hero-card,
.section-card,
.record-card,
.state-card,
.pagination-bar,
.loading-bar {
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 16rpx 44rpx rgb(15 23 42 / 6%);
}

.eyebrow {
  color: #2563eb;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.record-tag,
.filter-chip-idle,
.pagination-bar,
.loading-bar {
  border: 1px solid #e2e8f0;
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

.filter-chip {
  border: 1px solid transparent;
}

.filter-chip-idle {
  background: rgb(255 255 255 / 86%);
  color: #5b6b86;
}

.filter-chip-all {
  background: #0f172a;
  color: #fff;
  box-shadow: 0 12rpx 28rpx rgb(15 23 42 / 14%);
}

.filter-chip-income {
  background: rgb(220 252 231 / 96%);
  border-color: rgb(167 243 208 / 96%);
  color: #047857;
}

.filter-chip-expense {
  background: rgb(255 228 230 / 96%);
  border-color: rgb(254 205 211 / 96%);
  color: #dc2626;
}

.record-card {
  border: 1px solid #e2e8f0;
}

.record-title {
  position: relative;
  padding-left: 18rpx;
}

.record-title::before {
  position: absolute;
  top: 6rpx;
  left: 0;
  width: 8rpx;
  height: 28rpx;
  border-radius: 9999rpx;
  background: #2563eb;
  content: '';
}

.record-tag {
  background: #f8fafc;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
