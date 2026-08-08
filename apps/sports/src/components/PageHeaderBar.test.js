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

  it('renders a right-side action without a back button', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>teams</div>' } },
        { path: '/hero', component: { template: '<div>hero</div>' } },
      ],
    })

    await router.push('/')
    await router.isReady()

    const wrapper = mount(PageHeaderBar, {
      props: {
        actionGlyph: 'S',
        actionLabel: 'HERO',
        actionTo: '/hero',
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).not.toContain('返回')
    expect(wrapper.get('button').text()).toBe('S')
    expect(wrapper.get('header').classes()).toContain('py-2')
    expect(wrapper.get('header').classes()).toContain('sm:py-3')
    expect(wrapper.get('button').classes()).toContain('h-8')
    expect(wrapper.get('button').classes()).toContain('w-8')
    expect(wrapper.get('header > div').classes()).toContain('max-w-5xl')
    expect(wrapper.get('header > div').classes()).toContain('md:px-16')
    expect(wrapper.get('button').attributes('aria-label')).toBe('HERO 页面')

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/hero')
  })
})
