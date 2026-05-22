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
})
