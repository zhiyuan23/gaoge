import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/gaoge',
  component: Layout,
  name: 'gaoge',
  meta: {
    title: '高歌FC',
    cacheable: true,
    icon: 'lucide:star',
  },
  children: [
    {
      path: 'home',
      name: 'gaogeHome',
      component: () => import('@/views/gaoge/home.vue'),
      meta: {
        title: '首页',
        hidden: true,
        breadcrumb: true,
      },
    },
    {
      path: '3d',
      name: 'gaoge3D',
      component: () => import('@/views/gaoge/3d.vue'),
      meta: {
        title: '3D',
        hidden: true,
        breadcrumb: true,
      },
    },
    {
      path: 'world',
      name: 'gaogeWorld',
      component: () => import('@/views/gaoge/world.vue'),
      meta: {
        title: '世界',
      },
    },
    {
      path: 'player',
      name: 'player',
      component: () => import('@/views/gaoge/player/index.vue'),
      meta: {
        title: '球员信息',
      },
    },
  ],
}

export default routes
