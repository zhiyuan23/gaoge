import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/content',
  component: Layout,
  name: 'content',
  meta: {
    title: '内容管理',
    cacheable: true,
    icon: 'ri:article-line',
  },
  children: [
    {
      path: 'banner',
      name: 'contentBanner',
      component: () => import('@/views/content/banner/index.vue'),
      meta: {
        title: 'Banner 管理',
        auth: ['content.banner.view'],
      },
    },
    {
      path: 'message-board-post',
      name: 'contentMessageBoardPost',
      component: () => import('@/views/content/message-board-post/index.vue'),
      meta: {
        title: '留言板',
        auth: ['content.messageBoardPost.view'],
      },
    },
  ],
}

export default routes
