import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/sports/content',
  component: Layout,
  name: 'sportsContent',
  redirect: '/sports/content/banner',
  meta: {
    title: '内容管理',
    cacheable: true,
    icon: 'ri:article-line',
  },
  children: [
    {
      path: 'banner',
      name: 'contentBanner',
      component: () => import('@/views/sports/content/banner/index.vue'),
      meta: {
        title: 'Banner 管理',
        auth: ['content.banner.view'],
      },
    },
    {
      path: 'rumor-post',
      name: 'contentRumorPost',
      component: () => import('@/views/sports/content/rumor-post/index.vue'),
      meta: {
        title: '流言板',
        auth: ['content.rumorPost.view'],
      },
    },
  ],
}

export default routes
