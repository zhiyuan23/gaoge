import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/plugin_example',
  component: Layout,
  redirect: '/home',
  name: 'pluginExample',
  meta: {
    title: '插件',
    icon: 'i-clarity:plugin-outline-alerted',
    enabled: false,
  },
  children: [],
}

export default routes
