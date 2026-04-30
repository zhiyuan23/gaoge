import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/playground',
  component: Layout,
  name: 'playground',
  meta: {
    title: '测试页面',
    cacheable: true,
    icon: 'lucide:flask-conical',
  },
  children: [
    {
      path: '3d',
      name: 'playground3D',
      component: () => import('@/views/playground/3d.vue'),
      meta: {
        title: '3D',
        breadcrumb: true,
      },
    },
    {
      path: 'world',
      name: 'playgroundWorld',
      component: () => import('@/views/playground/world.vue'),
      meta: {
        title: '世界',
      },
    },
  ],
}

export default routes
