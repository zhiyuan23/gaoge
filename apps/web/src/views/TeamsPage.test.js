import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { fetchFootballStandings } from '@/utils/football'

import TeamsPage from './TeamsPage.vue'

vi.mock('@/utils/football', () => ({
  fetchFootballStandings: vi.fn(),
}))

describe('TeamsPage football standings', () => {
  const createDeferred = () => {
    let resolve
    let reject
    const promise = new Promise((res, rej) => {
      resolve = res
      reject = rej
    })

    return { promise, resolve, reject }
  }

  const createRouterForTeamsPage = async (path = '/teams/football') => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/teams/:team?', component: TeamsPage }],
    })

    router.push(path)
    await router.isReady()

    return router
  }

  const mountTeamsPage = async (path = '/teams/football') => {
    const router = await createRouterForTeamsPage(path)

    return mount(TeamsPage, {
      global: {
        plugins: [router],
      },
    })
  }

  beforeEach(() => {
    fetchFootballStandings.mockReset()
  })

  it('requests the default 2026 spring standings for football pages', async () => {
    fetchFootballStandings.mockResolvedValue({
      season: { year: 2026, season: '春季赛' },
      rounds: [],
      teams: [],
    })

    await mountTeamsPage()

    await flushPromises()

    expect(fetchFootballStandings).toHaveBeenCalledWith({
      year: 2026,
      season: '春季赛',
    })
  })

  it('renders the standings section and totals after loading football data', async () => {
    fetchFootballStandings.mockResolvedValue({
      season: { year: 2026, season: '春季赛' },
      rounds: [
        { id: 11, round: 1, label: '第1轮', matchDate: '2026-03-01T12:00:00.000Z' },
        { id: 12, round: 2, label: '第2轮', matchDate: '2026-03-08T12:00:00.000Z' },
      ],
      teams: [
        { teamId: 2, teamCode: 'inter', teamName: '高歌国际', totalPoints: 3, roundPoints: [1, 2] },
        { teamId: 1, teamCode: 'real', teamName: '皇家高歌', totalPoints: 2, roundPoints: [2, 0] },
        { teamId: 3, teamCode: 'united', teamName: '高歌联', totalPoints: 1, roundPoints: [0, 1] },
      ],
    })

    const wrapper = await mountTeamsPage()

    await flushPromises()

    expect(wrapper.text()).toContain('赛季排行榜')
    expect(wrapper.text()).toContain('按赛季查看三支球队积分对比与每轮明细')
    expect(wrapper.text()).toContain('总积分走势')
    expect(wrapper.text()).toContain('春季赛')
    expect(wrapper.text()).toContain('2026')
    expect(wrapper.text()).toContain('第1轮')
    expect(wrapper.text()).toContain('第2轮')
    expect(wrapper.text()).toContain('高歌国际')
    expect(wrapper.text()).toContain('皇家高歌')
    expect(wrapper.text()).toContain('高歌联')
    expect(wrapper.text()).toContain('总积分')
    expect(wrapper.text()).toContain('6')
    expect(wrapper.text()).toContain('3')
  })

  it('renders an empty state when the season has no rounds', async () => {
    fetchFootballStandings.mockResolvedValue({
      season: { year: 2026, season: '春季赛' },
      rounds: [],
      teams: [
        { teamId: 1, teamCode: 'real', teamName: '皇家高歌', totalPoints: 0, roundPoints: [] },
        { teamId: 2, teamCode: 'inter', teamName: '高歌国际', totalPoints: 0, roundPoints: [] },
        { teamId: 3, teamCode: 'united', teamName: '高歌联', totalPoints: 0, roundPoints: [] },
      ],
    })

    const wrapper = await mountTeamsPage()

    await flushPromises()

    expect(wrapper.text()).toContain('赛季排行榜')
    expect(wrapper.text()).toContain('暂无比赛数据')
    expect(wrapper.text()).not.toContain('第1轮')
  })

  it('ignores stale standings responses when a newer season request finishes later', async () => {
    const springRequest = createDeferred()
    const summerRequest = createDeferred()

    fetchFootballStandings.mockImplementation(({ season }) => {
      if (season === '春季赛') {
        return springRequest.promise
      }

      if (season === '夏季赛') {
        return summerRequest.promise
      }

      throw new Error(`Unexpected season ${season}`)
    })

    const wrapper = await mountTeamsPage()

    expect(wrapper.text()).toContain('排行榜加载中...')

    const seasonSelect = wrapper.findAll('select')[1]
    await seasonSelect.setValue('夏季赛')

    expect(fetchFootballStandings).toHaveBeenNthCalledWith(1, {
      year: 2026,
      season: '春季赛',
    })
    expect(fetchFootballStandings).toHaveBeenNthCalledWith(2, {
      year: 2026,
      season: '夏季赛',
    })

    springRequest.resolve({
      season: { year: 2026, season: '春季赛' },
      rounds: [{ id: 11, round: 1, label: '旧第1轮', matchDate: '2026-03-01T12:00:00.000Z' }],
      teams: [
        { teamId: 1, teamCode: 'real', teamName: '皇家高歌', totalPoints: 2, roundPoints: [2] },
        { teamId: 2, teamCode: 'inter', teamName: '高歌国际', totalPoints: 1, roundPoints: [1] },
        { teamId: 3, teamCode: 'united', teamName: '高歌联', totalPoints: 0, roundPoints: [0] },
      ],
    })

    await flushPromises()

    expect(wrapper.text()).toContain('排行榜加载中...')
    expect(wrapper.text()).not.toContain('旧第1轮')

    summerRequest.resolve({
      season: { year: 2026, season: '夏季赛' },
      rounds: [{ id: 21, round: 1, label: '新第1轮', matchDate: '2026-06-01T12:00:00.000Z' }],
      teams: [
        { teamId: 2, teamCode: 'inter', teamName: '高歌国际', totalPoints: 2, roundPoints: [2] },
        { teamId: 1, teamCode: 'real', teamName: '皇家高歌', totalPoints: 1, roundPoints: [1] },
        { teamId: 3, teamCode: 'united', teamName: '高歌联', totalPoints: 0, roundPoints: [0] },
      ],
    })

    await flushPromises()

    expect(wrapper.text()).toContain('夏季赛')
    expect(wrapper.text()).toContain('新第1轮')
    expect(wrapper.text()).not.toContain('排行榜加载中...')
    expect(wrapper.text()).not.toContain('旧第1轮')
  })
})
