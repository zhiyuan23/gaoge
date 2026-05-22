# Football Team Assets Web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a football-only team asset entry card to the existing `apps/web` team page and a new `/teams/football/assets` read-only asset page with summary, direction filter, list rendering, and graceful loading/error/empty states.

**Architecture:** Keep `apps/web` lightweight and follow its current `utils + page component` structure. Extend `apps/web/src/utils/football.js` with focused read helpers, add one route for the asset page, keep the football asset entry inside `TeamsPage.vue`, and render the full asset experience in a new `TeamAssetPage.vue` without introducing new global state or reusable component layers.

**Tech Stack:** Vue 3, Vue Router 4, Vitest, Vue Test Utils, Vite, workspace shared types

---

## File Structure

### Data helpers

- Modify: `apps/web/src/utils/football.js`
- Create: `apps/web/src/utils/football.test.js`

### Routing and existing team page

- Modify: `apps/web/src/router/index.js`
- Modify: `apps/web/src/views/TeamsPage.vue`
- Create: `apps/web/src/views/TeamsPage.test.js`

### New football asset page

- Create: `apps/web/src/views/TeamAssetPage.vue`
- Create: `apps/web/src/views/TeamAssetPage.test.js`

### Final verification

- Test: `pnpm --filter @gaoge/app-web test`
- Test: `pnpm --filter @gaoge/app-web typecheck`
- Test: `pnpm --filter @gaoge/app-web build`

## Task 1: Add football asset read helpers

**Files:**

- Modify: `apps/web/src/utils/football.js`
- Create: `apps/web/src/utils/football.test.js`
- Test: `pnpm --filter @gaoge/app-web test -- src/utils/football.test.js`

- [ ] **Step 1: Write the failing helper tests**

Create `apps/web/src/utils/football.test.js`:

```js
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  fetchFootballAssetRecords,
  fetchFootballAssetSummary,
  fetchFootballStandings,
} from './football'
import * as api from './api'

vi.mock('./api', () => ({
  getJson: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('football utils', () => {
  it('loads football standings with year and season params', async () => {
    api.getJson.mockResolvedValue({
      season: { year: 2026, season: '春季赛' },
      rounds: [],
      teams: [],
    })

    await fetchFootballStandings({ year: 2026, season: '春季赛' })

    expect(api.getJson).toHaveBeenCalledWith('/football/standings', {
      year: 2026,
      season: '春季赛',
    })
  })

  it('loads football asset summary from the summary endpoint', async () => {
    api.getJson.mockResolvedValue({
      totalIncome: 126000,
      totalExpense: 75698,
      balance: 50302,
      waivedMatchCount: 0,
    })

    await fetchFootballAssetSummary()

    expect(api.getJson).toHaveBeenCalledWith('/football/asset-records/summary')
  })

  it('loads football asset records with page and direction filters', async () => {
    api.getJson.mockResolvedValue({ list: [], total: 0 })

    await fetchFootballAssetRecords({
      page: 2,
      pageSize: 15,
      direction: 'expense',
    })

    expect(api.getJson).toHaveBeenCalledWith('/football/asset-records', {
      page: 2,
      pageSize: 15,
      direction: 'expense',
    })
  })
})
```

- [ ] **Step 2: Run the focused helper test to verify the new exports do not exist yet**

Run:

```bash
pnpm --filter @gaoge/app-web test -- src/utils/football.test.js
```

Expected: FAIL because `fetchFootballAssetSummary` and `fetchFootballAssetRecords` are not exported yet.

- [ ] **Step 3: Add the minimal football asset helpers**

Update `apps/web/src/utils/football.js`:

```js
import { getJson } from './api'

export function fetchFootballStandings({ year, season }) {
  return getJson('/football/standings', { year, season })
}

export function fetchFootballAssetSummary() {
  return getJson('/football/asset-records/summary')
}

export function fetchFootballAssetRecords(params = {}) {
  return getJson('/football/asset-records', params)
}
```

- [ ] **Step 4: Re-run the helper test**

Run:

```bash
pnpm --filter @gaoge/app-web test -- src/utils/football.test.js
```

Expected: PASS with 3 passing tests.

