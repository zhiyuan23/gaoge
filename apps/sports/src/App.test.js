import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from './App.vue'
import router from './router'

const shareApi = vi.hoisted(() => ({
  syncWechatShare: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/utils/wechatShare', () => shareApi)

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/hero',
        name: 'hero',
        component: { template: '<div data-test="route-home">Home</div>' },
      },
      {
        path: '/assets',
        name: 'team-assets',
        component: { template: '<div data-test="route-assets">Assets</div>' },
      },
      {
        path: '/teams/football/assets',
        redirect: '/assets',
      },
      {
        path: '/teams/:team',
        name: 'team',
        component: { template: '<div data-test="route-teams">Teams</div>' },
      },
      {
        path: '/teams',
        redirect: '/',
      },
      {
        path: '/',
        name: 'teams',
        component: { template: '<div data-test="route-teams">Teams</div>' },
      },
    ],
  })
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the hero route inside the app shell', async () => {
    await router.push('/hero')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.get('[data-test="site-header"]').text()).toContain('高歌体育')
    expect(wrapper.findAll('[data-test="fullpage-section"]')).toHaveLength(5)
    expect(wrapper.get('[data-test="nav-link-1"]').classes()).toContain('is-current')
    expect(wrapper.text()).toContain('高歌')
    expect(wrapper.text()).toContain('传奇')
  })

  it('uses the teams page as the root route and redirects the legacy teams path', async () => {
    const testRouter = createTestRouter()

    expect(testRouter.resolve('/').name).toBe('teams')
    expect(testRouter.resolve('/hero').name).toBe('hero')
    expect(testRouter.resolve('/assets').name).toBe('team-assets')

    await testRouter.push('/teams')

    expect(testRouter.currentRoute.value.fullPath).toBe('/')
    expect(testRouter.currentRoute.value.name).toBe('teams')

    await testRouter.push('/teams/football/assets')

    expect(testRouter.currentRoute.value.fullPath).toBe('/assets')
    expect(testRouter.currentRoute.value.name).toBe('team-assets')
  })

  it('syncs wechat share on initial render and after route changes', async () => {
    const testRouter = createTestRouter()
    await testRouter.push('/')
    await testRouter.isReady()

    mount(App, {
      global: {
        plugins: [testRouter],
        stubs: {
          Icon: { template: '<span />' },
        },
      },
    })

    await flushPromises()

    expect(shareApi.syncWechatShare).toHaveBeenCalledWith(expect.objectContaining({ path: '/' }))

    await testRouter.push('/assets')
    await flushPromises()

    expect(shareApi.syncWechatShare).toHaveBeenLastCalledWith(
      expect.objectContaining({ path: '/assets' }),
    )
  })
})
