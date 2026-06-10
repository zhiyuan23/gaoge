import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import TeamAssetPage from './TeamAssetPage.vue'
import TeamsPage from './TeamsPage.vue'

const footballApi = vi.hoisted(() => ({
  fetchFootballStandings: vi.fn(),
  fetchFootballAssetSummary: vi.fn(),
}))

vi.mock('@/utils/football', () => footballApi)

function createTestRouter() {
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
    expect(wrapper.findAll('section > div.mb-5')[0].classes()).toContain('items-start')
    expect(wrapper.findAll('section > div.mb-5')[0].classes()).toContain('justify-between')
    expect(wrapper.findAll('section > div.mb-5')[0].classes()).not.toContain('flex-col')
    expect(wrapper.findAll('section .grid')[0].classes()).toContain('grid-cols-3')
    expect(
      wrapper
        .findAll('button')
        .find((button) => button.text().includes('查看明细'))
        ?.classes(),
    ).toContain('shrink-0')
    expect(
      wrapper
        .findAll('button')
        .find((button) => button.text().includes('查看明细'))
        ?.classes(),
    ).toContain('text-xs')
    expect(wrapper.findAll('section .grid > div > p')[1].classes()).toContain('text-lg')
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

  it('renders season tabs and reloads standings when a season is selected', async () => {
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

    const yearSelect = wrapper.find('select[data-testid="standings-season-year"]')
    const seasonTabs = wrapper.findAll('button[data-season-name]')
    const summerTab = wrapper.find('button[data-season-name="夏季赛"]')
    const seasonTabsContainer = summerTab.element.parentElement

    expect(yearSelect.exists()).toBe(true)
    expect(seasonTabs).toHaveLength(4)
    expect(seasonTabsContainer?.className).toContain('flex-nowrap')
    expect(seasonTabsContainer?.className).not.toContain('flex-wrap')

    await summerTab.trigger('click')
    await flushPromises()

    expect(footballApi.fetchFootballStandings).toHaveBeenLastCalledWith({
      year: 2026,
      season: '夏季赛',
    })
  })

  it('does not show a loading state when switching seasons', async () => {
    let resolveSummerStanding

    footballApi.fetchFootballStandings
      .mockResolvedValueOnce({
        season: { year: 2026, season: '春季赛' },
        rounds: [
          { id: 1, round: 1, label: '第1轮' },
          { id: 2, round: 2, label: '第2轮' },
        ],
        teams: [
          {
            teamId: 1,
            teamCode: 'real',
            teamName: '皇家高歌',
            totalPoints: 3,
            roundPoints: [2, 1],
          },
          {
            teamId: 2,
            teamCode: 'inter',
            teamName: '高歌国际',
            totalPoints: 2,
            roundPoints: [1, 1],
          },
          {
            teamId: 3,
            teamCode: 'united',
            teamName: '高歌联',
            totalPoints: 1,
            roundPoints: [0, 1],
          },
        ],
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSummerStanding = resolve
          }),
      )
    footballApi.fetchFootballAssetSummary.mockResolvedValue({
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
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

    await wrapper.find('button[data-season-name="夏季赛"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('积分榜加载中...')

    resolveSummerStanding({
      season: { year: 2026, season: '夏季赛' },
      rounds: [],
      teams: [],
    })
    await flushPromises()
  })

  it('renders standings cards and ten default round rows when no matches exist', async () => {
    footballApi.fetchFootballStandings.mockResolvedValue({
      season: { year: 2026, season: '冬季赛' },
      rounds: [],
      teams: [],
    })
    footballApi.fetchFootballAssetSummary.mockResolvedValue({
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
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

    const standingsCards = wrapper.findAll('article')
    const tableRows = wrapper.findAll('tbody tr')
    const firstRoundCells = tableRows[0]?.findAll('td') ?? []

    expect(wrapper.text()).not.toContain('暂无比赛数据')
    expect(standingsCards).toHaveLength(3)
    expect(wrapper.text()).toContain('皇家高歌')
    expect(wrapper.text()).toContain('高歌国际')
    expect(wrapper.text()).toContain('高歌联')
    expect(tableRows).toHaveLength(10)
    expect(tableRows[0]?.text()).toContain('第1轮')
    expect(tableRows[9]?.text()).toContain('第10轮')
    expect(firstRoundCells).toHaveLength(3)
    expect(firstRoundCells.every((cell) => cell.text().trim() === '-')).toBe(true)
    expect(wrapper.text()).toContain('总积分000')
  })
})