- [ ] **Step 5: Commit the helper layer**

```bash
git add apps/web/src/utils/football.js apps/web/src/utils/football.test.js
git commit -m "feat: add football asset web fetch helpers"
```

## Task 2: Add the football asset entry to the team page and route shell

**Files:**

- Modify: `apps/web/src/router/index.js`
- Modify: `apps/web/src/views/TeamsPage.vue`
- Create: `apps/web/src/views/TeamsPage.test.js`
- Test: `pnpm --filter @gaoge/app-web test -- src/views/TeamsPage.test.js`

- [ ] **Step 1: Write the failing team page tests for the football asset entry**

Create `apps/web/src/views/TeamsPage.test.js`:

```js
import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import TeamsPage from './TeamsPage.vue'
import TeamAssetPage from './TeamAssetPage.vue'

const footballApi = vi.hoisted(() => ({
  fetchFootballStandings: vi.fn(),
  fetchFootballAssetSummary: vi.fn(),
}))

vi.mock('@/utils/football', () => footballApi)

function createTestRouter(initialPath = '/teams/football') {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/teams/:team?', name: 'teams', component: TeamsPage },
      { path: '/teams/football/assets', name: 'team-assets', component: TeamAssetPage },
    ],
  })
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('TeamsPage', () => {
  it('shows the football asset entry card with summary values', async () => {
    footballApi.fetchFootballStandings.mockResolvedValue({
      season: { year: 2026, season: '春季赛' },
      rounds: [],
      teams: [],
    })
    footballApi.fetchFootballAssetSummary.mockResolvedValue({
      totalIncome: 126000,
      totalExpense: 75698,
      balance: 50302,
      waivedMatchCount: 0,
    })

    const router = createTestRouter('/teams/football')
    await router.push('/teams/football')
    await router.isReady()

    const wrapper = mount(TeamsPage, {
      global: {
        plugins: [router],
        stubs: {
          Icon: { template: '<span />' },
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('球队资产')
    expect(wrapper.text()).toContain('查看明细')
    expect(wrapper.text()).toContain('¥1,260.00')
    expect(wrapper.text()).toContain('¥756.98')
    expect(wrapper.text()).toContain('¥503.02')
  })

  it('does not show the asset entry for the basketball team', async () => {
    footballApi.fetchFootballStandings.mockResolvedValue({
      season: { year: 2026, season: '春季赛' },
      rounds: [],
      teams: [],
    })
    footballApi.fetchFootballAssetSummary.mockResolvedValue({
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      waivedMatchCount: 0,
    })

    const router = createTestRouter('/teams/basketball')
    await router.push('/teams/basketball')
    await router.isReady()

    const wrapper = mount(TeamsPage, {
      global: {
        plugins: [router],
        stubs: {
          Icon: { template: '<span />' },
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).not.toContain('球队资产')
  })
})
```

- [ ] **Step 2: Run the team page test and verify it fails**

Run:

```bash
pnpm --filter @gaoge/app-web test -- src/views/TeamsPage.test.js
```

Expected: FAIL because `TeamAssetPage.vue` does not exist and `TeamsPage.vue` does not render the asset entry.

- [ ] **Step 3: Add the new route and football asset entry card**

Update `apps/web/src/router/index.js`:

```js
import { createRouter, createWebHistory } from 'vue-router'

import HomePage from '../views/HomePage.vue'
import TeamAssetPage from '../views/TeamAssetPage.vue'
import TeamsPage from '../views/TeamsPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/teams/football/assets',
    name: 'team-assets',
    component: TeamAssetPage,
  },
  {
    path: '/teams/:team?',
    name: 'teams',
    component: TeamsPage,
  },
]
```

Extend `apps/web/src/views/TeamsPage.vue` with the smallest possible new state and helpers:

