import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import App from './App.vue'
import router from './router'

describe('App', () => {
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
})
