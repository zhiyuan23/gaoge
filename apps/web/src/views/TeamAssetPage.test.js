import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import TeamAssetPage from './TeamAssetPage.vue'

const footballApi = vi.hoisted(() => ({
  fetchFootballAssetRecords: vi.fn(),
  fetchFootballAssetSummary: vi.fn(),
}))

vi.mock('@/utils/football', () => footballApi)

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/teams/football/assets', name: 'team-assets', component: TeamAssetPage },
      { path: '/teams/football', name: 'teams', component: { template: '<div>teams</div>' } },
    ],
  })
}

async function mountPage() {
  const router = createTestRouter()
  await router.push('/teams/football/assets')
  await router.isReady()

  return mount(TeamAssetPage, {
    global: {
      plugins: [router],
    },
  })
}

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

    const wrapper = await mountPage()

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

    const wrapper = await mountPage()
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

    const wrapper = await mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('暂无资产记录')
    expect(wrapper.text()).toContain('球队收支记录录入后会展示在这里')
  })
})