```js
import { fetchFootballAssetSummary, fetchFootballStandings } from '@/utils/football'

const assetSummary = ref({
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
})
const assetSummaryLoading = ref(false)
const assetSummaryError = ref('')

function formatCurrencyFromCent(amount) {
  return `¥${(amount / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

async function loadAssetSummary() {
  if (!isFootballTeam.value) {
    assetSummary.value = { totalIncome: 0, totalExpense: 0, balance: 0 }
    assetSummaryError.value = ''
    assetSummaryLoading.value = false
    return
  }

  assetSummaryLoading.value = true
  assetSummaryError.value = ''

  try {
    assetSummary.value = await fetchFootballAssetSummary()
  } catch (error) {
    assetSummaryError.value = error instanceof Error ? error.message : '资产总览加载失败'
  } finally {
    assetSummaryLoading.value = false
  }
}

function goToAssetPage() {
  router.push('/teams/football/assets')
}

watch(isFootballTeam, loadAssetSummary, { immediate: true })
```

Add the entry card in the template immediately after the existing description block:

```vue
<section v-if="isFootballTeam" class="border-white/8 mb-6 rounded-3xl border bg-white/5 p-4 md:p-6">
  <div class="flex items-center justify-between gap-4">
    <div>
      <p class="text-xs uppercase tracking-[0.16em] text-white/40">Team Assets</p>
      <h2 class="mt-2 text-lg font-bold" :style="{ color: teamColors[activeTeam].primary }">
        球队资产
      </h2>
      <p class="mt-2 text-sm text-white/60">公开展示高歌FC当前收支总览与历史明细。</p>
    </div>
    <button
      class="rounded-full px-4 py-2 text-sm font-semibold"
      :style="{ backgroundColor: teamColors[activeTeam].primary, color: teamColors[activeTeam].text }"
      @click="goToAssetPage"
    >
      查看明细
    </button>
  </div>

  <div v-if="assetSummaryLoading" class="mt-4 text-sm text-white/55">资产总览加载中...</div>
  <div v-else-if="assetSummaryError" class="mt-4 text-sm text-rose-200">
    资产总览加载失败：{{ assetSummaryError }}
  </div>
  <div v-else class="mt-4 grid grid-cols-3 gap-3">
    <div class="rounded-2xl border border-white/8 bg-[#0f1117] p-3">
      <p class="text-xs text-white/40">总收入</p>
      <p class="mt-2 text-lg font-semibold text-emerald-300">
        {{ formatCurrencyFromCent(assetSummary.totalIncome) }}
      </p>
    </div>
    <div class="rounded-2xl border border-white/8 bg-[#0f1117] p-3">
      <p class="text-xs text-white/40">总支出</p>
      <p class="mt-2 text-lg font-semibold text-rose-300">
        {{ formatCurrencyFromCent(assetSummary.totalExpense) }}
      </p>
    </div>
    <div class="rounded-2xl border border-white/8 bg-[#0f1117] p-3">
      <p class="text-xs text-white/40">当前结余</p>
      <p class="mt-2 text-lg font-semibold text-sky-300">
        {{ formatCurrencyFromCent(assetSummary.balance) }}
      </p>
    </div>
  </div>
</section>
```

Create a temporary shell component `apps/web/src/views/TeamAssetPage.vue` so the new route resolves:

```vue
<script setup>
defineOptions({
  name: 'TeamAssetPage',
})
</script>

<template>
  <div class="min-h-screen bg-[#090a0d] text-white">loading asset page shell</div>
</template>
```

- [ ] **Step 4: Re-run the team page test**

Run:

```bash
pnpm --filter @gaoge/app-web test -- src/views/TeamsPage.test.js
```

Expected: PASS with 2 passing tests.

- [ ] **Step 5: Commit the route and entry card**

```bash
git add apps/web/src/router/index.js apps/web/src/views/TeamsPage.vue apps/web/src/views/TeamsPage.test.js apps/web/src/views/TeamAssetPage.vue
git commit -m "feat: add football asset entry card to teams page"
```

## Task 3: Build the dedicated football asset page

**Files:**

- Modify: `apps/web/src/views/TeamAssetPage.vue`
- Create: `apps/web/src/views/TeamAssetPage.test.js`
- Test: `pnpm --filter @gaoge/app-web test -- src/views/TeamAssetPage.test.js`

- [ ] **Step 1: Write the failing asset page tests**

Create `apps/web/src/views/TeamAssetPage.test.js`:

```js
import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import TeamAssetPage from './TeamAssetPage.vue'

const footballApi = vi.hoisted(() => ({
  fetchFootballAssetRecords: vi.fn(),
  fetchFootballAssetSummary: vi.fn(),
}))

vi.mock('@/utils/football', () => footballApi)

afterEach(() => {
  vi.clearAllMocks()
})

describe('TeamAssetPage', () => {
  it('renders summary data and the first page of football asset records', async () => {
    footballApi.fetchFootballAssetSummary.mockResolvedValue({
      totalIncome: 126000,
      totalExpense: 75698,
      balance: 50302,
      waivedMatchCount: 0,
    })
    footballApi.fetchFootballAssetRecords.mockResolvedValue({
      total: 2,
      list: [
        {
          id: 1,
          direction: 'income',
          recordType: 'match_fee',
          amount: 2000,
          seasonLabel: '26赛季春季赛',
          matchLabel: '第1场',
          isWaived: false,
          title: '春季赛场费',
          description: '20*10=200',
          recordDate: '2026-03-01T00:00:00.000Z',
          status: 'confirmed',
          creatorId: 1,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        },
        {
          id: 2,
          direction: 'expense',
          recordType: 'equipment',
          amount: 17800,
          seasonLabel: '26赛季春季赛',
          matchLabel: null,
          isWaived: false,
          title: '购买足球',
          description: '训练用球',
          recordDate: '2026-03-02T00:00:00.000Z',
          status: 'confirmed',
          creatorId: 1,
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        },
      ],
    })

    const wrapper = mount(TeamAssetPage)

    await flushPromises()

    expect(wrapper.text()).toContain('球队资产明细')
    expect(wrapper.text()).toContain('¥1,260.00')
    expect(wrapper.text()).toContain('春季赛场费')
    expect(wrapper.text()).toContain('+¥20.00')
    expect(wrapper.text()).toContain('购买足球')
    expect(wrapper.text()).toContain('-¥178.00')
  })

  it('reloads the list with a direction filter when the user selects 支出', async () => {
    footballApi.fetchFootballAssetSummary.mockResolvedValue({
      totalIncome: 126000,
      totalExpense: 75698,
      balance: 50302,
      waivedMatchCount: 0,
    })
    footballApi.fetchFootballAssetRecords
      .mockResolvedValueOnce({ total: 0, list: [] })
      .mockResolvedValueOnce({ total: 0, list: [] })

    const wrapper = mount(TeamAssetPage)
    await flushPromises()

    await wrapper.get('[data-test="asset-filter-expense"]').trigger('click')
    await flushPromises()

    expect(footballApi.fetchFootballAssetRecords).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 15,
      direction: 'expense',
    })
  })

  it('shows the empty state when there are no records', async () => {
    footballApi.fetchFootballAssetSummary.mockResolvedValue({
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      waivedMatchCount: 0,
    })
    footballApi.fetchFootballAssetRecords.mockResolvedValue({
      total: 0,
      list: [],
    })

    const wrapper = mount(TeamAssetPage)
    await flushPromises()

    expect(wrapper.text()).toContain('暂无资产记录')
    expect(wrapper.text()).toContain('球队收支记录录入后会展示在这里')
  })
})
```

- [ ] **Step 2: Run the asset page test and verify it fails**

Run:

```bash
pnpm --filter @gaoge/app-web test -- src/views/TeamAssetPage.test.js
```

Expected: FAIL because `TeamAssetPage.vue` is still a shell and does not request or render asset data.

- [ ] **Step 3: Implement the asset page**

Replace `apps/web/src/views/TeamAssetPage.vue` with:

```vue
<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { fetchFootballAssetRecords, fetchFootballAssetSummary } from '@/utils/football'

