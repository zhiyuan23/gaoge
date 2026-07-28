import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import PageHeaderBar from './PageHeaderBar.vue'

describe('PageHeaderBar', () => {
  it('renders the shared brand header and navigates to the configured route', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>home</div>' } },
        { path: '/teams/football', component: { template: '<div>teams</div>' } },
      ],
    })

    await router.push('/')
    await router.isReady()

    const wrapper = mount(PageHeaderBar, {
      props: {
        backTo: '/teams/football',
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('GAOGE SPORTS')
    expect(wrapper.text()).toContain('返回')

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/teams/football')
  })
})
