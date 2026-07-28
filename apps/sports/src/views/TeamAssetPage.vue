<script setup>
import { computed, onMounted, ref } from 'vue'

import PageHeaderBar from '@/components/PageHeaderBar.vue'
import { fetchFootballAssetRecords, fetchFootballAssetSummary } from '@/utils/football'

defineOptions({
  name: 'TeamAssetPage',
})

const activeFilter = ref('all')
const page = ref(1)
const pageSize = 15
const summaryLoading = ref(false)
const listLoading = ref(false)
const summaryError = ref('')
const listError = ref('')
const summary = ref({
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
})
const records = ref([])
const total = ref(0)

const filterOptions = [
  { key: 'all', label: '全部' },
  { key: 'income', label: '收入' },
  { key: 'expense', label: '支出' },
]

const maxPage = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const hasPrevPage = computed(() => page.value > 1)
const hasNextPage = computed(() => page.value < maxPage.value)

const formatCurrencyFromCent = (amount) =>
  `¥${(amount / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const formatSignedAmount = (record) => {
  const prefix = record.direction === 'income' ? '+' : '-'
  return `${prefix}${formatCurrencyFromCent(record.amount)}`
}

const formatRecordDate = (value) => String(value).slice(0, 10)

const getRecordTypeLabel = (recordType) => {
  const labels = {
    match_fee: '比赛收费',
    extra_income: '额外收入',
    equipment: '装备支出',
    activity: '活动支出',
    other_expense: '其他支出',
  }

  return labels[recordType] || recordType
}

const scrollToTop = () => {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

const loadSummary = async () => {
  summaryLoading.value = true
  summaryError.value = ''

  try {
    summary.value = await fetchFootballAssetSummary()
  } catch (error) {
    summaryError.value = error instanceof Error ? error.message : '资产总览加载失败'
  } finally {
    summaryLoading.value = false
  }
}

const loadRecords = async () => {
  listLoading.value = true
  listError.value = ''

  try {
    const direction = activeFilter.value === 'all' ? undefined : activeFilter.value
    const payload = await fetchFootballAssetRecords({
      page: page.value,
      pageSize,
      direction,
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

const changeFilter = async (nextFilter) => {
  if (activeFilter.value === nextFilter) {
    return
  }

  activeFilter.value = nextFilter
  page.value = 1
  await loadRecords()
}

const goToPage = async (nextPage) => {
  if (nextPage < 1 || nextPage > maxPage.value || nextPage === page.value) {
    return
  }

  page.value = nextPage
  await loadRecords()
}

const getFilterButtonClass = (filterKey) => {
  if (activeFilter.value !== filterKey) {
    return 'border-white/10 bg-white/5 text-white/70 hover:border-white/18 hover:bg-white/8 hover:text-white'
  }

  if (filterKey === 'income') {
    return 'border-emerald-300/55 bg-emerald-300 text-[#04110a] shadow-[0_0_20px_rgba(52,211,153,0.18)]'
  }

  if (filterKey === 'expense') {
    return 'border-rose-300/55 bg-rose-300 text-[#190608] shadow-[0_0_20px_rgba(251,113,133,0.18)]'
  }

  return 'border-white/30 bg-white text-[#090a0d] shadow-[0_0_20px_rgba(255,255,255,0.12)]'
}

onMounted(() => {
  scrollToTop()
  void Promise.all([loadSummary(), loadRecords()])
})
</script>

<template>
  <div class="min-h-screen bg-[#090a0d] text-white">
    <PageHeaderBar back-to="/teams/football" />

    <div class="mx-auto max-w-5xl px-4 pb-20 pt-20 md:px-8">
      <header class="mb-6">
        <p class="text-xs uppercase tracking-[0.16em] text-white/40">Gaoge FC</p>
        <h1 class="mt-2 text-2xl font-bold text-[#1ed760]">球队资产明细</h1>
        <p class="mt-2 text-sm text-white/60">查看高歌FC当前公开收支总览与历史流水记录。</p>
      </header>

      <section class="border-white/8 mb-6 rounded-3xl border bg-white/5 p-4 md:p-6">
        <div v-if="summaryLoading" class="text-sm text-white/55">资产总览加载中...</div>
        <div v-else-if="summaryError" class="text-sm text-rose-200">
          资产总览加载失败：{{ summaryError }}
        </div>
        <div v-else class="grid grid-cols-3 gap-2 md:gap-3">
          <div class="border-white/8 min-w-0 rounded-2xl border bg-[#0f1117] p-3 md:p-4">
            <p class="text-[11px] text-white/40 md:text-xs">总收入</p>
            <p class="mt-2 text-lg font-semibold leading-tight text-emerald-300 md:text-xl">
              {{ formatCurrencyFromCent(summary.totalIncome) }}
            </p>
          </div>
          <div class="border-white/8 min-w-0 rounded-2xl border bg-[#0f1117] p-3 md:p-4">
            <p class="text-[11px] text-white/40 md:text-xs">总支出</p>
            <p class="mt-2 text-lg font-semibold leading-tight text-rose-300 md:text-xl">
              {{ formatCurrencyFromCent(summary.totalExpense) }}
            </p>
          </div>
          <div class="border-white/8 min-w-0 rounded-2xl border bg-[#0f1117] p-3 md:p-4">
            <p class="text-[11px] text-white/40 md:text-xs">当前结余</p>
            <p class="mt-2 text-lg font-semibold leading-tight text-sky-300 md:text-xl">
              {{ formatCurrencyFromCent(summary.balance) }}
            </p>
          </div>
        </div>
      </section>

      <section class="border-white/8 rounded-3xl border bg-white/5 p-4 md:p-6">
        <div class="mb-4 flex flex-wrap gap-2">
          <button
            v-for="option in filterOptions"
            :key="option.key"
            :data-test="`asset-filter-${option.key}`"
            class="cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition"
            :class="getFilterButtonClass(option.key)"
            @click="changeFilter(option.key)"
          >
            {{ option.label }}
          </button>
        </div>

        <div class="relative min-h-[22rem]">
          <div v-if="listError" class="py-10 text-center">
            <p class="text-sm text-rose-200">资产明细加载失败：{{ listError }}</p>
            <button
              class="border-white/12 mt-4 cursor-pointer rounded-full border px-4 py-2 text-sm text-white transition"
              @click="loadRecords"
            >
              重试
            </button>
          </div>
          <div v-else-if="!records.length && !listLoading" class="py-10 text-center">
            <p class="text-sm font-medium text-white/75">暂无资产记录</p>
            <p class="text-white/42 mt-2 text-xs tracking-[0.08em]">
              球队收支记录录入后会展示在这里
            </p>
          </div>
          <div
            v-else-if="records.length"
            class="space-y-3 transition-opacity"
            :class="listLoading ? 'pointer-events-none opacity-45' : 'opacity-100'"
          >
            <article
              v-for="record in records"
              :key="record.id"
              class="border-white/8 rounded-2xl border bg-[#0f1117] p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2
                      class="bg-[#1ed760]/8 rounded-r-md border-l-2 border-[#1ed760]/70 py-1 pl-3 pr-2 text-base font-semibold text-white"
                    >
                      {{ record.title }}
                    </h2>
                    <span
                      class="rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/60"
                    >
                      {{ getRecordTypeLabel(record.recordType) }}
                    </span>
                  </div>
                  <p v-if="record.description" class="mt-2 text-sm text-white/70">
                    {{ record.description }}
                  </p>
                  <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45">
                    <span>{{ formatRecordDate(record.recordDate) }}</span>
                    <span v-if="record.seasonLabel">{{ record.seasonLabel }}</span>
                    <span v-if="record.matchLabel">{{ record.matchLabel }}</span>
                  </div>
                </div>
                <p
                  class="shrink-0 self-start pl-2 text-right text-lg font-semibold"
                  :class="record.direction === 'income' ? 'text-emerald-300' : 'text-rose-300'"
                >
                  {{ formatSignedAmount(record) }}
                </p>
              </div>
            </article>

            <div class="flex items-center justify-between pt-2 text-sm text-white/60">
              <button
                class="cursor-pointer disabled:cursor-not-allowed disabled:text-white/25"
                :disabled="!hasPrevPage"
                @click="goToPage(page - 1)"
              >
                上一页
              </button>
              <span>第 {{ page }} 页</span>
              <button
                class="cursor-pointer disabled:cursor-not-allowed disabled:text-white/25"
                :disabled="!hasNextPage"
                @click="goToPage(page + 1)"
              >
                下一页
              </button>
            </div>
          </div>

          <div
            v-if="listLoading"
            class="bg-[#090a0d]/36 absolute inset-0 flex items-center justify-center rounded-3xl backdrop-blur-[1px]"
          >
            <div
              class="border-white/12 bg-[#0f1117]/92 text-white/72 rounded-full border px-4 py-2 text-sm"
            >
              资产明细加载中...
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
