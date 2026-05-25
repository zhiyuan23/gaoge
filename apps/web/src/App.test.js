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
        path: '/',
        name: 'home',
        component: { template: '<div data-test="route-home">Home</div>' },
      },
      {
        path: '/teams/football/assets',
        name: 'team-assets',
        component: { template: '<div data-test="route-assets">Assets</div>' },
      },
      {
        path: '/teams/:team?',
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

  it('renders the home route inside the app shell', async () => {
    await router.push('/')
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

    await testRouter.push('/teams/football/assets')
    await flushPromises()

    expect(shareApi.syncWechatShare).toHaveBeenLastCalledWith(
      expect.objectContaining({ path: '/teams/football/assets' }),
    )
  })
})
