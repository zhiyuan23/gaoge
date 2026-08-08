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
      { path: '/assets', name: 'team-assets', component: TeamAssetPage },
      { path: '/', name: 'teams', component: { template: '<div>teams</div>' } },
    ],
  })
}

async function mountPage() {
  const router = createTestRouter()
  await router.push('/assets')
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
  it('scrolls to the top when the asset page mounts', async () => {
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

    const scrollToSpy = vi.fn()
    window.scrollTo = scrollToSpy
    document.documentElement.scrollTop = 120
    document.body.scrollTop = 120

    await mountPage()
    await flushPromises()

    expect(scrollToSpy).toHaveBeenCalledWith(0, 0)
    expect(document.documentElement.scrollTop).toBe(0)
    expect(document.body.scrollTop).toBe(0)
  })

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
    expect(wrapper.get('h1').classes()).toContain('text-[#1ed760]')
    expect(wrapper.findAll('article h2')[0].classes()).toContain('text-white')
    expect(wrapper.findAll('article h2')[0].classes()).toContain('border-l-2')
    expect(wrapper.find('section .grid').classes()).toContain('grid-cols-3')
    expect(wrapper.findAll('section .grid > div > p')[1].classes()).toContain('text-lg')
    expect(wrapper.find('article > div').classes()).toContain('items-start')
    expect(wrapper.find('article > div').classes()).toContain('justify-between')
    expect(wrapper.find('article > div').classes()).not.toContain('flex-col')
    expect(wrapper.get('header > div').classes()).toContain('md:px-8')
    expect(wrapper.get('div.min-h-screen > div.mx-auto.max-w-5xl').classes()).toContain('md:px-8')
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

  it('keeps the previous list visible while a filter refresh is loading', async () => {
    let resolveNextRequest
    const nextRequest = new Promise((resolve) => {
      resolveNextRequest = resolve
    })

    footballApi.fetchFootballAssetSummary.mockResolvedValue({
      totalIncome: 126000,
      totalExpense: 75698,
      balance: 50302,
      waivedMatchCount: 0,
    })
    footballApi.fetchFootballAssetRecords
      .mockResolvedValueOnce({
        total: 1,
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
        ],
      })
      .mockReturnValueOnce(nextRequest)

    const wrapper = await mountPage()
    await flushPromises()

    await wrapper.get('[data-test="asset-filter-expense"]').trigger('click')
    await Promise.resolve()

    expect(wrapper.text()).toContain('春季赛场费')
    expect(wrapper.text()).toContain('资产明细加载中...')

    resolveNextRequest({ total: 0, list: [] })
    await flushPromises()
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