defineOptions({
  name: 'TeamAssetPage',
})

const router = useRouter()
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

function formatCurrencyFromCent(amount) {
  return `¥${(amount / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatSignedAmount(record) {
  const prefix = record.direction === 'income' ? '+' : '-'
  return `${prefix}${formatCurrencyFromCent(record.amount)}`
}

function formatRecordDate(value) {
  return new Date(value).toISOString().slice(0, 10)
}

function getRecordTypeLabel(recordType) {
  const labels = {
    match_fee: '比赛收费',
    extra_income: '额外收入',
    equipment: '装备支出',
    activity: '活动支出',
    other_expense: '其他支出',
  }

  return labels[recordType] || recordType
}

function getStatusLabel(status) {
  return status === 'cancelled' ? '已取消' : '已确认'
}

async function loadSummary() {
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

async function loadRecords() {
  listLoading.value = true
  listError.value = ''

  try {
    records.value = []
    const direction = activeFilter.value === 'all' ? undefined : activeFilter.value
    const payload = await fetchFootballAssetRecords({
      page: page.value,
      pageSize,
      direction,
    })
    records.value = payload.list
    total.value = payload.total
  } catch (error) {
    listError.value = error instanceof Error ? error.message : '资产明细加载失败'
  } finally {
    listLoading.value = false
  }
}

async function changeFilter(nextFilter) {
  if (activeFilter.value === nextFilter) {
    return
  }

  activeFilter.value = nextFilter
  page.value = 1
  await loadRecords()
}

async function goToPage(nextPage) {
  if (nextPage < 1) {
    return
  }

  const maxPage = Math.max(1, Math.ceil(total.value / pageSize))
  if (nextPage > maxPage) {
    return
  }

  page.value = nextPage
  await loadRecords()
}

const hasPrevPage = computed(() => page.value > 1)
const hasNextPage = computed(() => page.value < Math.max(1, Math.ceil(total.value / pageSize)))

void Promise.all([loadSummary(), loadRecords()])
</script>

<template>
  <div class="min-h-screen bg-[#090a0d] px-4 py-6 text-white md:px-8">
    <div class="mx-auto max-w-5xl">
      <button class="mb-6 text-sm text-white/70" @click="router.push('/teams/football')">
        返回高歌FC
      </button>

      <header class="mb-6">
        <p class="text-xs uppercase tracking-[0.16em] text-white/40">Gaoge FC</p>
        <h1 class="mt-2 text-2xl font-bold">球队资产明细</h1>
        <p class="mt-2 text-sm text-white/60">查看高歌FC当前公开收支总览与历史流水记录。</p>
      </header>

      <section class="border-white/8 mb-6 rounded-3xl border bg-white/5 p-4 md:p-6">
        <div v-if="summaryLoading" class="text-sm text-white/55">资产总览加载中...</div>
        <div v-else-if="summaryError" class="text-sm text-rose-200">
          资产总览加载失败：{{ summaryError }}
        </div>
        <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div class="border-white/8 rounded-2xl border bg-[#0f1117] p-4">
            <p class="text-xs text-white/40">总收入</p>
            <p class="mt-2 text-xl font-semibold text-emerald-300">
              {{ formatCurrencyFromCent(summary.totalIncome) }}
            </p>
          </div>
          <div class="border-white/8 rounded-2xl border bg-[#0f1117] p-4">
            <p class="text-xs text-white/40">总支出</p>
            <p class="mt-2 text-xl font-semibold text-rose-300">
              {{ formatCurrencyFromCent(summary.totalExpense) }}
            </p>
          </div>
          <div class="border-white/8 rounded-2xl border bg-[#0f1117] p-4">
            <p class="text-xs text-white/40">当前结余</p>
            <p class="mt-2 text-xl font-semibold text-sky-300">
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
            class="rounded-full border px-4 py-2 text-sm transition"
            :class="
              activeFilter === option.key
                ? 'border-white/30 bg-white text-[#090a0d]'
                : 'border-white/10 bg-white/5 text-white/70'
            "
            @click="changeFilter(option.key)"
          >
            {{ option.label }}
          </button>
        </div>

        <div v-if="listLoading" class="py-10 text-center text-sm text-white/55">
          资产明细加载中...
        </div>
        <div v-else-if="listError" class="py-10 text-center">
          <p class="text-sm text-rose-200">资产明细加载失败：{{ listError }}</p>
          <button
            class="border-white/12 mt-4 rounded-full border px-4 py-2 text-sm"
            @click="loadRecords"
          >
            重试
          </button>
        </div>
        <div v-else-if="!records.length" class="py-10 text-center">
          <p class="text-sm font-medium text-white/75">暂无资产记录</p>
          <p class="text-white/42 mt-2 text-xs tracking-[0.08em]">球队收支记录录入后会展示在这里</p>
        </div>
        <div v-else class="space-y-3">
          <article
            v-for="record in records"
            :key="record.id"
            class="border-white/8 rounded-2xl border bg-[#0f1117] p-4"
          >
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-base font-semibold text-white">{{ record.title }}</h2>
                  <span
                    class="rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/60"
                  >
                    {{ record.direction === 'income' ? '收入' : '支出' }}
                  </span>
                  <span
                    class="rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/60"
                  >
                    {{ getRecordTypeLabel(record.recordType) }}
                  </span>
                  <span
                    class="rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/60"
                  >
                    {{ getStatusLabel(record.status) }}
                  </span>
                </div>
                <p class="mt-2 text-sm text-white/70">{{ record.description }}</p>
                <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45">
                  <span>{{ formatRecordDate(record.recordDate) }}</span>
                  <span v-if="record.seasonLabel">{{ record.seasonLabel }}</span>
                  <span v-if="record.matchLabel">{{ record.matchLabel }}</span>
                </div>
              </div>
              <p
                class="text-lg font-semibold"
                :class="record.direction === 'income' ? 'text-emerald-300' : 'text-rose-300'"
              >
                {{ formatSignedAmount(record) }}
              </p>
            </div>
          </article>

          <div class="flex items-center justify-between pt-2 text-sm text-white/60">
            <button :disabled="!hasPrevPage" @click="goToPage(page - 1)">上一页</button>
            <span>第 {{ page }} 页</span>
            <button :disabled="!hasNextPage" @click="goToPage(page + 1)">下一页</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Run the focused asset page test**

Run:

```bash
pnpm --filter @gaoge/app-web test -- src/views/TeamAssetPage.test.js
```

Expected: PASS with 3 passing tests.

- [ ] **Step 5: Run the full web test suite**

Run:

```bash
pnpm --filter @gaoge/app-web test
```

Expected: PASS for `App.test.js`, `homepage.test.js`, `football.test.js`, `TeamsPage.test.js`, and `TeamAssetPage.test.js`.

- [ ] **Step 6: Commit the asset page**

```bash
git add apps/web/src/views/TeamAssetPage.vue apps/web/src/views/TeamAssetPage.test.js
git commit -m "feat: add football team asset detail page"
```

## Task 4: Verify production readiness

**Files:**

- Verify: `apps/web/src/router/index.js`
- Verify: `apps/web/src/views/TeamsPage.vue`
- Verify: `apps/web/src/views/TeamAssetPage.vue`
- Test: `pnpm --filter @gaoge/app-web typecheck`
- Test: `pnpm --filter @gaoge/app-web build`

- [ ] **Step 1: Run web typecheck**

Run:

```bash
pnpm --filter @gaoge/app-web typecheck
```

Expected: PASS with no new type errors.

- [ ] **Step 2: Run web production build**

Run:

```bash
pnpm --filter @gaoge/app-web build
```

Expected: PASS and output emitted under `apps/web/dist`.

- [ ] **Step 3: Run the local web app for manual verification**

Run:

```bash
pnpm dev:web
```

Expected: the Vite dev server starts and serves the app locally.

- [ ] **Step 4: Manually verify the main user flows**

Check these paths and behaviors in the running app:

```text
1. Open /teams/football and confirm the asset card appears after the quote block.
2. Confirm the asset card shows summary values, loading text, or an inline error without breaking the rest of the page.
3. Click 查看明细 and confirm navigation to /teams/football/assets.
4. On the asset page, confirm summary cards render above the filter buttons.
5. Switch 全部 -> 收入 -> 支出 and confirm the list reloads each time.
6. Confirm empty and error states render as dedicated content blocks rather than blank space.
7. Click 返回高歌FC and confirm navigation returns to /teams/football.
```

- [ ] **Step 5: Record the verification results in the execution notes**

Write these exact results into the running task log or final handoff message:

```text
- Web tests: PASS
- Web typecheck: PASS
- Web build: PASS
- Manual flow: PASS for football entry card, asset detail navigation, filter switching, empty/error state rendering, and return navigation
```
